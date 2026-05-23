import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

const METRICS = ['cpu_percent', 'ram_percent', 'disk_percent', 'network_in', 'network_out'] as const
const CONDITIONS = ['gt', 'lt', 'eq'] as const
const CHANNELS  = ['email', 'sms', 'webhook'] as const

const parseChannels = (raw: string): string[] => {
  try { return JSON.parse(raw) } catch { return [] }
}

const serialize = (rule: any) => ({
  ...rule,
  channels: typeof rule.channels === 'string' ? parseChannels(rule.channels) : rule.channels,
})

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const rules = await prisma.alertRule.findMany({
      where: { userId: req.user!.userId },
      include: { server: { select: { id: true, name: true, hostname: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: rules.map(serialize) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(80),
        serverId: z.string().nullable().optional(),
        metric: z.enum(METRICS),
        condition: z.enum(CONDITIONS),
        threshold: z.number(),
        duration: z.number().int().min(1).max(60).default(5),
        channels: z.array(z.enum(CHANNELS)).min(1),
        webhookUrl: z.string().url().optional().nullable(),
      })
      .parse(req.body)

    if (body.channels.includes('webhook') && !body.webhookUrl) {
      throw new AppError('webhookUrl required when webhook channel selected', 400, 'WEBHOOK_URL_REQUIRED')
    }

    if (body.serverId) {
      const owns = await prisma.server.findFirst({
        where: { id: body.serverId, userId: req.user!.userId, deletedAt: null },
        select: { id: true },
      })
      if (!owns) throw new AppError('Server not found', 404, 'NOT_FOUND')
    }

    const rule = await prisma.alertRule.create({
      data: {
        userId: req.user!.userId,
        serverId: body.serverId || null,
        name: body.name,
        metric: body.metric,
        condition: body.condition,
        threshold: body.threshold,
        duration: body.duration,
        channels: JSON.stringify(body.channels),
        webhookUrl: body.webhookUrl || null,
      },
    })
    res.status(201).json({ data: serialize(rule) })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(80).optional(),
        threshold: z.number().optional(),
        duration: z.number().int().min(1).max(60).optional(),
        channels: z.array(z.enum(CHANNELS)).optional(),
        webhookUrl: z.string().url().nullable().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body)

    const existing = await prisma.alertRule.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!existing) throw new AppError('Alert rule not found', 404, 'NOT_FOUND')

    const data: any = { ...body }
    if (body.channels) data.channels = JSON.stringify(body.channels)

    const updated = await prisma.alertRule.update({ where: { id: existing.id }, data })
    res.json({ data: serialize(updated) })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.alertRule.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!existing) throw new AppError('Alert rule not found', 404, 'NOT_FOUND')
    await prisma.alertRule.delete({ where: { id: existing.id } })
    res.json({ message: 'Alert rule deleted' })
  } catch (e) { next(e) }
})

export default router
