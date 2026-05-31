import { config } from './config/env'
import { httpServer } from './app'
import prisma from './utils/prisma'
import logger from './utils/logger'
import { registerAllJobs, shutdownQueues } from './jobs'
import { disconnectRedis } from './utils/redis'
import { startGrpcServer } from './agent/grpcServer'
import { attachEventListeners } from './services/webhook.service'

async function main() {
  await prisma.$connect()
  logger.info('Database connected')

  // In split mode, the worker process owns all background jobs.
  // Set NETLAYER_SPLIT_MODE=true on every API service so jobs aren't double-run.
  if (process.env.NETLAYER_SPLIT_MODE !== 'true') {
    registerAllJobs()
  } else {
    logger.info('split mode: skipping in-process jobs (worker.ts owns them)')
  }

  httpServer.listen(config.PORT, () => {
    logger.info(`🚀 NetLayer API running on port ${config.PORT} (${config.NODE_ENV})`)
    logger.info(`   docs:    http://localhost:${config.PORT}/api-docs`)
    logger.info(`   metrics: http://localhost:${config.PORT}/metrics`)
    logger.info(`   readyz:  http://localhost:${config.PORT}/readyz`)
  })

  // Optional Agent gRPC server. No-op when AGENT_GRPC_PORT is unset.
  await startGrpcServer().catch((err) =>
    logger.error({ err: err.message }, 'agent gRPC server failed to start')
  )

  // Subscribe to domain events and enqueue webhook deliveries
  await attachEventListeners().catch((err) =>
    logger.error({ err: err.message }, 'attachEventListeners failed')
  )
}

main().catch((e) => {
  logger.error({ err: e }, 'Startup error')
  process.exit(1)
})

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down...')
  httpServer.close(async () => {
    await Promise.allSettled([
      shutdownQueues(),
      prisma.$disconnect(),
      disconnectRedis(),
    ])
    process.exit(0)
  })
  setTimeout(() => {
    logger.warn('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
