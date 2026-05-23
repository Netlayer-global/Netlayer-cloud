# NetLayer Cloud — Observability stack

Prometheus + Grafana + Loki + Jaeger + Alertmanager wired together with
sensible defaults. Brings up everything you need to debug a deploy or chase
a tail-latency regression.

## Bring it up

```bash
cd observability
docker compose -f docker-compose.observability.yml up -d
```

That brings up:

| Service       | Port | Purpose                                           |
| ------------- | ---- | ------------------------------------------------- |
| Prometheus    | 9090 | Time-series storage + alert rules                 |
| Grafana       | 3000 | Dashboards (admin/admin, anonymous viewer)        |
| Loki          | 3100 | Log aggregation                                   |
| Promtail      | —    | Log shipper, scrapes container + host logs        |
| Jaeger        | 16686| Distributed tracing UI, OTLP ingest on 4317/4318  |
| Alertmanager  | 9093 | Alert routing + grouping                          |

The NetLayer API already exposes `/metrics` in `prom-client` format, so
Prometheus discovers it automatically once both are running.

## What you get out of the box

- **API · Overview** dashboard: request rate, p50/p95/p99 latency, 5xx ratio,
  inline log panel from Loki
- **Alert rules**: ApiDown (1m), high error rate (>5% for 5m), high latency
  (p99 >1.5s for 5m), workflow failure rate (>10% for 10m)
- **Alertmanager → API webhook**: alerts post to
  `http://host.docker.internal:5000/api/webhooks/alertmanager` so they can
  surface in the admin Notifications panel and on Socket.io for the dashboard

## Adding tracing

The API is set up to emit OpenTelemetry traces on `OTEL_EXPORTER_OTLP_ENDPOINT`.
Set in `backend/.env`:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=netlayer-api
```

Restart the backend. Spans will appear in Jaeger at http://localhost:16686.

## Adding a new dashboard

Drop a JSON file into `grafana/dashboards/`. The provisioning provider picks
it up on the next Grafana restart (`docker compose restart grafana`).
