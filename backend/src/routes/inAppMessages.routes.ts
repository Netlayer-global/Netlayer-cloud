import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Operator-pushed in-app announcements.
 *
 * Different from `Announcement` (which targets specific roles for the
 * customer dashboard banner) — these are timed, with start/end windows,
 * a CTA, and per-message dismiss state stored client-side.
 *
 * Active = isActive AND startsAt <= now AND (endsAt IS NULL OR endsAt > now)
 */

router.get('/active', async (req: AuthedRequest, res, next) => {
  try {
    const now = new Date()
    const messages = await prisma.inAppMessage.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    })

    const userRole = (req as any).user?.role || 'USER'
    const filtered = messages.filter((m) => {
      const roles = (() => {
        try { return JSON.parse(m.targetRoles) } catch { return [] }
      })()
      return roles.length === 0 || roles.includes(userRole)
    })
    res.json({ data: filtered })
  } catch (e) { next(e) }
})

// Admin endpoints
router.get('/', async (_req, res, next) => {
  try {
    const list = await prisma.inAppMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    res.json({ data: list })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      title: z.string().min(2).max(120),
      body: z.string().min(2).max(2000),
      type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
      cta: z.string().max(40).optional(),
      ctaUrl: z.string().url().optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      targetRoles: z.array(z.string()).default([]),
      isActive: z.boolean().default(true),
    }).parse(req.body)

    const msg = await prisma.inAppMessage.create({
      data: {
        title: body.title,
        body: body.body,
        type: body.type,
        cta: body.cta,
        ctaUrl: body.ctaUrl,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        targetRoles: JSON.stringify(body.targetRoles),
        isActive: body.isActive,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: msg })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = z.object({
      title: z.string().optional(),
      body: z.string().optional(),
      type: z.enum(['info', 'warning', 'error', 'success']).optional(),
      cta: z.string().optional(),
      ctaUrl: z.string().optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().nullable().optional(),
      targetRoles: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body)

    const data: any = { ...body }
    if (body.startsAt) data.startsAt = new Date(body.startsAt)
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null
    if (body.targetRoles) data.targetRoles = JSON.stringify(body.targetRoles)

    const msg = await prisma.inAppMessage.update({ where: { id: req.params.id }, data })
    res.json({ data: msg })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.inAppMessage.delete({ where: { id: req.params.id } })
    res.json({ message: 'Message deleted' })
  } catch (e) { next(e) }
})

export default router
