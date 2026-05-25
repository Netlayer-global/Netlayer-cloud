#!/usr/bin/env bash
###############################################################################
# NetLayer Cloud — production deployment script (Round 21)
###############################################################################
# Idempotent one-shot deploy/update on a fresh Ubuntu 22.04 / Debian 12 host.
# Run as root (or sudo). Re-running upgrades the stack in place.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy.sh | sudo bash
# or, after git clone:
#   sudo bash scripts/deploy.sh
###############################################################################

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Netlayer-global/Netlayer-cloud.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/netlayer}"
ENV_FILE="$INSTALL_DIR/.env.prod"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.prod.yml"

log() { printf '\033[1;32m[deploy]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31m[fail]\033[0m %s\n' "$1" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "must run as root (sudo)"

# ── 1. Docker ───────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  log "installing Docker Engine"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  fail "Docker Compose v2 missing — install via 'apt install docker-compose-plugin'"
fi

# ── 2. Fetch repo ───────────────────────────────────────────
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  log "cloning $REPO_URL → $INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  log "pulling latest"
  git -C "$INSTALL_DIR" fetch --all --prune
  git -C "$INSTALL_DIR" reset --hard origin/main
fi

cd "$INSTALL_DIR"

# ── 3. .env.prod ────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  log "generating fresh .env.prod with random secrets"
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  REDIS_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 32)"
  JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<ENV
# ── NetLayer Cloud production .env ────────────────────────
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# IMPORTANT: keep this file 0600 + never commit it.

# Required: domain (must point to this server's public IP)
CADDY_DOMAIN=app.example.com
FRONTEND_URL=https://app.example.com

# Database (auto-generated)
POSTGRES_DB=netlayer
POSTGRES_USER=netlayer
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Cache (auto-generated)
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT secrets (auto-generated)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# ── INTEGRATIONS — start in mock mode, fill these in to go live ──

# Razorpay (India)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Stripe (international)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM=NetLayer Cloud <noreply@example.com>

# SMS — set SMS_PROVIDER=msg91 or twilio to enable, leave 'mock' for dev
SMS_PROVIDER=mock
MSG91_API_KEY=
MSG91_SENDER=NETLYR
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

# Cloudflare DNS
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_DOMAIN=example.com

# Proxmox — set to false once a real cluster is wired
PROXMOX_MOCK_MODE=true
ENV
  chmod 0600 "$ENV_FILE"
  warn "Edit $ENV_FILE with your CADDY_DOMAIN + integration keys, then re-run."
  exit 0
fi

# ── 4. Pre-flight ───────────────────────────────────────────
mkdir -p "$INSTALL_DIR/data/postgres" \
         "$INSTALL_DIR/data/redis" \
         "$INSTALL_DIR/data/caddy" \
         "$INSTALL_DIR/data/caddy-config" \
         "$INSTALL_DIR/data/backups"

# ── 5. Build + boot ─────────────────────────────────────────
log "building images"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull

log "booting stack"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# ── 6. First-boot seed (idempotent) ─────────────────────────
log "running seed (idempotent — safe on re-deploy)"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  npx prisma db seed || warn "seed step skipped/failed (often expected on re-deploy)"

# ── 7. Status ───────────────────────────────────────────────
log "deployment complete"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
echo
log "Tail logs:   docker compose -f $COMPOSE_FILE logs -f"
log "Stop:        docker compose -f $COMPOSE_FILE down"
log "Backup:      bash $INSTALL_DIR/scripts/backup.sh"
