# NetLayer Cloud — ClickHouse analytics

Stores high-cardinality, time-series-oriented data that doesn't belong in the
OLTP Postgres database:

| Table              | Source                                  | Use                              |
| ------------------ | --------------------------------------- | -------------------------------- |
| server_events      | Workflow engine (NATS `server.*`)       | Deploy success / failure analytics |
| server_metrics_raw | Agent telemetry (`agent.telemetry`)     | Real-time host & VM dashboards   |
| server_metrics_1min| Rollup MV from server_metrics_raw       | 90-day historical charts         |
| usage_hourly       | Billing job (hourly cron in API)        | Per-user invoice generation      |
| workflow_runs      | Workflow engine (`workflow.*` events)   | Reliability alerts + reports     |

## Bring up

```bash
cd infra/analytics/clickhouse
docker compose -f docker-compose.clickhouse.yml up -d
# verify
curl 'http://localhost:8123/?query=SELECT%201'
```

The schema bundled in `schema.sql` is auto-applied on first boot.

## Ingest

The API publishes every relevant event to NATS already (Round 13). To pump
those into ClickHouse, run the bridge worker:

```bash
cd backend
NATS_URL=nats://localhost:4222 \
CLICKHOUSE_URL=http://clickhouse:8123 \
CLICKHOUSE_USER=netlayer \
CLICKHOUSE_PASSWORD=clickhouse_secret \
npx ts-node src/services-runtime/clickhouse-bridge.ts
```

`clickhouse-bridge.ts` subscribes to NATS, batches inserts every 5 seconds,
retries on transient ClickHouse failures, and exposes Prometheus metrics on
port 9100 so Grafana can show ingest lag.

## Query examples

```sql
-- Deploy time p99 by region, last 24 hours
SELECT * FROM netlayer.deploy_p50_p99_by_region;

-- MRR for the last 30 days
SELECT * FROM netlayer.revenue_by_day LIMIT 30;

-- Top 10 users by CPU-hours this month
SELECT user_id, sum(cpu_hours) AS cpu_h
FROM netlayer.usage_hourly
WHERE ts >= toStartOfMonth(now())
GROUP BY user_id
ORDER BY cpu_h DESC
LIMIT 10;
```
