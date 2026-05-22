import { Router } from 'express'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'
import { serializeAnnouncement } from '../utils/serialize'

const router = Router()

// Public: active announcements visible to the current user
router.get('/active', async (req: AuthedRequest, res, next) => {
  try {
    const role = req.user?.role || 'USER'
    const now = new Date()

    const all = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    })

    const visible = all.filter((a) => {
      if (a.targetAll) return true
      try {
        const roles = JSON.parse(a.targetRoles) as string[]
        return roles.includes(role)
      } catch {
        return false
      }
    })

    res.json({ data: visible.map(serializeAnnouncement) })
  } catch (e) { next(e) }
})

export default router
