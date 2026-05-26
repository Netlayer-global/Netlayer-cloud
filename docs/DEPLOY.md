# NetLayer Cloud — Real Server Deployment Guide

End-to-end walkthrough: bare Ubuntu 22.04 host → live cloud platform with paying customers.

**Time budget**: ~90 minutes if all credentials are ready. Most of that is waiting (DNS propagation, image builds, etc.).

---

## Phase 0 — Prerequisites Checklist

Before SSH-ing into your server, gather these:

| Item | Where to get it |
|---|---|
| **Server** | Hetzner Cloud / DigitalOcean / OVH — Ubuntu 22.04 LTS, min 4 vCPU / 8 GB / 80 GB NVMe, ~₹600-1,200/month |
| **Domain** | Namecheap / GoDaddy / Cloudflare Registrar |
| **Cloudflare account** | cloudflare.com — free tier is fine |
| **Razorpay account** | razorpay.com — KYC done, bank account verified |
| **Resend API key** | resend.com — free tier (100 emails/day) for testing |
| **MSG91 account (optional)** | msg91.com — for India SMS, requires DLT registration (5-7 days) |
| **Stripe account (optional)** | stripe.com — only if accepting USD/EUR/GBP |
| **Proxmox host (for real VMs)** | Hetzner / OVH dedicated server, 8+ cores, 64 GB+ RAM, ~₹15,000/month |

Save all these credentials to a password manager. You'll need them in Phase 4.

---

## Phase 1 — Provision the Control Plane Server

### 1.1 Pick a hosting provider

**Recommended for India**: Hetzner Cloud Helsinki / Nuremberg (good price, good network), or AWS Mumbai if you need same-region as customers.

**Specs**:
- **Minimum**: CX21 (2 vCPU / 4 GB / 40 GB) — only for low traffic
- **Recommended**: CPX31 (4 vCPU / 8 GB / 240 GB) — handles 10,000 customers
- **High traffic**: CCX23 (4 dedicated vCPU / 16 GB / 240 GB)

### 1.2 Create the server

In your provider's dashboard:
1. **OS**: Ubuntu 22.04 LTS
2. **SSH key**: Add your public key (`~/.ssh/id_ed25519.pub`)
3. **Firewall**: Allow inbound 22 (SSH), 80 (HTTP), 443 (HTTPS). Lock 22 to your IP if possible.
4. **Public IP**: Note it down (e.g. `203.0.113.42`)

### 1.3 Verify SSH

```bash
ssh root@203.0.113.42
# (you should land in a fresh Ubuntu shell)
```

---

## Phase 2 — DNS Setup

### 2.1 Pick your subdomain

Decide what your platform will live at, e.g. `app.netlayer.com` or just `netlayer.com`.

### 2.2 Add A record

In Cloudflare DNS dashboard:

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | `app` | `203.0.113.42` (your server IP) | DNS only (orange cloud OFF for now) | Auto |

**Important**: Keep proxy OFF for first deploy so Caddy can do HTTP-01 cert challenge. After cert is issued, you can flip it on for DDoS protection.

### 2.3 Verify

```bash
dig app.netlayer.com
# should return your server IP within 1-2 minutes
```

---

## Phase 3 — One-Shot Deploy

### 3.1 Run the installer

SSH into your server:

```bash
ssh root@203.0.113.42
curl -sSL https://raw.githubusercontent.com/Netlayer-global/Netlayer-cloud/main/scripts/deploy.sh | sudo bash
```

This will:
1. Install Docker Engine + Compose v2 (~2 min)
2. Clone the repo to `/opt/netlayer`
3. Generate `/opt/netlayer/.env.prod` with random Postgres/Redis/JWT secrets
4. Stop and ask you to fill in the rest

### 3.2 Edit `.env.prod`

```bash
sudo nano /opt/netlayer/.env.prod
```

