import { Request, Response, NextFunction } from 'express'
import client from 'prom-client'
import { config } from '../config/env'

/**
 * Prometheus metrics. Mounted at /metrics.
 * Disabled when METRICS_ENABLED=false.
 */

export const registry = new client.Registry()

registry.setDefaultLabels({
  service: 'netlayer-api',
  env: config.NODE_ENV,
})

if (config.metricsEnabled) {
  client.collectDefaultMetrics({ register: registry })
}

// HTTP RED metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
})

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
})

// Business metrics
export const serverDeployments = new client.Counter({
  name: 'netlayer_server_deployments_total',
  help: 'Total VM deployment attempts',
  labelNames: ['result', 'region', 'plan'],
  registers: [registry],
})

export const serverDeploymentDuration = new client.Histogram({
  name: 'netlayer_server_deployment_seconds',
  help: 'End-to-end deploy duration',
  labelNames: ['result', 'region'],
  buckets: [5, 10, 20, 30, 60, 90, 120, 180, 300],
  registers: [registry],
})

export const serversActive = new client.Gauge({
  name: 'netlayer_servers_active',
  help: 'Number of currently RUNNING VPS',
  labelNames: ['region'],
  registers: [registry],
})

export const paymentsTotal = new client.Counter({
  name: 'netlayer_payments_total',
  help: 'Total payment events',
  labelNames: ['provider', 'result', 'currency'],
  registers: [registry],
})

export const queueJobsProcessed = new client.Counter({
  name: 'netlayer_queue_jobs_total',
  help: 'Total background jobs processed',
  labelNames: ['queue', 'result'],
  registers: [registry],
})

/**
 * Express middleware that records every request's duration and status.
 * Uses res.locals.routePath if set by the route, falling back to req.path.
 * Cardinality kept low by collapsing IDs in the path.
 */
export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!config.metricsEnabled) return next()
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e9
    const route = (res.locals.routePath as string) || normalizeRoute(req.path)
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    }
    httpRequestsTotal.inc(labels)
    httpRequestDuration.observe(labels, dur)
  })

  next()
}

/** Collapse high-cardinality bits of a path to keep metric labels bounded. */
function normalizeRoute(p: string): string {
  return p
    .replace(/\/[a-z0-9]{20,}/g, '/:id')             // cuid / opaque ids
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:uuid')
    .replace(/\/\d+/g, '/:n')
    .slice(0, 80)
}

export const metricsHandler = async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', registry.contentType)
  res.send(await registry.metrics())
}
