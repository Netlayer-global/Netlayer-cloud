-- NetLayer Cloud — ClickHouse analytics schema
--
-- Run on a fresh ClickHouse instance:
--   clickhouse-client --multiquery < schema.sql
--
-- The schema mirrors the OLTP tables we want to analyse but is denormalised
-- for fast aggregations. The API ships rows here via the Kafka/NATS bridge
-- (see infra/analytics/clickhouse/ingest.md).

CREATE DATABASE IF NOT EXISTS netlayer;

USE netlayer;

-- ───────────────────────────────────────────────────────────
-- Server lifecycle events
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS server_events (
    ts          DateTime CODEC(DoubleDelta, ZSTD),
    server_id   String,
    user_id     String,
    region      LowCardinality(String),
    plan        LowCardinality(String),
    os          LowCardinality(String),
    event_type  LowCardinality(String),  -- created | running | stopped | deleted | error
    duration_ms UInt32,                  -- time spent in previous state
    error       String DEFAULT '',
    metadata    String DEFAULT ''        -- JSON for extra fields
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (region, ts, server_id)
TTL ts + INTERVAL 24 MONTH;

-- ───────────────────────────────────────────────────────────
-- Per-server time-series metrics (downsampled from agent telemetry)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS server_metrics_raw (
    ts            DateTime CODEC(DoubleDelta, ZSTD),
    server_id     String,
    cpu_pct       Float32,
    ram_used_mb   UInt32,
    disk_used_mb  UInt32,
    net_in_bps    UInt64,
    net_out_bps   UInt64
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (server_id, ts)
TTL ts + INTERVAL 7 DAY;

-- 1-min rollups, retained for 90 days
CREATE MATERIALIZED VIEW IF NOT EXISTS server_metrics_1min
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(ts_min)
ORDER BY (server_id, ts_min)
TTL ts_min + INTERVAL 90 DAY
AS
SELECT
    toStartOfMinute(ts)         AS ts_min,
    server_id,
    avgState(cpu_pct)           AS cpu_avg,
    maxState(cpu_pct)           AS cpu_max,
    avgState(ram_used_mb)       AS ram_avg,
    sumState(net_in_bps)        AS net_in_sum,
    sumState(net_out_bps)       AS net_out_sum
FROM server_metrics_raw
GROUP BY ts_min, server_id;

-- ───────────────────────────────────────────────────────────
-- Billing-grade hourly usage records
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_hourly (
    ts          DateTime CODEC(DoubleDelta, ZSTD),
    user_id     String,
    server_id   String,
    region      LowCardinality(String),
    plan        LowCardinality(String),
    -- aggregated billing units
    cpu_hours       Float32,
    ram_gb_hours    Float32,
    disk_gb_hours   Float32,
    bandwidth_in_gb Float32,
    bandwidth_out_gb Float32,
    cost_inr        Float32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (user_id, ts)
TTL ts + INTERVAL 36 MONTH;

-- ───────────────────────────────────────────────────────────
-- Workflow telemetry — used for Round 9's WorkflowFailureRate alert
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_runs (
    ts            DateTime CODEC(DoubleDelta, ZSTD),
    workflow_id   String,
    workflow_type LowCardinality(String),
    status        LowCardinality(String),  -- running | succeeded | failed | compensating | compensated
    duration_ms   UInt32,
    user_id       String DEFAULT '',
    resource_id   String DEFAULT '',
    error         String DEFAULT ''
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(ts)
ORDER BY (workflow_type, ts)
TTL ts + INTERVAL 12 MONTH;

-- ───────────────────────────────────────────────────────────
-- Convenience views
-- ───────────────────────────────────────────────────────────
CREATE VIEW IF NOT EXISTS deploy_p50_p99_by_region AS
SELECT
    region,
    quantileExact(0.5)(duration_ms) AS p50,
    quantileExact(0.95)(duration_ms) AS p95,
    quantileExact(0.99)(duration_ms) AS p99,
    count() AS n
FROM server_events
WHERE event_type = 'running' AND ts >= now() - INTERVAL 24 HOUR
GROUP BY region;

CREATE VIEW IF NOT EXISTS revenue_by_day AS
SELECT
    toDate(ts) AS day,
    sum(cost_inr) AS revenue_inr,
    uniqExact(user_id) AS active_users,
    uniqExact(server_id) AS active_servers
FROM usage_hourly
GROUP BY day
ORDER BY day DESC;
