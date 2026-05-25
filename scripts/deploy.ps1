###############################################################################
# NetLayer Cloud — Windows production deploy / smoke-test script (Round 21)
###############################################################################
# Builds Docker images and runs the production stack locally on Windows
# Docker Desktop or against a remote Docker host. Useful for verifying the
# Dockerfiles + docker-compose.prod.yml + Caddyfile before pushing to a VPS.
#
# Usage (PowerShell, repo root):
#   .\scripts\deploy.ps1                    # build + boot
#   .\scripts\deploy.ps1 -Logs              # tail backend logs
#   .\scripts\deploy.ps1 -Down              # stop everything
###############################################################################

param(
    [switch]$Logs,
    [switch]$Down,
    [string]$EnvFile = ".env.prod"
)

$ErrorActionPreference = 'Stop'

$ComposeFile = "docker-compose.prod.yml"

function Log($msg) { Write-Host "[deploy] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[warn] $msg" -ForegroundColor Yellow }

if ($Down) {
    Log "Stopping stack"
    docker compose -f $ComposeFile down
    exit 0
}

if ($Logs) {
    docker compose -f $ComposeFile logs -f --tail 200 backend
    exit 0
}

# ── 1. Verify Docker ───────────────────────────────────────
try {
    docker version | Out-Null
} catch {
    Warn "Docker Desktop is not running. Start it and re-run this script."
    exit 1
}

# ── 2. .env.prod ───────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Log "Generating $EnvFile with random secrets"
    $pgPwd = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
    $rdPwd = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
    $jwt = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
    $jwtR = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })

    @"
# NetLayer Cloud — local production smoke-test
# Generated: $(Get-Date -Format 'u')
CADDY_DOMAIN=localhost
FRONTEND_URL=http://localhost
POSTGRES_DB=netlayer
POSTGRES_USER=netlayer
POSTGRES_PASSWORD=$pgPwd
REDIS_PASSWORD=$rdPwd
JWT_SECRET=$jwt
JWT_REFRESH_SECRET=$jwtR
PROXMOX_MOCK_MODE=true
SMS_PROVIDER=mock
"@ | Set-Content -Path $EnvFile -Encoding UTF8

    Warn "Created $EnvFile with random secrets."
    Log "Caddy will fail to issue a real cert for 'localhost' — that's expected."
    Log "Override CADDY_DOMAIN to a real DNS name to test TLS. For local smoke-test it's fine."
}

# ── 3. Pre-create data directories ────────────────────────
$dirs = "data\postgres", "data\redis", "data\caddy", "data\caddy-config", "data\backups"
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

# ── 4. Build + boot ───────────────────────────────────────
Log "Building images (first build takes 3-5 minutes)"
docker compose --env-file $EnvFile -f $ComposeFile build --pull
if ($LASTEXITCODE -ne 0) { exit 1 }

Log "Booting stack"
docker compose --env-file $EnvFile -f $ComposeFile up -d
if ($LASTEXITCODE -ne 0) { exit 1 }

# ── 5. Wait for backend health ────────────────────────────
Log "Waiting for backend health check"
$attempts = 0
$ready = $false
while ($attempts -lt 30 -and -not $ready) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/healthz" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true }
    } catch {
        # Try direct backend bypass too
        try {
            docker compose -f $ComposeFile exec -T backend wget -q -O- http://localhost:5000/healthz | Out-Null
            if ($LASTEXITCODE -eq 0) { $ready = $true }
        } catch {}
    }
    $attempts++
}

if ($ready) {
    Log "Stack is up. Caddy listens on http://localhost (port 80, redirects to https)."
    Log "If running locally, hit https://localhost — accept the self-signed cert."
} else {
    Warn "Backend didn't pass health check after 60s. Check logs: docker compose -f $ComposeFile logs backend"
}

# ── 6. First-boot seed (idempotent) ───────────────────────
Log "Running seed (idempotent)"
docker compose --env-file $EnvFile -f $ComposeFile exec -T backend npx prisma db seed
if ($LASTEXITCODE -ne 0) { Warn "Seed step skipped/failed (often expected on re-deploy)" }

# ── 7. Status summary ─────────────────────────────────────
Log "Container status:"
docker compose --env-file $EnvFile -f $ComposeFile ps
Write-Host ""
Log "Useful commands:"
Write-Host "  Tail logs:    .\scripts\deploy.ps1 -Logs"
Write-Host "  Stop stack:   .\scripts\deploy.ps1 -Down"
Write-Host "  Backup DB:    docker compose -f $ComposeFile exec -T postgres pg_dump -U netlayer netlayer > backup.sql"
