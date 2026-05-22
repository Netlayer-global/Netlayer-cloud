import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { emitToAdmin } from '../services/socket.service'
import { getRedis } from '../utils/redis'

/**
 * Public abuse-report endpoint. No auth — anyone can submit.
 *
 * Light rate limiting: max 5 reports per IP per hour, enforced via Redis if
 * available (no-op fallback otherwise so dev still works).
 */

const router = Router()

const submitSchema = z.object({
  type: z.enum(['spam', 'ddos', 'phishing', 'bruteforce', 'other']),
  serverIp: z.string().optional(),
  reporterEmail: z.string().email().optional().or(z.literal('')),
  description: z.string().min(20).max(5000),
})

router.post('/', async (req, res, next) => {
  try {
    const body = submitSchema.parse(req.body)
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
      || req.socket.remoteAddress
      || 'unknown'

    // Light rate limiting on Redis when available
    const redis = getRedis()
    if (redis) {
      const key = `abuse:rl:${ip}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 3600)
      if (count > 5) {
        return res.status(429).json({
          error: 'Rate limit exceeded — max 5 reports per hour',
          code: 'RATE_LIMITED',
        })
      }
    }

    // Try to map IP back to a server in our fleet
    let mappedServerId: string | null = null
    if (body.serverIp) {
      const owned = await prisma.server.findFirst({
        where: { ipv4: body.serverIp, deletedAt: null },
        select: { id: true, userId: true },
      })
      if (owned) mappedServerId = owned.id
    }

    const report = await prisma.abuseReport.create({
      data: {
        type: body.type,
        description: body.description,
        reporterIp: ip,
        reporterEmail: body.reporterEmail || null,
        serverId: mappedServerId,
        status: 'open',
      },
    })

    // Notify admins in real-time
    emitToAdmin('admin:abuse_report', {
      id: report.id,
      type: report.type,
      serverId: mappedServerId,
      reporterIp: ip,
    })

    logger.info({ reportId: report.id, type: report.type, ip }, 'abuse report received')
    res.status(201).json({ data: { id: report.id, status: 'open' } })
  } catch (e) { next(e) }
})

export default router
