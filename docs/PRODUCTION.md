# NetLayer Cloud — Production Deployment Runbook

This is the end-to-end guide for installing NetLayer on a real server, going
live with paying customers, and operating the platform day-to-day.

## TL;DR

```bash
# On a fresh Ubuntu 22.04 / Debian 12 host with public IP + DNS pointed:
curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy.sh | sudo bash
sudo nano /opt/netlayer/.env.prod    # set CADDY_DOMAIN + integration keys
sudo bash /opt/netlayer/scripts/deploy.sh
```

Open `https://your-domain.com` — landing page should load over auto-issued
Let's Encrypt TLS within 60 seconds.

## Architecture

```
                     ┌────────────────────────┐
                     │   Caddy (TLS, gzip)    │  :80, :443
                     └────────────┬───────────┘
                                  │
              ┌───────────────────┼─────────────────┐
              │                   │                 │
       ┌──────▼──────┐    ┌───────▼──────┐  ┌──────▼─────┐
       │  Frontend   │    │   Backend    │  │  Webhooks  │
       │  (nginx +   │    │  (Express +  │  │  (Razorpay │
       │   Vite SPA) │    │  Socket.io)  │  │   Stripe)  │
       └─────────────┘    └──────┬───────┘  └────────────┘
                                 │
              ┌──────────────────┼─────────────────┐
              │                  │                 │
        ┌─────▼─────┐     ┌──────▼─────┐    ┌─────▼─────┐
        │ Postgres  │     │   Redis    │    │   MinIO   │
        │   (15)    │     │  (BullMQ)  │    │  (object  │
        └───────────┘     └────────────┘    │  storage) │
                                            └───────────┘
                                 │
                          ┌──────▼──────┐
                          │  Proxmox    │  (compute hosts)
                          │  cluster    │
                          └─────────────┘
```

## Prerequisites

| Item | Notes |
|---|---|
| Server | 4 vCPU / 8 GB RAM minimum for control plane (we recommend 8 vCPU / 16 GB / 100 GB NVMe) |
| OS | Ubuntu 22.04 LTS or Debian 12 |
| Public IP | Static, no NAT |
| DNS | A record `app.your-domain.com` → server IP (TLS depends on this) |
| Ports open | 80, 443 inbound; 22 SSH (lock down by IP) |
| Outbound | unrestricted (Razorpay, Stripe, Resend, Cloudflare, Proxmox API) |

For real VM deployment you also need:

| Item | Notes |
|---|---|
| Proxmox cluster | 1+ node minimum (8 vCPU / 64 GB RAM / 2× NVMe RAID). VE 8.x. |
| Network | 1 Gbps minimum, ideally 10 Gbps |
| IPv4 pool | /24 minimum recommended |

## First-time setup

### Step 1. Server install

SSH into the box as root or sudoer:

```bash
curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy.sh | sudo bash
```

The script will:

1. Install Docker Engine + Compose v2 if missing
2. Clone the repo to `/opt/netlayer`
3. Generate `/opt/netlayer/.env.prod` with random Postgres/Redis/JWT secrets
4. Stop and ask you to fill the integration keys

### Step 2. Edit secrets

```bash
sudo nano /opt/netlayer/.env.prod
```

Set at minimum:

```env
CADDY_DOMAIN=app.netlayer.com
FRONTEND_URL=https://app.netlayer.com
```

