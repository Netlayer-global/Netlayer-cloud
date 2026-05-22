import Redis from 'ioredis'
import { config } from '../config/env'
import logger from './logger'

let redis: Redis | null = null
let pubClient: Redis | null = null
let subClient: Redis | null = null

/**
 * Single Redis client for caching, idempotency, and rate limits.
 * Returns null when REDIS_URL is unset (dev mode without Redis).
 */
export function getRedis(): Redis | null {
  if (redis) return redis
  if (!config.REDIS_URL) {
    logger.warn('Redis disabled: REDIS_URL not configured')
    return null
  }
  redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    reconnectOnError: (err) => {
      const targets = ['READONLY', 'ECONNRESET']
      return targets.some((t) => err.message.includes(t))
    },
  })
  redis.on('error', (err) => logger.error({ err }, 'Redis error'))
  redis.on('connect', () => logger.info('Redis connected'))
  return redis
}

export async function isRedisHealthy(): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const pong = await r.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}

/**
 * Pub/Sub clients dedicated to the Socket.io Redis adapter.
 * The adapter requires two separate connections (cannot share with command client).
 */
export function getPubSubClients(): { pub: Redis; sub: Redis } | null {
  if (!config.REDIS_URL) return null
  if (!pubClient) {
    pubClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null })
    pubClient.on('error', (err) => logger.error({ err }, 'Redis pub error'))
  }
  if (!subClient) {
    subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null })
    subClient.on('error', (err) => logger.error({ err }, 'Redis sub error'))
  }
  return { pub: pubClient, sub: subClient }
}

export async function disconnectRedis() {
  await Promise.all([
    redis?.quit().catch(() => {}),
    pubClient?.quit().catch(() => {}),
    subClient?.quit().catch(() => {}),
  ])
}
