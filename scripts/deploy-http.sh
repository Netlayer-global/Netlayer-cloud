#!/usr/bin/env bash
###############################################################################
# NetLayer Cloud — HTTP (port 80) deployment for Ubuntu / Debian
###############################################################################
# One-shot, IP-based deploy with NO domain / NO TLS — perfect for first
# testing. Installs every prerequisite (Docker Engine + Compose plugin),
# clones/updates the repo, generates secrets, and boots the full stack on
# port 80.
#
# Run as root (or with sudo):
#   curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy-http.sh | sudo bash
# or after a git clone:
#   sudo bash scripts/deploy-http.sh
#
# Re-running upgrades the stack in place (git reset --hard origin/main).
# Once you have a domain, switch to scripts/deploy.sh for auto-HTTPS.
###############################################################################

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Netlayer-global/Netlayer-cloud.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/netlayer}"
ENV_FILE="$INSTALL_DIR/.env.prod"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.prod.yml"

log()  { printf '\033[1;32m[deploy]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n'   "$1"; }
fail() { printf '\033[1;31m[fail]\033[0m %s\n'   "$1" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "must run as root (use: sudo bash scripts/deploy-http.sh)"

# ── 1. Prerequisites ────────────────────────────────────────
log "updating apt + installing base packages (git, curl, openssl, ca-certificates)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git openssl

# ── 2. Docker Engine + Compose plugin ───────────────────────
if ! command -v docker >/dev/null 2>&1; then
  log "installing Docker Engine (get.docker.com)"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker || warn "could not enable docker via systemctl (may be fine in containers)"

if ! docker compose version >/dev/null 2>&1; then
  log "installing docker compose plugin"
  apt-get install -y docker-compose-plugin || fail "failed to install docker-compose-plugin"
fi

log "docker: $(docker --version)"
log "compose: $(docker compose version | head -n1)"

# ── 3. Free port 80 (stop common conflicts) ─────────────────
for svc in apache2 nginx; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    warn "stopping $svc to free port 80"
    systemctl stop "$svc" || true
    systemctl disable "$svc" || true
  fi
done

# ── 4. Fetch / update repo ──────────────────────────────────
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  log "cloning $REPO_URL → $INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  log "pulling latest from origin/main"
  git -C "$INSTALL_DIR" fetch --all --prune
  git -C "$INSTALL_DIR" reset --hard origin/main
fi

cd "$INSTALL_DIR"

# ── 5. .env.prod (auto-generate on first run) ───────────────
PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo localhost)"

if [[ ! -f "$ENV_FILE" ]]; then
  log "generating .env.prod with random secrets (HTTP mode, IP: $PUBLIC_IP)"
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  REDIS_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 32)"
  JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<ENV
# ── NetLayer Cloud — HTTP (port 80) .env ──────────────────
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

# HTTP-only deploy — serve by IP on port 80, no TLS.
CADDYFILE=Caddyfile.http
CADDY_DOMAIN=$PUBLIC_IP
FRONTEND_URL=http://$PUBLIC_IP

# Database (auto-generated)
POSTGRES_DB=netlayer
POSTGRES_USER=netlayer
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Cache (auto-generated)
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT secrets (auto-generated)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# ── INTEGRATIONS — mock mode by default; fill in to go live ──
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM=NetLayer Cloud <noreply@example.com>
SMS_PROVIDER=mock
MSG91_API_KEY=
MSG91_SENDER=NETLYR
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_DOMAIN=example.com
PROXMOX_MOCK_MODE=true
ENV
  chmod 0600 "$ENV_FILE"
else
  log "re-using existing $ENV_FILE"
  # Ensure HTTP mode is selected even on an older env file.
  grep -q '^CADDYFILE=' "$ENV_FILE" || echo 'CADDYFILE=Caddyfile.http' >> "$ENV_FILE"
fi

# ── 6. Pre-flight dirs ──────────────────────────────────────
mkdir -p "$INSTALL_DIR/data/postgres" \
         "$INSTALL_DIR/data/redis" \
         "$INSTALL_DIR/data/caddy" \
         "$INSTALL_DIR/data/caddy-config" \
         "$INSTALL_DIR/data/backups" \
         "$INSTALL_DIR/data/iso"

# ── 7. Build + boot ─────────────────────────────────────────
log "building images (first build can take a few minutes)"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull

log "booting stack on port 80"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# ── 8. First-boot seed (idempotent) ─────────────────────────
log "running seed (idempotent — safe on re-deploy)"
sleep 5
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  npx prisma db seed || warn "seed step skipped/failed (often expected on re-deploy)"

# ── 9. Status ───────────────────────────────────────────────
log "deployment complete"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
echo
log "Website is live →  http://$PUBLIC_IP/"
log "Dashboard       →  http://$PUBLIC_IP/login"
log "Admin           →  http://$PUBLIC_IP/admin/login"
log "API docs        →  http://$PUBLIC_IP/api-docs"
echo
log "Tail logs:  docker compose -f $COMPOSE_FILE logs -f"
log "Stop:       docker compose -f $COMPOSE_FILE down"
