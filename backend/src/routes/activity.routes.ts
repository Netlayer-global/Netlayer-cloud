import { Router } from 'express'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'
import { serializeAudit } from '../utils/serialize'

const router = Router()

/**
 * Customer-facing activity log. Shows audit log entries scoped to the
 * authenticated user (their own actions and platform actions affecting
 * their resources). Admin-level audit logs live under /api/admin/audit-logs.
 */
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10))
    const action = req.query.action as string | undefined
    const resource = req.query.resource as string | undefined
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    const where: any = { userId: req.user!.userId }
    if (action) where.action = { contains: action }
    if (resource) where.resource = resource
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({
      data: logs.map(serializeAudit),
      pagination: { page, limit, total },
    })
  } catch (e) { next(e) }
})

router.get('/summary', async (req: AuthedRequest, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 86_400_000)
    const grouped = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { userId: req.user!.userId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    })
    res.json({
      data: grouped.map((g) => ({ action: g.action, count: g._count._all })),
    })
  } catch (e) { next(e) }
})

export default router
