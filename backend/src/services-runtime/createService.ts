import express, { Express, Router } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer, Server as HttpServer } from 'http'

import { config } from '../config/env'
import errorHandler from '../middleware/errorHandler'
import { requestContext } from '../middleware/requestContext'
import { httpMetricsMiddleware, metricsHandler, registry } from '../observability/metrics'
import { idempotency } from '../middleware/idempotency'
import logger from '../utils/logger'
import prisma from '../utils/prisma'
import { disconnectRedis } from '../utils/redis'
import healthRoutes from '../routes/health.routes'

/**
 * createService — common bootstrap for every NetLayer microservice.
 *
 * Each service builds a minimal Express app with:
 *   - request-id logging
 *   - Prometheus metrics scoped to the service name
 *   - /healthz, /readyz, /metrics
 *   - CORS + helmet + cookie-parser
 *   - errorHandler at the end
 *
 * The caller passes in their own routes (and decides whether they need
 * the JSON body parser, idempotency, etc) via the `mount` callback.
 *
 * This is the seam that lets us split the monolith later: today api/, auth-svc/,
 * billing-svc/ all share this. Tomorrow they ship as independent containers.
 */

export interface ServiceOptions {
  name: string
  port: number
  mount: (app: Express) => void
  /** If true, a global JSON body parser is added before mount. Default: true. */
  jsonBody?: boolean
  /** If true, idempotency middleware is added before mount. Default: false. */
  idempotency?: boolean
}

export interface RunningService {
  app: Express
  http: HttpServer
  shutdown: () => Promise<void>
}

const corsOrigin = (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
  if (!origin) return cb(null, true)
  if (origin === config.FRONTEND_URL) return cb(null, true)
  if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return cb(null, true)
  }
  return cb(null, false)
}

export function createService(opts: ServiceOptions): RunningService {
  const app = express()
  const http = createServer(app)

  // Service-scoped logger (every log line carries service=<name>)
  const log = logger.child({ svc: opts.name })

  app.set('trust proxy', 1)
  app.use(requestContext)
  app.use(httpMetricsMiddleware)
  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(cookieParser())
  if (opts.jsonBody !== false) app.use(express.json({ limit: '1mb' }))

  app.use('/', healthRoutes)
  if (config.metricsEnabled) {
    app.get('/metrics', async (_req, res) => {
      res.setHeader('Content-Type', registry.contentType)
      res.send(await registry.metrics())
    })
    void metricsHandler // keep import alive
  }

  if (opts.idempotency) {
    app.use(idempotency())
  }

  opts.mount(app)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND', path: req.path, svc: opts.name })
  })
  app.use(errorHandler)

  http.listen(opts.port, () => {
    log.info({ port: opts.port }, `▶ ${opts.name} listening`)
  })

  const shutdown = async () => {
    log.info(`stopping ${opts.name}…`)
    await new Promise<void>((resolve) => http.close(() => resolve()))
    await Promise.allSettled([prisma.$disconnect(), disconnectRedis()])
  }

  process.once('SIGINT', () => void shutdown().then(() => process.exit(0)))
  process.once('SIGTERM', () => void shutdown().then(() => process.exit(0)))

  return { app, http, shutdown }
}

export function mountRouter(app: Express, base: string, router: Router) {
  app.use(base, router)
}
