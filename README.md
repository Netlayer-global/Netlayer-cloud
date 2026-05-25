# NetLayer Cloud

Production-grade VPS cloud platform inspired by DigitalOcean, Vultr, Linode,
and Latitude.sh. Built for developers who want a fast, transparent,
India-first cloud provider.

[![CI](https://github.com/Netlayer-global/Netlayer-cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/Netlayer-global/Netlayer-cloud/actions/workflows/ci.yml)

## What's inside

- **Frontend**: React 18 + Vite + TypeScript + Tailwind v3 + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma (Postgres / SQLite)
- **Realtime**: Socket.io with Redis adapter for horizontal scaling
- **Jobs**: BullMQ with in-memory fallback when Redis isn't available
- **Compute**: Proxmox VE 8.x with linked-clone Packer images (~30s deploys)
- **Storage**: MinIO (S3-compatible) + Ceph RBD configs ready
- **Observability**: Prometheus + Grafana + Loki + Jaeger preconfigured
- **Payments**: Razorpay (India) + Stripe (international) with webhook signature verification
- **Billing**: India-GST-compliant sequential invoice numbering, credit notes, GSTR-1 export

## Features that ship today

| Capability | Status |
|---|---|
| User auth + 2FA + RBAC | ✅ |
| Customer dashboard | ✅ |
| Admin panel (full operator suite) | ✅ |
| Wallet billing + Razorpay/Stripe top-up | ✅ |
| 30-second VPS deploy (linked clones) | ✅ |
| Block volumes + object storage + managed DBs | ✅ |
| VPC + DNS zones + load balancers | ✅ |
| Floating IPs + IP pools | ✅ |
| Snapshots + alerts + capacity planning | ✅ |
| Marketplace (12 one-click apps) | ✅ |
| Sequential invoice numbering (India FY) | ✅ |
| Credit notes + GSTR-1 CSV export | ✅ |
| Recurring billing + dunning workflow | ✅ |
| CLI + Terraform provider | ✅ |
| Production Docker stack with Caddy auto-TLS | ✅ |
| 39 backend tests + 9 frontend tests, type-safe end-to-end | ✅ |

## Quick start (development)

```bash
git clone https://github.com/Netlayer-global/Netlayer-cloud.git
cd Netlayer-cloud

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173 — login with `admin@netlayer.com` / `Admin@123456`.

## Production deployment

See [`docs/PRODUCTION.md`](docs/PRODUCTION.md) for the full runbook.

TL;DR — on a fresh Ubuntu 22.04 / Debian 12 box with public IP + DNS pointed:

```bash
curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy.sh | sudo bash
sudo nano /opt/netlayer/.env.prod    # set CADDY_DOMAIN + integration keys
sudo bash /opt/netlayer/scripts/deploy.sh
```

The deploy script installs Docker, clones the repo to `/opt/netlayer`, runs
`prisma migrate deploy` against Postgres, boots the full stack behind
Caddy (auto-issued Let's Encrypt TLS), and seeds idempotently. Re-running
the script upgrades the platform.

## Architecture

```
                     Caddy (TLS, gzip, rate-limit)
                              │
                  ┌───────────┴───────────┐
            Frontend (nginx)         Backend (Express)
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                │                         │                         │
            Postgres                   Redis                     MinIO
                                          │
                                  Proxmox cluster
                                  (compute hosts)
```

## Repository layout

```
backend/                 — Express API + Prisma schema + jobs
frontend/                — React SPA + admin panel + landing
agent/                   — Go agent that runs on each Proxmox host
cli/                     — Node.js CLI (`nl ...`)
terraform-provider-netlayer/ — Terraform provider
packer/                  — Golden image build pipeline
observability/           — Prometheus / Grafana / Loki / Jaeger compose
deploy/                  — Kubernetes manifests + ArgoCD configs
infra/                   — Terraform for cloud provisioning of host VMs
scripts/                 — deploy.sh, backup.sh, helpers
docs/                    — PRODUCTION.md + architecture docs
docker-compose.yml       — local dev infra (Postgres + Redis + MinIO)
docker-compose.prod.yml  — single-host production stack
Caddyfile                — production reverse proxy config
```

## Documentation

- [Production runbook](docs/PRODUCTION.md) — deployment, upgrades, backup/restore
- [Architecture overview](#architecture) — top-level system design
- API reference — `https://your-deployment.com/docs` (auto-generated Swagger)
- OpenAPI spec — `https://your-deployment.com/api/openapi.json`
- Customer-facing docs — `https://your-deployment.com/docs`

## Testing

```bash
cd backend && npm test           # 39 tests
cd frontend && npm test          # 9 tests
```

CI runs on every push to `main` and PR — backend tests, frontend tests,
typecheck, and Docker image build matrix.

## Contributing

Issues + PRs welcome. The codebase follows these conventions:

- **No stubs** — every feature must work end-to-end in mock mode
- **30+ test green requirement** — no merge if tests fail
- **TypeScript strict** — no `any` without comment justifying it
- **Mock mode default** — every integration starts in mock and flips to live via env
- **India-first** — all billing logic correctly handles GSTIN, fiscal year, and CGST/SGST/IGST split

## License

Proprietary — © 2025 NetLayer Cloud Pvt. Ltd. Some folders may carry their
own permissive licenses (CLI, Terraform provider, agent) — see individual
README files.