Mock mode runs without any other key. To go live, fill the integration
sections — see [Going live with real integrations](#going-live-with-real-integrations).

### Step 3. Boot the stack

```bash
sudo bash /opt/netlayer/scripts/deploy.sh
```

The script builds Docker images (~3 minutes first time), runs `prisma migrate
deploy` (creates schema in Postgres), boots all services, runs the seed
(idempotent — re-runs do nothing destructive).

### Step 4. Verify

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml ps
curl -fsS https://app.netlayer.com/healthz
curl -fsS https://app.netlayer.com/api/platform/stats | jq
```

Default admin login: `admin@netlayer.com` / `Admin@123456` (change immediately).

## Going live with real integrations

NetLayer ships with every integration in mock mode by default. Flip them one
at a time so you can verify each one in isolation.

### Razorpay (India payments)

1. Create a Razorpay account → fetch test keys
2. Edit `.env.prod`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxx
   ```
3. Configure Razorpay webhook in dashboard:
   - URL: `https://app.netlayer.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
4. In NetLayer admin → Integrations → Razorpay → flip `mockMode: false`
5. Test: register a fresh user → top up ₹10 with test card `4111 1111 1111 1111` → wallet credited

### Stripe (international payments)

1. Stripe dashboard → API keys (test mode)
2. Edit `.env.prod`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
3. Stripe webhook:
   - URL: `https://app.netlayer.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. NetLayer admin → flip `stripe.mockMode: false`

### Resend (transactional email)

1. resend.com → create API key
2. Add `RESEND_API_KEY=re_xxxxx` to `.env.prod`
3. Configure DNS for `noreply@your-domain.com`:
   ```
   TYPE  NAME              VALUE
   MX    send.your-domain  10 feedback-smtp.us-east-1.amazonses.com
   TXT   send.your-domain  "v=spf1 include:amazonses.com ~all"
   CNAME resend._domainkey  resend._domainkey.your-domain.com
   ```
4. Verify in resend.com dashboard → status: verified
5. Restart backend: `docker compose restart backend`
6. Test in admin → Integrations → Email → Send test

### MSG91 (India SMS)

1. msg91.com → create account, get API key
2. Register sender ID via DLT (5-7 working days)
3. Edit `.env.prod`:
   ```env
   SMS_PROVIDER=msg91
   MSG91_API_KEY=xxxxx
   MSG91_SENDER=NETLYR
   ```

### Cloudflare DNS

1. Add your domain to Cloudflare
2. Create scoped API token: Zone → Read + DNS → Edit
3. Edit `.env.prod`:
   ```env
   CLOUDFLARE_API_TOKEN=xxxxx
   CLOUDFLARE_ZONE_ID=xxxxx
   CLOUDFLARE_DOMAIN=netlayer.com
   ```
4. Admin → flip `cloudflare.mockMode: false`
5. Deploy a server → check Cloudflare zone → A record for `srv-xxx.netlayer.com` should appear

### Proxmox cluster

The control plane runs anywhere. Compute happens on Proxmox hosts. To wire one:

1. Provision a Proxmox VE 8.x node
2. In Proxmox UI: Datacenter → Permissions → API Tokens → create token for `netlayer@pam`
3. Build golden images:
   ```bash
   cd /opt/netlayer/packer
   bash build.sh ubuntu-22.04
   bash build.sh debian-12
   bash build.sh almalinux-9
   ```
4. Flag each as a template:
   ```bash
   ssh root@proxmox-host "qm template 9000 9001 9002"
   ```
5. NetLayer admin → Nodes → Add node:
   - Host: `https://proxmox.netlayer.com:8006`
   - Token ID: `netlayer@pam!api`
   - Token secret: (paste)
   - Test connection
6. Set `PROXMOX_MOCK_MODE=false` in `.env.prod`, restart backend
7. Run a deploy → real VM should boot in ~30s

## Operations

### Daily backups

Add to root's crontab:

```cron
0 3 * * * /opt/netlayer/scripts/backup.sh
```

Backups land in `/opt/netlayer/data/backups/`. Default retention 14 days.

For off-site backup, sync that folder nightly to S3/B2:

```cron
30 3 * * * aws s3 sync /opt/netlayer/data/backups/ s3://netlayer-backups/
```

### Updates

```bash
sudo bash /opt/netlayer/scripts/deploy.sh
```

The script `git pull`s, rebuilds images, runs new migrations, restarts the
stack with zero data loss.

### Logs

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml logs -f backend
docker compose -f /opt/netlayer/docker-compose.prod.yml logs -f --tail 100
```

For long-term aggregation, point Loki/Grafana at `/var/lib/docker/containers`
(see `observability/docker-compose.observability.yml`).

### Health checks

| URL | Expected |
|---|---|
| `https://app.netlayer.com/healthz` | `{"status":"ok"}` |
| `https://app.netlayer.com/readyz`  | `{"db":{"ok":true},"redis":{"ok":true}}` |
| `https://app.netlayer.com/api/platform/stats` | live JSON metrics |
| `https://app.netlayer.com/metrics` | Prometheus exposition |

Recommend pointing UptimeRobot / Better Uptime / Pingdom at `/healthz`.

### Restoring from backup

```bash
cd /opt/netlayer
docker compose -f docker-compose.prod.yml down
tar -xzf data/backups/YYYY-MM-DDTHHMMSSZ.tgz
docker compose -f docker-compose.prod.yml up -d postgres redis
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U netlayer -d netlayer --clean < data/backups/YYYY-MM-DDTHHMMSSZ/postgres.dump
docker compose -f docker-compose.prod.yml up -d
```

## Pre-launch checklist

Run through this before accepting paying customers:

- [ ] Domain DNS points to server (A record verified)
- [ ] Caddy auto-acquired TLS cert (`curl -I https://app.netlayer.com` shows 200 + valid cert)
- [ ] First admin login works
- [ ] Razorpay test mode top-up credits wallet correctly
- [ ] Test card refund issues credit note with sequential CN number
- [ ] Email integration: send test arrives in inbox (check spam)
- [ ] SMS integration: OTP arrives on real phone
- [ ] Proxmox: real deploy boots VM in <60s
- [ ] SSH into deployed VM works
- [ ] Status page shows all services operational
- [ ] Cron job for backups configured (`crontab -l`)
- [ ] Off-site backup destination configured
- [ ] Update default admin password from `Admin@123456`
- [ ] Privacy + Terms reviewed by legal counsel
- [ ] GST registration verified (for Razorpay payouts)
- [ ] Bank account configured in Razorpay/Stripe for settlements
- [ ] Razorpay live keys swapped in (move from test → live)
- [ ] Cloudflare proxy enabled for DDoS protection
- [ ] On-call rotation set up (PagerDuty / Better Uptime)
- [ ] All 30 backend tests pass against production Postgres

## Scaling beyond a single host

When a single host is no longer enough:

1. Move Postgres to managed service (RDS / Neon / Crunchy Data)
2. Move Redis to managed cluster (ElastiCache / Upstash)
3. Run multiple `backend` replicas behind a load balancer
4. Add a second Caddy + use sticky sessions for Socket.io OR enable
   Redis-adapter (already wired — set `REDIS_URL` and it activates)
5. Object storage to a real S3 / MinIO cluster
6. Scale Proxmox cluster horizontally — add nodes, NetLayer scheduler will
   start using them automatically once registered via `/admin/nodes`

## Troubleshooting

### Caddy won't get a cert

- Check DNS: `dig app.netlayer.com` → must return your server IP
- Check ports 80 + 443 are open inbound
- Check `/opt/netlayer/data/caddy/logs/access.log`

### Backend won't start: "Can't reach database server"

- `docker compose logs postgres` — is it healthy?
- `.env.prod` has correct `POSTGRES_PASSWORD`?
- Database volume corrupted? Restore from latest backup.

### Webhooks 403 / signature mismatch

- Verify `RAZORPAY_WEBHOOK_SECRET` matches what's set in Razorpay dashboard
- Caddy is forwarding raw body? Yes by default — but check `Content-Type` is preserved

### Mock mode still on after editing .env

- `docker compose restart backend` — env vars only re-read on container restart
- Confirm with `docker compose exec backend env | grep RAZORPAY`

## Support

- Documentation: `https://app.netlayer.com/docs`
- Status page: `https://app.netlayer.com/status`
- Issue tracker: `https://github.com/Netlayer-global/Netlayer-cloud/issues`
- Email: `support@netlayer.com`
