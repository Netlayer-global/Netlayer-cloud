#!/usr/bin/env bash
###############################################################################
# NetLayer Cloud — backup script
###############################################################################
# Dumps Postgres + key state into ./data/backups/$(date)/.
# Designed to run from cron:  0 3 * * *  /opt/netlayer/scripts/backup.sh
#
# Retention: keeps last 14 days of full dumps. Adjust BACKUP_KEEP_DAYS env.

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/netlayer}"
ENV_FILE="$INSTALL_DIR/.env.prod"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.prod.yml"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

source "$ENV_FILE"

DATE="$(date -u +%Y-%m-%dT%H%M%SZ)"
DIR="$INSTALL_DIR/data/backups/$DATE"
mkdir -p "$DIR"

log() { printf '[backup %s] %s\n' "$DATE" "$1"; }

# Postgres dump (custom format → fast restore)
log "dumping postgres"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-netlayer}" -d "${POSTGRES_DB:-netlayer}" -Fc \
  > "$DIR/postgres.dump"

# Redis snapshot — Bull queues + caches
log "snapshotting redis"
docker compose -f "$COMPOSE_FILE" exec -T redis \
  redis-cli -a "$REDIS_PASSWORD" --no-auth-warning save >/dev/null
docker compose -f "$COMPOSE_FILE" cp redis:/data/dump.rdb "$DIR/redis.rdb" 2>/dev/null || true

# Caddy certs (if present)
[[ -d "$INSTALL_DIR/data/caddy" ]] && tar -C "$INSTALL_DIR/data" -czf "$DIR/caddy.tgz" caddy

# Compress
log "compressing"
tar -C "$INSTALL_DIR/data/backups" -czf "$INSTALL_DIR/data/backups/${DATE}.tgz" "$DATE"
rm -rf "$DIR"

# Prune old
log "pruning > ${BACKUP_KEEP_DAYS} days"
find "$INSTALL_DIR/data/backups" -name '*.tgz' -mtime "+$BACKUP_KEEP_DAYS" -delete

log "done — $(ls -lh "$INSTALL_DIR/data/backups/${DATE}.tgz" | awk '{print $5}')"
