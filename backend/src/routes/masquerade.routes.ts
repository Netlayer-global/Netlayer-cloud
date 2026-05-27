import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

/**
 * Round 24 — Admin masquerade ("login as user" for support).
 *
 * Issues a short-lived JWT for the target user with a special claim
 * `masqueradeBy: <adminId>` so we can audit every action and prevent
 * the masqueraded session from doing destructive things (we'll enforce
 * that in middleware in a follow-up).
 *
 * Every start + stop is recorded in the Masquerade table with a
 * mandatory reason. Customers can audit their own account: who, when,
 * why an admin assumed their identity.
 */

router.post('/start/:userId', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      reason: z.string().min(5).max(500),
      durationMinutes: z.number().int().min(5).max(60).default(30),
    }).parse(req.body)

    const target = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!target) throw new AppError('Target user not found', 404, 'NOT_FOUND')
    if (target.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot masquerade as a SUPER_ADMIN', 403, 'FORBIDDEN')
    }

    const masq = await prisma.masquerade.create({
      data: {
        adminId: req.user!.userId,
        targetId: target.id,
        reason: body.reason,
        ipAddress: req.ip,
      },
    })

    // Issue a JWT for the target with masquerade claim. Existing JWT
    // middleware sees `userId: target.id, role: target.role` — i.e. the
    // session feels exactly like the target user.
    const accessToken = jwt.sign(
      {
        userId: target.id,
        role: target.role,
        masqueradeBy: req.user!.userId,
        masqueradeId: masq.id,
      },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: `${body.durationMinutes}m` }
    )

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.masquerade_start',
        resource: 'user',
        resourceId: target.id,
        newValue: JSON.stringify({ reason: body.reason, masqueradeId: masq.id }),
      },
    })
    logger.warn(
      { adminId: req.user!.userId, targetId: target.id, reason: body.reason },
      'admin masquerade started'
    )

    // Notify the target user via in-app notification so they're aware
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: 'security',
        title: 'Admin accessed your account',
        message: `An administrator accessed your account for support. Reason: ${body.reason}`,
      },
    }).catch(() => {})

    res.json({
      data: {
        accessToken,
        masqueradeId: masq.id,
        target: {
          id: target.id, email: target.email,
          firstName: target.firstName, lastName: target.lastName,
        },
        expiresAt: new Date(Date.now() + body.durationMinutes * 60_000),
      },
    })
  } catch (e) { next(e) }
})

router.post('/stop/:masqueradeId', async (req: AuthedRequest, res, next) => {
  try {
    const masq = await prisma.masquerade.findUnique({ where: { id: req.params.masqueradeId } })
    if (!masq) throw new AppError('Masquerade not found', 404, 'NOT_FOUND')
    if (masq.endedAt) return res.json({ data: { alreadyStopped: true } })

    await prisma.masquerade.update({
      where: { id: masq.id },
      data: { endedAt: new Date() },
    })
    await prisma.auditLog.create({
      data: {
        userId: masq.adminId,
        action: 'admin.masquerade_stop',
        resource: 'user',
        resourceId: masq.targetId,
        newValue: JSON.stringify({ masqueradeId: masq.id }),
      },
    })
    res.json({ data: { stopped: true } })
  } catch (e) { next(e) }
})

router.get('/history', async (_req, res, next) => {
  try {
    const list = await prisma.masquerade.findMany({
      orderBy: { startedAt: 'desc' },
      take: 200,
      include: {
        admin:  { select: { id: true, email: true, firstName: true, lastName: true } },
        target: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })
    res.json({ data: list })
  } catch (e) { next(e) }
})

router.get('/my-history', async (req: AuthedRequest, res, next) => {
  try {
    const list = await prisma.masquerade.findMany({
      where: { targetId: req.user!.userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        admin: { select: { email: true, firstName: true, lastName: true } },
      },
    })
    res.json({ data: list })
  } catch (e) { next(e) }
})

export default router
