import { Router } from 'express'
import prisma from '../utils/prisma'
import { ProxmoxService } from '../services/proxmox.service'
import { AppError } from '../utils/errors'
import { getRedis } from '../utils/redis'

const router = Router()
const HEALTH_KEY = 'admin:health:global'

/**
 * Admin global health endpoint. Aggregates everything an operator wants to
 * see at a glance: node status, recent failed deploys, recent activity,
 * and active alert counts. Cached for 30s in Redis.
 */
router.get('/global', async (_req, res, next) => {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get(HEALTH_KEY).catch(() => null)
      if (cached) return res.json({ data: JSON.parse(cached), cached: true })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [nodes, failedDeploys, recentActivity, alertsToday] = await Promise.all([
      prisma.node.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, slug: true, status: true,
          totalCpu: true, usedCpu: true, totalRamGB: true, usedRamGB: true,
          maxVMs: true, currentVMs: true,
          region: { select: { id: true, name: true, flag: true, slug: true } },
        },
      }),
      prisma.server.findMany({
        where: { status: 'ERROR', updatedAt: { gte: since } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true, name: true, hostname: true, updatedAt: true, status: true,
          user: { select: { email: true, firstName: true, lastName: true } },
          region: { select: { name: true, flag: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.alertRule.count({
        where: { lastFiredAt: { gte: since } },
      }),
    ])

    const data = {
      generatedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        ...n,
        cpuPercent: n.totalCpu > 0 ? Math.round((n.usedCpu / n.totalCpu) * 100) : 0,
        ramPercent: n.totalRamGB > 0 ? Math.round((n.usedRamGB / n.totalRamGB) * 100) : 0,
        vmPercent:  n.maxVMs > 0    ? Math.round((n.currentVMs / n.maxVMs) * 100)   : 0,
      })),
      failedDeploys,
      recentActivity,
      alertsToday,
    }

    if (redis) await redis.setex(HEALTH_KEY, 30, JSON.stringify(data)).catch(() => {})
    res.json({ data, cached: false })
  } catch (e) { next(e) }
})

router.get('/nodes/:id/live', async (req, res, next) => {
  try {
    const node = await prisma.node.findUnique({ where: { id: req.params.id } })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    const proxmox = new ProxmoxService(node)
    const status = await proxmox.getNodeStatus()
    res.json({ data: { node: { id: node.id, name: node.name }, ...status } })
  } catch (e) { next(e) }
})

export default router
