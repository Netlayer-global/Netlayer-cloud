import { Queue, QueueEvents, Worker, Job, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'
import { config } from '../config/env'
import logger from '../utils/logger'
import { queueJobsProcessed } from '../observability/metrics'

/**
 * BullMQ queue infrastructure.
 *
 * Falls back to in-process execution when REDIS_URL is unset, so dev
 * without Redis still runs all jobs (loses durability, OK for dev).
 */

export type QueueName =
  | 'node-monitor'
  | 'billing-daily'
  | 'billing-monthly'
  | 'zabbix-sync'
  | 'cleanup'
  | 'email'
  | 'sms'
  | 'webhook'
  | 'server-deploy'

const queues = new Map<QueueName, Queue>()
const events = new Map<QueueName, QueueEvents>()
const inProcessHandlers = new Map<QueueName, (data: any) => Promise<void>>()

let connection: IORedis | null = null

function getConnection(): IORedis | null {
  if (connection) return connection
  if (!config.REDIS_URL) return null
  connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  connection.on('error', (err) => logger.error({ err }, 'Queue Redis error'))
  return connection
}

export function getQueue(name: QueueName): Queue | null {
  if (queues.has(name)) return queues.get(name)!
  const conn = getConnection()
  if (!conn) return null
  const q = new Queue(name, { connection: conn, defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000 } })
  queues.set(name, q)
  const e = new QueueEvents(name, { connection: conn })
  events.set(name, e)
  return q
}

/**
 * Enqueue a job. Falls back to immediate in-process execution if Redis is unavailable.
 */
export async function enqueue<T = any>(name: QueueName, data: T, opts?: JobsOptions) {
  const q = getQueue(name)
  if (q) {
    return q.add(name, data, opts)
  }
  // Fallback: invoke handler inline. Logged so it's clear we're in degraded mode.
  const handler = inProcessHandlers.get(name)
  if (!handler) {
    logger.warn({ queue: name }, 'Queue handler not registered; in-process fallback skipped')
    return null
  }
  setImmediate(() => {
    handler(data).catch((err) => logger.error({ err, queue: name }, 'In-process job failed'))
  })
  return null
}

/**
 * Register a worker. Spawns a BullMQ Worker if Redis is present,
 * otherwise registers an in-process handler that fires on enqueue().
 */
export function registerWorker<T = any>(
  name: QueueName,
  handler: (data: T, job?: Job<T>) => Promise<void>,
  concurrency = 1
) {
  const conn = getConnection()
  if (conn) {
    const worker = new Worker<T>(
      name,
      async (job) => {
        try {
          await handler(job.data, job)
          queueJobsProcessed.inc({ queue: name, result: 'success' })
        } catch (e) {
          queueJobsProcessed.inc({ queue: name, result: 'failure' })
          throw e
        }
      },
      { connection: conn, concurrency }
    )
    worker.on('failed', (job, err) =>
      logger.error({ queue: name, jobId: job?.id, err }, 'Job failed')
    )
    worker.on('completed', (job) =>
      logger.debug({ queue: name, jobId: job.id }, 'Job completed')
    )
    logger.info({ queue: name, concurrency }, 'BullMQ worker registered')
    return worker
  }

  inProcessHandlers.set(name, handler as (d: any) => Promise<void>)
  logger.info({ queue: name }, 'In-process handler registered (no Redis)')
  return null
}

/**
 * Schedule a recurring job using BullMQ repeat. Equivalent to a cron entry.
 * In-process fallback uses Node's setInterval driven by the cron pattern.
 */
export async function scheduleCron<T = any>(
  name: QueueName,
  cron: string,
  data: T = {} as T
) {
  const q = getQueue(name)
  if (q) {
    await q.add(name, data, {
      repeat: { pattern: cron },
      jobId: `cron:${name}`,
    })
    logger.info({ queue: name, cron }, 'Cron scheduled in BullMQ')
    return
  }
  // In-process: convert cron to interval. Simple cases only.
  const intervalMs = cronToInterval(cron)
  if (intervalMs) {
    setInterval(() => enqueue(name, data), intervalMs).unref()
    logger.info({ queue: name, cron, intervalMs }, 'Cron scheduled in-process (no Redis)')
  } else {
    logger.warn({ queue: name, cron }, 'In-process fallback cannot interpret cron; skipping')
  }
}

/** Translate the simple cron patterns we use to a millisecond interval. */
function cronToInterval(cron: string): number | null {
  const map: Record<string, number> = {
    '* * * * *': 60_000,            // every minute
    '*/5 * * * *': 5 * 60_000,      // every 5 min
    '0 */6 * * *': 6 * 3600_000,    // every 6 hours
    '0 0 * * *': 24 * 3600_000,     // daily at midnight (approximation in-process)
    '0 0 1 * *': 30 * 24 * 3600_000,// monthly approximation; use BullMQ for accuracy
  }
  return map[cron] ?? null
}

export async function shutdownQueues() {
  await Promise.allSettled([
    ...Array.from(queues.values()).map((q) => q.close()),
    ...Array.from(events.values()).map((e) => e.close()),
  ])
  if (connection) await connection.quit().catch(() => {})
}
