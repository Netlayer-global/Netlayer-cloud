import { Router } from 'express'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Aggregated view: every snapshot the user owns across all their servers.
 * Per-server snapshot CRUD already lives in servers.routes.ts; this is the
 * dashboard-wide list used by /dashboard/snapshots.
 */
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const snapshots = await prisma.serverSnapshot.findMany({
      where: { server: { userId: req.user!.userId, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ipv4: true,
            status: true,
            region: { select: { name: true, flag: true, slug: true } },
          },
        },
      },
    })
    res.json({ data: snapshots })
  } catch (e) { next(e) }
})

export default router
