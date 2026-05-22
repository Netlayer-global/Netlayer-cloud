# NetLayer Cloud

Production-ready VPS hosting platform — DigitalOcean / Vultr / OVH-class.

## Stack

- **Frontend** — React 18 + Vite + TypeScript + Tailwind v3
- **Backend** — Node.js + Express + TypeScript + Prisma + SQLite (Postgres-ready)
- **Infra** — Proxmox + Cloudflare + Razorpay/Stripe + Resend + Zabbix + Grafana (all with mock modes)
- **Realtime** — Socket.io with Redis adapter
- **Jobs** — BullMQ with in-memory fallback
- **Workflows** — Custom Temporal-shaped engine with idempotent steps + compensation
- **Agent** — Go skeleton with gRPC contract (per-host daemon, mock client)
- **Observability** — pino + Prometheus + OpenAPI 3.0 + Swagger UI

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev          # → http://localhost:5000
```

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # → http://localhost:5173
```

## Default admin accounts

| Email | Password | Role |
|---|---|---|
| `super@netlayer.com`   | `Super@123456`   | SUPER_ADMIN |
| `admin@netlayer.com`   | `Admin@123456`   | ADMIN |
| `support@netlayer.com` | `Support@123456` | SUPPORT |
| `billing@netlayer.com` | `Billing@123456` | BILLING |

Customer login: `/login` · Admin login: `/admin/login`

## Endpoints

- Customer site: `http://localhost:5173`
- Backend API:   `http://localhost:5000`
- Health:        `http://localhost:5000/healthz`
- Readiness:     `http://localhost:5000/readyz`
- Metrics:       `http://localhost:5000/metrics`
- API docs:      `http://localhost:5000/docs` (Swagger UI)
- OpenAPI spec:  `http://localhost:5000/api/openapi.json`

## Microservice mode

```bash
cd backend
npm run svc:all    # boots auth(5001) + billing(5002) + compute(5003) + admin(5004) + worker(5005)
```

## Database switching

```bash
npm run db:switch:postgres   # cp prisma/schema.postgres.prisma → schema.prisma
npm run db:switch:sqlite     # restore SQLite variant
npm run db:migrate:to-postgres  # data migration script (when you have both DBs up)
```

## Tests

```bash
cd backend && npm test     # 30 vitest tests across schemas, auth, idempotency
```

## Repository layout

```
netlayer-cloud/
├── frontend/                     React + Vite SPA
│   └── src/
│       ├── pages/                Customer + admin pages
│       ├── pages/Admin/          Dedicated admin panel
│       ├── pages/public/         Pricing, Network, Status, Docs, Features, K8s, Abuse
│       ├── components/landing/   Landing-page sections (TopNav, Hero, Pricing, Map, etc.)
│       ├── components/ui/        Button, Card, Input, Modal, Table, Badge…
│       ├── api/                  axios client + endpoint wrappers
│       ├── hooks/                useTypewriter, useCountUp, useInView, useSocket
│       └── store/                zustand stores
├── backend/                      Express API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma         Active schema (sqlite)
│   │   ├── schema.sqlite.prisma  SQLite variant
│   │   ├── schema.postgres.prisma Postgres variant
│   │   ├── seed.ts               Seed data (15 regions, 12 apps, etc.)
│   │   └── migrate-sqlite-to-postgres.ts
│   └── src/
│       ├── app.ts / index.ts     Monolith entry
│       ├── config/env.ts         Zod-validated env
│       ├── routes/               REST endpoints
│       ├── services/             Proxmox, Cloudflare, Email, SMS, Grafana, Zabbix, Payment, Tax, Invoice, Server
│       ├── workflows/            Workflow engine + deploy-server definition
│       ├── jobs/                 BullMQ queue + cron handlers
│       ├── observability/        Prometheus metrics
│       ├── middleware/           auth, idempotency, rateLimit, errorHandler
│       ├── services-runtime/     auth.svc, billing.svc, compute.svc, admin.svc, worker
│       └── openapi.ts            OpenAPI 3.0 spec
└── agent/                        Go skeleton (per-host daemon)
    ├── proto/agent/v1/agent.proto
    ├── cmd/agent/main.go
    └── internal/{config,cpclient,vmmgr,netmgr,stormgr,obs}/
```

## Production hardening already done

- Pino structured logging with secret redaction
- Request IDs propagated end-to-end
- Idempotency-Key middleware (Redis-backed, falls open without)
- Graceful shutdown drains queues + Prisma + Redis
- 30 Vitest tests covering schemas, auth flow, admin gating, idempotency
- Workflow engine with crash-resume reconciler
- Per-country tax engine (IN GST split, EU VAT, GB VAT, SG GST, reverse-charge)
- Invoice PDF generator (pdfkit, full layout)

## Mock vs real

All external providers default to mock. To go live, set the relevant `*_MOCK_MODE=false` and fill the credentials in `.env` (or use the admin Integrations panel).

## License

Proprietary. © NetLayer Cloud Pvt. Ltd.
