# NetLayer Cloud — Kubernetes deployment

Production deployment uses Kustomize + ArgoCD with Argo Rollouts for canary
traffic shifting.

## Layout

```
deploy/
  k8s/
    base/                          base Kustomize resources
      api-deployment.yaml          plain rolling Deployment (used by staging)
      api-rollout-canary.yaml      Argo Rollouts canary (used by production)
      kustomization.yaml
    overlays/
      staging/                     staging-specific patches (1 replica, latest tag)
      production/                  production patches (6 replicas, stable tag, canary)
  argocd/
    app-of-apps.yaml               root ArgoCD Application
    apps/
      netlayer-api-staging.yaml    auto-sync, prune, self-heal
      netlayer-api-production.yaml manual approval gate
```

## First time setup

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Install Argo Rollouts (for canary)
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Bootstrap NetLayer apps
kubectl apply -f deploy/argocd/app-of-apps.yaml
```

## How a release flows

1. Engineer pushes to `main`
2. GitHub Actions builds + pushes the API image to GHCR with two tags:
   `:latest` (always) and `:sha-<git-hash>` (immutable)
3. ArgoCD picks up the staging tag change within 60 seconds and rolls out the
   pod
4. After validation (synthetic checks, smoke tests), an engineer bumps
   `overlays/production/kustomization.yaml` `newTag: stable` to point at the
   tested SHA and opens a PR
5. On merge, ArgoCD picks up the change but waits for manual sync
6. Engineer hits "Sync" in ArgoCD UI; Argo Rollouts begins the canary
7. Rollout pauses at each step; the AnalysisTemplate watches Prometheus's
   `success-rate` metric — if it drops below 99% the rollout aborts and
   reverts to stable automatically

## Blue/green alternative

For services that can't tolerate even a small canary error rate (auth,
billing webhooks), swap the canary `strategy:` block in
`api-rollout-canary.yaml` for blueGreen:

```yaml
strategy:
  blueGreen:
    activeService: netlayer-api
    previewService: netlayer-api-preview
    autoPromotionEnabled: false
    prePromotionAnalysis:
      templates: [{ templateName: success-rate }]
```

A second copy of every pod runs alongside the live pods. Once
the prePromotionAnalysis passes, traffic flips atomically; no traffic ever
hits an in-progress rollout.
