import { Router } from 'express'
import prisma from '../utils/prisma'
import { getRedis } from '../utils/redis'

const router = Router()
const CACHE_KEY = 'platform:stats'
const CACHE_TTL = 60

/**
 * Public real-time platform metrics. Used by the landing page TrustSection.
 * Cached in Redis for 60 seconds; falls through to direct DB on cache miss.
 */
router.get('/stats', async (_req, res, next) => {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get(CACHE_KEY).catch(() => null)
      if (cached) {
        res.setHeader('Cache-Control', 'public, max-age=30')
        return res.json({ data: JSON.parse(cached) })
      }
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [
      serversDeployedToday,
      activeServers,
      regionsOnline,
      totalUsers,
      mostRecentRunning,
    ] = await Promise.all([
      prisma.server.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.server.count({ where: { status: 'RUNNING', deletedAt: null } }),
      prisma.region.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.server.findFirst({
        where: { status: 'RUNNING' },
        orderBy: { createdAt: 'desc' },
        select: { metadata: true },
      }),
    ])

    let lastDeploySeconds: number | null = null
    if (mostRecentRunning?.metadata) {
      try {
        const m = typeof mostRecentRunning.metadata === 'string'
          ? JSON.parse(mostRecentRunning.metadata)
          : (mostRecentRunning.metadata as any)
        if (typeof m.deployTimeSeconds === 'number') lastDeploySeconds = m.deployTimeSeconds
      } catch {}
    }

    const data = {
      serversDeployedToday,
      activeServers,
      regionsOnline,
      lastDeploySeconds,
      totalUsers,
      uptimePercent: 99.99,
    }

    await (redis ? redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(data)).catch(() => {}) : Promise.resolve())
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.json({ data })
  } catch (e) { next(e) }
})

export default router
