import { Queue, Worker, QueueEvents, Job } from 'bullmq'
import { getRedis } from '../utils/redis'
import { config } from '../config/env'
import logger from '../utils/logger'
import { queueJobsProcessed } from '../observability/metrics'

/**
 * BullMQ queue manager with graceful in-memory fallback when Redis is unavailable.
 *
 * In dev without Redis, jobs run inline (immediate execution). This means:
 *   - no retries
 *   - no scheduling
 *   - no persistence on crash
 * which is fine for local development. Production must have Redis.
 */

type Processor<T> = (data: T, jobId: string) => Promise<void>

interface QueueWrapper<T> {
  name: string
  add: (jobName: string, data: T, opts?: { delay?: number; jobId?: string; repeat?: { every?: number; pattern?: string } }) => Promise<void>
  process: (processor: Processor<T>, concurrency?: number) => void
  close: () => Promise<void>
}

const queues = new Map<string, QueueWrapper<any>>()
const workers: Worker[] = []
const queueEvents: QueueEvents[] = []
const inMemoryProcessors = new Map<string, Processor<any>>()

const redisAvailable = (): boolean => !!config.REDIS_URL && !!getRedis()

export function createQueue<T = unknown>(name: string): QueueWrapper<T> {
  if (queues.has(name)) return queues.get(name)! as QueueWrapper<T>

  const wrapper: QueueWrapper<T> = redisAvailable()
    ? createBullQueue<T>(name)
    : createInMemoryQueue<T>(name)

  queues.set(name, wrapper)
  return wrapper
}

function createBullQueue<T>(name: string): QueueWrapper<T> {
  const connection = { url: config.REDIS_URL!, maxRetriesPerRequest: null as null }
  const queue: Queue = new Queue(name, { connection: { url: config.REDIS_URL! } })

  const events = new QueueEvents(name, { connection: { url: config.REDIS_URL! } })
  events.on('completed', ({ jobId }) => {
    queueJobsProcessed.inc({ queue: name, result: 'completed' })
    logger.debug({ queue: name, jobId }, 'job completed')
  })
  events.on('failed', ({ jobId, failedReason }) => {
    queueJobsProcessed.inc({ queue: name, result: 'failed' })
    logger.warn({ queue: name, jobId, failedReason }, 'job failed')
  })
  queueEvents.push(events)

  return {
    name,
    add: async (jobName, data, opts) => {
      const jobOpts: any = { removeOnComplete: 100, removeOnFail: 500, attempts: 3, backoff: { type: 'exponential', delay: 5_000 } }
      if (opts?.delay) jobOpts.delay = opts.delay
      if (opts?.jobId) jobOpts.jobId = opts.jobId
      if (opts?.repeat) jobOpts.repeat = opts.repeat
      await queue.add(jobName, data as any, jobOpts)
    },
    process: (processor, concurrency = 4) => {
      const worker = new Worker<T>(
        name,
        async (job: Job<T>) => processor(job.data, job.id || ''),
        { connection, concurrency }
      )
      worker.on('error', (err) => logger.error({ err, queue: name }, 'worker error'))
      workers.push(worker)
      logger.info({ queue: name, concurrency }, 'worker started')
    },
    close: async () => {
      await queue.close()
    },
  }
}

function createInMemoryQueue<T>(name: string): QueueWrapper<T> {
  logger.warn({ queue: name }, 'queue running in-memory (Redis unavailable)')

  return {
    name,
    add: async (jobName, data) => {
      const processor = inMemoryProcessors.get(name)
      if (!processor) {
        logger.warn({ queue: name, jobName }, 'job dropped — no processor registered yet')
        return
      }
      // Run async but not awaited so add() returns immediately
      const jobId = `${name}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      ;(async () => {
        try {
          await processor(data, jobId)
          queueJobsProcessed.inc({ queue: name, result: 'completed' })
        } catch (err: any) {
          queueJobsProcessed.inc({ queue: name, result: 'failed' })
          logger.error({ err, queue: name, jobId }, 'in-memory job failed')
        }
      })()
    },
    process: (processor) => {
      inMemoryProcessors.set(name, processor)
      logger.info({ queue: name }, 'in-memory processor registered')
    },
    close: async () => {},
  }
}

export async function shutdownQueues() {
  await Promise.allSettled([
    ...workers.map((w) => w.close()),
    ...queueEvents.map((e) => e.close()),
    ...Array.from(queues.values()).map((q) => q.close()),
  ])
}

/** Named queues used by the platform. */
export const Queues = {
  email: () => createQueue<{ to: string; subject: string; html: string }>('email'),
  webhook: () => createQueue<{ url: string; payload: any; tenantId: string }>('webhook'),
  audit: () => createQueue<{ event: any }>('audit'),
  meter: () => createQueue<{ kind: string; payload: any }>('meter'),
}
