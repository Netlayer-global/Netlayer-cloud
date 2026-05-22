import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { getRedis } from '../utils/redis'
import { config } from '../config/env'
import logger from '../utils/logger'

/**
 * Idempotency middleware.
 *
 * Clients send `Idempotency-Key: <uuid>` on POST/PATCH/DELETE.
 * First request: handler runs, response cached in Redis under hash(key + path + body).
 * Repeat: cached response replayed without invoking the handler.
 *
 * Critical for payment, deploy, and webhook routes.
 *
 * Falls open (no-op) when Redis is unavailable, so dev without Redis still works.
 */

const STATUS_HEADER = 'Idempotent-Replayed'

interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: any
  reqHash: string
  ts: number
}

const hashRequest = (key: string, method: string, path: string, body: unknown): string => {
  const payload = JSON.stringify({ method, path, body: body ?? null })
  return crypto.createHash('sha256').update(`${key}::${payload}`).digest('hex')
}

export function idempotency() {
  const ttl = config.IDEMPOTENCY_TTL_SECONDS

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) return next()

    const key = req.header('Idempotency-Key') || req.header('idempotency-key')
    if (!key) return next()

    const redis = getRedis()
    if (!redis) return next()

    const reqHash = hashRequest(key, req.method, req.path, req.body)
    const cacheKey = `idem:${key}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as CachedResponse
        if (parsed.reqHash !== reqHash) {
          // Same key, different request body → reject (RFC 9110 § 6.4 of upcoming idempotency-key draft)
          return res.status(409).json({
            error: 'Idempotency-Key reused for a different request',
            code: 'IDEMPOTENCY_CONFLICT',
          })
        }
        // Replay cached response
        for (const [h, v] of Object.entries(parsed.headers || {})) res.setHeader(h, v)
        res.setHeader(STATUS_HEADER, 'true')
        return res.status(parsed.status).json(parsed.body)
      }
    } catch (e: any) {
      logger.warn({ err: e }, 'Idempotency cache read failed; falling through')
      return next()
    }

    // Capture the outgoing response to cache it
    const originalJson = res.json.bind(res)
    res.json = (body: any) => {
      // Cache only successful & client-side-final responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const toStore: CachedResponse = {
          status: res.statusCode,
          headers: {},
          body,
          reqHash,
          ts: Date.now(),
        }
        redis
          .set(cacheKey, JSON.stringify(toStore), 'EX', ttl, 'NX')
          .catch((e) => logger.warn({ err: e }, 'Idempotency cache write failed'))
      }
      return originalJson(body)
    }

    next()
  }
}
