import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Automated backup schedules per server.
 *
 * A daily/weekly/monthly cron picks up active schedules whose nextRunAt
 * has passed, creates a snapshot via the existing snapshots flow, and
 * trims to retentionDays. The cron job lives in jobs/backupRunner.ts.
 */

const computeNextRun = (
  freq: 'daily' | 'weekly' | 'monthly',
  hour: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date => {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(hour, 0, 0, 0)

  if (freq === 'daily') {
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
    return next
  }
  if (freq === 'weekly') {
    const targetDay = dayOfWeek ?? 0
    while (next.getUTCDay() !== targetDay || next <= now) {
      next.setUTCDate(next.getUTCDate() + 1)
    }
    return next
  }
  // monthly
  const targetDate = dayOfMonth ?? 1
  next.setUTCDate(targetDate)
  if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const list = await prisma.backupSchedule.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: list })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      serverId: z.string(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      retentionDays: z.number().int().min(1).max(365).default(7),
      hour: z.number().int().min(0).max(23).default(2),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      dayOfMonth: z.number().int().min(1).max(28).optional(),
    }).parse(req.body)

    const owned = await prisma.server.findFirst({
      where: { id: body.serverId, userId: req.user!.userId, deletedAt: null },
    })
    if (!owned) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const nextRunAt = computeNextRun(body.frequency, body.hour, body.dayOfWeek, body.dayOfMonth)

    const sched = await prisma.backupSchedule.create({
      data: {
        userId: req.user!.userId,
        serverId: body.serverId,
        frequency: body.frequency,
        retentionDays: body.retentionDays,
        hour: body.hour,
        dayOfWeek: body.dayOfWeek,
        dayOfMonth: body.dayOfMonth,
        nextRunAt,
      },
    })
    res.status(201).json({ data: sched })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const sched = await prisma.backupSchedule.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!sched) throw new AppError('Schedule not found', 404, 'NOT_FOUND')

    const body = z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      retentionDays: z.number().int().min(1).max(365).optional(),
      hour: z.number().int().min(0).max(23).optional(),
      dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
      dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body)

    const data: any = { ...body }
    if (body.frequency || body.hour !== undefined) {
      data.nextRunAt = computeNextRun(
        body.frequency || (sched.frequency as any),
        body.hour ?? sched.hour,
        body.dayOfWeek ?? sched.dayOfWeek,
        body.dayOfMonth ?? sched.dayOfMonth,
      )
    }
    const updated = await prisma.backupSchedule.update({ where: { id: sched.id }, data })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const sched = await prisma.backupSchedule.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!sched) throw new AppError('Schedule not found', 404, 'NOT_FOUND')
    await prisma.backupSchedule.delete({ where: { id: sched.id } })
    res.json({ message: 'Schedule deleted' })
  } catch (e) { next(e) }
})

export default router