Set these values (we'll fill the integration keys in Phase 4):

```env
CADDY_DOMAIN=app.netlayer.com
FRONTEND_URL=https://app.netlayer.com
```

### 3.3 Boot the stack

```bash
sudo bash /opt/netlayer/scripts/deploy.sh
```

This will:
1. Build the Docker images (~3-4 min on first run)
2. Run `prisma migrate deploy` against Postgres
3. Boot all services
4. Caddy will request a Let's Encrypt cert (~30-60 seconds)
5. Run the seed (idempotent on re-deploy)

### 3.4 Verify health

```bash
curl -fsS https://app.netlayer.com/healthz
# expected: {"status":"ok","ts":1759..."}

curl -fsS https://app.netlayer.com/api/platform/stats | jq
# expected: live JSON metrics
```

Open `https://app.netlayer.com` in a browser. You should see the landing page with valid TLS.

### 3.5 First admin login

Default credentials (CHANGE IMMEDIATELY):

- **Admin**: `admin@netlayer.com` / `Admin@123456`
- **Super Admin**: `super@netlayer.com` / `Super@123456`

Login → Settings → Change password.

---

## Phase 4 — Wire Real Integrations

NetLayer ships with every integration in mock mode. Flip them on one by one.

### 4.1 Razorpay (India payments) — required for INR

1. Razorpay Dashboard → Settings → API Keys → Generate Test Key (start with test, swap for live after smoke-tests pass)
2. Razorpay → Settings → Webhooks → Add new
   - URL: `https://app.netlayer.com/api/webhooks/razorpay`
   - Active events: `payment.captured`, `payment.failed`, `refund.processed`
   - Generate webhook secret
3. Edit `.env.prod`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxx
   ```
4. Restart backend: `cd /opt/netlayer && docker compose -f docker-compose.prod.yml restart backend`
5. **Test flow**:
   - Open the live site in incognito
   - Register a fresh user (will land in `retail` mode)
   - Go to Deploy → pick `c2.small` / Mumbai / Ubuntu 22.04
   - Click Deploy → Razorpay popup opens
   - Pay with test card `4111 1111 1111 1111`, CVV `123`, any future expiry
   - Watch DevServer page → server should transition AWAITING_PAYMENT → PENDING → BUILDING → RUNNING within 12-30 seconds (mock mode) or 30-60 seconds (real Proxmox)

### 4.2 Resend email — required for password reset, server-ready alerts

1. resend.com → Domains → Add `netlayer.com`
2. Add the DNS records they show:
   - **MX**: `send.netlayer.com` → `feedback-smtp.us-east-1.amazonses.com` priority 10
   - **TXT (SPF)**: `send.netlayer.com` → `"v=spf1 include:amazonses.com ~all"`
   - **CNAME**: `resend._domainkey` → `resend._domainkey.netlayer.com`
3. Click **Verify** in Resend dashboard (takes 5-10 min for DNS to propagate)
4. resend.com → API Keys → Create
5. Edit `.env.prod`:
   ```env
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM=NetLayer Cloud <noreply@netlayer.com>
   ```
6. Restart: `docker compose -f docker-compose.prod.yml restart backend`
7. **Test**: Admin → Integrations → Email → Send test → check inbox

### 4.3 Cloudflare DNS — required for customer subdomains

Each deployed server gets a hostname like `srv-abc123.netlayer.com`. We auto-create the A record.

1. Cloudflare → API Tokens → Create Token
   - Permissions: Zone → Read; Zone → DNS → Edit
   - Zone Resources: Include → Specific Zone → `netlayer.com`
2. Edit `.env.prod`:
   ```env
   CLOUDFLARE_API_TOKEN=xxxxx
   CLOUDFLARE_ZONE_ID=xxxxx       # from zone overview page
   CLOUDFLARE_DOMAIN=netlayer.com
   ```
3. Admin → Integrations → Cloudflare → flip `mockMode: false`
4. Restart backend
5. Deploy a server → check Cloudflare DNS for the new A record

### 4.4 MSG91 / Twilio (optional — for SMS OTPs and alerts)

**For India**: MSG91 + DLT-registered template (5-7 working days for DLT).
**For international**: Twilio.

```env
SMS_PROVIDER=msg91          # or 'twilio' or 'mock'
MSG91_API_KEY=xxxxx
MSG91_SENDER=NETLYR
# OR
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM=+1...
```

### 4.5 Go live with Razorpay

After test mode passes:

1. Razorpay Dashboard → Settings → API Keys → Generate **Live** keys
2. Update webhook to live mode + new URL (same URL, just enable live events)
3. Replace `rzp_test_*` with `rzp_live_*` in `.env.prod`
4. Restart backend
5. Test with a real ₹1 payment, then refund

---

## Phase 5 — Real Proxmox Cluster

This is what makes deployed VMs **actually run**. Until you do this, every VM is a mock.

### 5.1 Provision a Proxmox host

**Hetzner / OVH dedicated server**:
- 8+ physical cores, 64+ GB RAM, 2× 1TB NVMe RAID-1
- Public IPv4 + IPv6
- Install **Proxmox VE 8.x** (most providers have a 1-click install)

### 5.2 Configure Proxmox

SSH into Proxmox host as root:

```bash
# Create a non-root API user
pveum useradd netlayer@pam --comment "NetLayer API"

# Create role with required permissions
pveum role add netlayer-role -privs "VM.Allocate,VM.Audit,VM.Clone,VM.Config.CDROM,VM.Config.Cloudinit,VM.Config.CPU,VM.Config.Disk,VM.Config.HWType,VM.Config.Memory,VM.Config.Network,VM.Config.Options,VM.Console,VM.Migrate,VM.Monitor,VM.PowerMgmt,VM.Snapshot,Datastore.AllocateSpace,Datastore.Audit,Sys.Audit"

# Grant the role
pveum aclmod / -user netlayer@pam -role netlayer-role

# Create API token
pveum user token add netlayer@pam api --privsep 0
# (save the secret it prints — you'll never see it again)
```

### 5.3 Build golden images with Packer

On your local machine (or a build host):

```bash
git clone https://github.com/Netlayer-global/Netlayer-cloud.git
cd Netlayer-cloud/packer

# Set Proxmox creds
export PROXMOX_URL="https://proxmox.netlayer.com:8006/api2/json"
export PROXMOX_USERNAME="netlayer@pam"
export PROXMOX_TOKEN="api=<the-secret-from-step-5.2>"

# Build each OS (takes ~10 min each)
packer init .
packer build -var "vm_id=9000" ubuntu-2204.pkr.hcl
packer build -var "vm_id=9001" debian-12.pkr.hcl
packer build -var "vm_id=9002" almalinux-9.pkr.hcl
```

### 5.4 Flag templates

On Proxmox host:

```bash
qm template 9000   # Ubuntu 22.04
qm template 9001   # Debian 12
qm template 9002   # AlmaLinux 9
```

### 5.5 Register the node in NetLayer admin

1. NetLayer admin → Nodes → Add node
2. Fill in:
   - **Name**: `bom1-node-01`
   - **Region**: Mumbai
   - **Proxmox host**: `https://proxmox.netlayer.com:8006`
   - **Token ID**: `netlayer@pam!api`
   - **Token secret**: (paste)
   - **Total CPU / RAM / Disk**: from `lscpu` / `free -g` / `df -h`
3. Click **Test connection** → should succeed
4. Save

### 5.6 Update OS templates with template VMIDs

In NetLayer admin → ISO library / Database (or directly in DB):

```sql
UPDATE os_templates SET template_vmid = 9000 WHERE slug = 'ubuntu-22-04';
UPDATE os_templates SET template_vmid = 9001 WHERE slug = 'debian-12';
UPDATE os_templates SET template_vmid = 9002 WHERE slug = 'almalinux-9';
```

### 5.7 Switch from mock to real

Edit `/opt/netlayer/.env.prod`:

```env
PROXMOX_MOCK_MODE=false
```

Restart backend:

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml restart backend
```

### 5.8 Test real deploy

Register a customer → Deploy → pay → server should appear on Proxmox host within 30-60 seconds. SSH into it from your machine to verify.

---

## Phase 6 — Set Up Operations

### 6.1 Daily backups

```bash
sudo crontab -e
```

Add:
```
0 3 * * * /opt/netlayer/scripts/backup.sh
```

This runs every night at 3 AM, dumps Postgres + Redis + Caddy certs to `/opt/netlayer/data/backups/`. Keeps last 14 days.

### 6.2 Off-site backups (recommended)

Set up an S3 bucket / Backblaze B2 bucket:

```bash
sudo crontab -e
```

Add:
```
30 3 * * * aws s3 sync /opt/netlayer/data/backups/ s3://my-netlayer-backups/
```

### 6.3 Monitoring (optional but strongly recommended)

Point an external uptime monitor (UptimeRobot, Better Uptime, Pingdom) at:
- `https://app.netlayer.com/healthz` — primary
- `https://app.netlayer.com/readyz` — depth check
- `https://app.netlayer.com/api/platform/stats` — content check

Alert via email + SMS if unreachable for > 2 minutes.

### 6.4 Status page

Already at `https://app.netlayer.com/status`. Customers can subscribe via the email box. Admin → Status management → can post incidents.

### 6.5 Plans, pricing, and stock management

Once the stack is live, manage your catalogue from the admin panel:

- **`/admin/plans`** — full Plans CRUD. Create compute, bare-metal, GPU, and storage plans. For bare-metal/GPU plans set:
  - `cpuModel` (e.g. "AMD EPYC 7402P")
  - `diskType` (nvme / ssd / hdd) and `diskCount`
  - `raidSupported` array (raid0 / raid1 / raid10 / raid5 / raid6 / passthrough)
  - `stockTotal` — number of physical units in inventory. Set to `0` for unlimited (cloud VMs).
  - `priceYearly` — usually `priceMonthly × 10` (gives customer 2 months free)
  - Per-cycle toggles (`hourlyEnabled`, `monthlyEnabled`, `yearlyEnabled`) — e.g. bare metal usually disables hourly
- **`/admin/plans/<id>/stock`** — POST `{ delta: 5 }` adds inventory; `{ total: 20 }` sets absolute. Reservations bump automatically when customers create deploy orders, and release when they cancel or destroy the server.

### 6.6 Organization + GST settings

The whole India-GST chain reads from one place:

- **`/admin/org-settings`** has 4 tabs:
  - **Organization** — legal name, address, phone, website (printed on invoices, used in landing footer, terms/privacy pages)
  - **GST & Tax** — GSTIN, PAN, HSN code, fiscal year start (April for India), invoice + credit-note + receipt prefixes (e.g. `NL`, `CN`, `RC`)
  - **Invoicing** — payment terms (days), invoice footer text, auto-send-on-create toggle, attach-PDF toggle, expiry timeout for stuck checkout orders
  - **Email Routing** — support / sales / billing / legal / privacy / abuse email addresses (used by the public site and outbound transactional emails)

The invoiceNumber service caches these for 60 seconds, so changes take effect on the next invoice without a restart.

### 6.7 Customer-uploaded ISOs

Customers can upload up to **5 custom ISOs of 4 GB each** at `/dashboard/custom-isos`. They show up in the Deploy wizard "Custom ISO" picker. Files land in `data/iso/customer/<userId>-<timestamp>-<filename>` and are scoped to the uploader. Operator-side ISOs (rescue images, public distros) live separately at `/admin/iso` with an 8 GB limit.

---

## Phase 7 — Pre-Launch Checklist

Before accepting real paying customers:

- [ ] Default admin password changed
- [ ] Razorpay live keys swapped from test
- [ ] Resend domain verified and SPF/DKIM/DMARC pass mail-tester.com 9/10+
- [ ] At least one real Proxmox node registered + Packer images built
- [ ] First real test deploy completed end-to-end (real money, real VM, real SSH)
- [ ] `dunning` job tested (deliberately let a server expire)
- [ ] First refund tested → CN PDF downloaded with sequential number
- [ ] GSTR-1 export downloaded for current month
- [ ] Backup cron running + verified by `cat /opt/netlayer/data/backups/*.tgz` size > 1 MB
- [ ] Off-site backup destination tested with `aws s3 ls`
- [ ] All 39 backend tests pass on production: `docker compose exec backend npm test`
- [ ] Cloudflare proxy enabled (orange cloud ON) for DDoS protection
- [ ] SSL Labs grade A+: https://www.ssllabs.com/ssltest/analyze.html?d=app.netlayer.com
- [ ] Privacy Policy + Terms reviewed by lawyer
- [ ] GST registration verified (for Razorpay payouts)
- [ ] Bank account configured in Razorpay for settlements (T+2 default)
- [ ] On-call rotation set up (PagerDuty / Better Uptime)
- [ ] Incident response runbook printed and posted

---

## Phase 8 — Soft Launch

1. Invite 10 friendly customers (founders, devs you know)
2. Run for 30 days, monitor everything
3. Iterate on feedback
4. Then public launch

---

## Common First-Day Issues + Fixes

### Caddy won't get a TLS cert

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml logs caddy | tail -50
```

Most common: DNS hasn't propagated yet. Wait 5-10 minutes, then `docker compose restart caddy`.

### "Database connection refused"

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml logs postgres
```

Check `.env.prod` `POSTGRES_PASSWORD` matches what Postgres has stored. If mismatched, nuke `data/postgres/` and re-deploy (last resort, you lose data).

### Webhook returns 401 INVALID_SIGNATURE

Razorpay/Stripe webhook secret in `.env.prod` doesn't match dashboard. Re-copy from dashboard, restart backend.

### "Mock mode still on" after editing .env

Did you restart backend? Env vars are only re-read on container restart:

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml restart backend
docker compose -f /opt/netlayer/docker-compose.prod.yml exec backend env | grep RAZORPAY
```

### ISO upload fails with 413 Payload Too Large

Caddy/nginx body size limit. Already raised to 8 GB in Round 22. If still failing, check `Caddyfile` has `request_body { max_size 8GB }`.

### Real Proxmox deploy hangs

```bash
docker compose -f /opt/netlayer/docker-compose.prod.yml logs backend | grep -i proxmox
```

Common: API token doesn't have enough permissions. Re-check the role grant in Phase 5.2.

---

## Updates

To pull the latest code:

```bash
sudo bash /opt/netlayer/scripts/deploy.sh
```

This `git pull`s, rebuilds images, runs new migrations, restarts. Zero data loss as long as `data/` is intact.

To roll back:

```bash
cd /opt/netlayer
git log --oneline -10
git checkout <previous-sha>
sudo bash scripts/deploy.sh
```

---

## Support

- **Documentation**: `https://app.netlayer.com/docs`
- **GitHub Issues**: https://github.com/Netlayer-global/Netlayer-cloud/issues
- **Operator email**: ops@netlayer.com
- **Customer support**: support@netlayer.com
