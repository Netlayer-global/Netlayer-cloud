/**
 * worker — runs background jobs as a dedicated process.
 *
 * Standalone:  npm run svc:worker
 *
 * In monolith mode, jobs run inside the API process (registerAllJobs is called
 * from src/index.ts). In split mode, the API is read-only for jobs and this
 * process owns all queue processing + cron scheduling.
 */

import 'dotenv/config'
import { config } from '../config/env'
import logger from '../utils/logger'
import prisma from '../utils/prisma'
import { registerAllJobs, shutdownQueues } from '../jobs'
import { disconnectRedis } from '../utils/redis'
import { httpMetricsMiddleware, registry } from '../observability/metrics'
import express from 'express'
import { createServer } from 'http'

const PORT = parseInt(process.env.WORKER_PORT || '5005', 10)

async function main() {
  await prisma.$connect()
  logger.info('worker: database connected')

  registerAllJobs()
  logger.info('worker: jobs registered')

  // Tiny HTTP surface so k8s can probe the worker
  const app = express()
  app.use(httpMetricsMiddleware)
  app.get('/healthz', (_req, res) => res.json({ status: 'ok', kind: 'worker' }))
  app.get('/readyz', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ status: 'ready' })
    } catch (e: any) {
      res.status(503).json({ status: 'not_ready', error: e.message })
    }
  })
  if (config.metricsEnabled) {
    app.get('/metrics', async (_req, res) => {
      res.setHeader('Content-Type', registry.contentType)
      res.send(await registry.metrics())
    })
  }

  const http = createServer(app)
  http.listen(PORT, () => {
    logger.info({ port: PORT }, '▶ worker listening')
  })

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'worker: shutting down')
    http.close(async () => {
      await Promise.allSettled([shutdownQueues(), prisma.$disconnect(), disconnectRedis()])
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

if (require.main === module) {
  main().catch((e) => {
    logger.error({ err: e }, 'worker: startup error')
    process.exit(1)
  })
}
