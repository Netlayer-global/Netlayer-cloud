import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import emailService from '../services/email.service'
import logger from '../utils/logger'

const router = Router()

const TARGETS = ['all', 'active', 'country', 'custom'] as const

/**
 * Bulk email broadcasts. We collect users in a single query, then fire
 * sends in batches of 50 with a small delay between batches so we never
 * blast the upstream provider faster than its rate limit allows.
 *
 * Real production should put this on a BullMQ queue with retries; the
 * inline batched approach is fine for ≤5k recipients.
 */

router.post('/bulk-email', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        subject: z.string().min(1).max(200),
        html: z.string().min(1),
        targetType: z.enum(TARGETS),
        targetValue: z.string().optional(),
        testEmail: z.string().email().optional(),
      })
      .parse(req.body)

    if (body.testEmail) {
      await emailService.sendCustomEmail(body.testEmail, body.subject, body.html)
      return res.json({ data: { sent: 1, preview: true } })
    }

    let where: any = { deletedAt: null }
    switch (body.targetType) {
      case 'all':
        break
      case 'active':
        where = { ...where, status: 'ACTIVE', servers: { some: { deletedAt: null } } }
        break
      case 'country':
        if (!body.targetValue) throw new AppError('targetValue required for country', 400, 'TARGET_REQUIRED')
        where = { ...where, country: body.targetValue }
        break
      case 'custom':
        if (!body.targetValue) throw new AppError('targetValue required for custom', 400, 'TARGET_REQUIRED')
        where = { ...where, id: { in: body.targetValue.split(',').map((s) => s.trim()).filter(Boolean) } }
        break
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { email: true, firstName: true },
    })

    const batches = chunk(recipients, 50)

    // Fire-and-forget — don't make the admin wait for thousands of emails.
    void (async () => {
      for (const batch of batches) {
        await Promise.allSettled(
          batch.map((u) => emailService.sendCustomEmail(u.email, body.subject, body.html))
        )
        await new Promise((r) => setTimeout(r, 100))
      }
      logger.info({ recipients: recipients.length, batches: batches.length }, 'bulk email completed')
    })()

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.communications.bulk_email',
        resource: 'communications',
        newValue: JSON.stringify({
          subject: body.subject,
          targetType: body.targetType,
          recipients: recipients.length,
        }),
      },
    })

    res.json({ data: { queued: recipients.length, batches: batches.length } })
  } catch (e) { next(e) }
})

router.post('/test-email', async (req, res, next) => {
  try {
    const { to, subject, html } = z
      .object({
        to: z.string().email(),
        subject: z.string().min(1),
        html: z.string().min(1),
      })
      .parse(req.body)
    await emailService.sendCustomEmail(to, subject, html)
    res.json({ data: { sent: true } })
  } catch (e) { next(e) }
})

router.get('/history', async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'admin.communications.bulk_email' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    })
    res.json({
      data: logs.map((l) => {
        let parsed: any = {}
        try { parsed = l.newValue ? JSON.parse(l.newValue) : {} } catch {}
        return {
          id: l.id,
          createdAt: l.createdAt,
          adminEmail: l.user?.email,
          ...parsed,
        }
      }),
    })
  } catch (e) { next(e) }
})

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default router
