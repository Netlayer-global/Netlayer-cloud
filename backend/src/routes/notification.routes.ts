import { Router } from 'express'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    })
    res.json({ data: notifications, unreadCount })
  } catch (e) { next(e) }
})

router.patch('/:id/read', async (req: AuthedRequest, res, next) => {
  try {
    const notif = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!notif) return res.status(404).json({ error: 'Not found' })
    await prisma.notification.update({
      where: { id: notif.id },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'Marked as read' })
  } catch (e) { next(e) }
})

router.patch('/read-all', async (req: AuthedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (e) { next(e) }
})

export default router
