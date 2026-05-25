import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

const router = Router()

/**
 * Round 23 — admin Plans CRUD.
 *
 * Drives the public /pricing page and the customer Deploy wizard.
 * Plans support three billing cycles (hourly / monthly / yearly) with
 * per-cycle availability flags so an operator can offer e.g. "Bare metal:
 * monthly + yearly only, no hourly".
 *
 * Stock fields (stockTotal / stockReserved) drive Latitude-style "X
 * available in Mumbai" badges. stockTotal=0 means unlimited (cloud VMs).
 */

const serialize = (p: any) => ({
  ...p,
  raidSupported: (() => {
    try { return JSON.parse(p.raidSupported || '[]') } catch { return [] }
  })(),
  stockAvailable: Math.max(0, (p.stockTotal || 0) - (p.stockReserved || 0)),
})

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9.-]+$/),
  category: z.enum(['compute', 'bare-metal', 'storage', 'gpu']).default('compute'),
  cpu: z.number().int().positive(),
  ramGB: z.number().int().positive(),
  diskGB: z.number().int().positive(),
  bandwidthTB: z.number().nonnegative(),
  priceMonthly: z.number().nonnegative(),
  priceHourly: z.number().nonnegative(),
  priceInr: z.number().nonnegative(),
  priceYearly: z.number().nonnegative().optional().default(0),
  hourlyEnabled: z.boolean().optional().default(true),
  monthlyEnabled: z.boolean().optional().default(true),
  yearlyEnabled: z.boolean().optional().default(false),
  cpuModel: z.string().optional().nullable(),
  cpuCores: z.number().int().positive().optional().nullable(),
  cpuThreads: z.number().int().positive().optional().nullable(),
  diskType: z.enum(['nvme', 'ssd', 'hdd']).default('nvme'),
  diskCount: z.number().int().positive().default(1),
  raidSupported: z.array(z.enum(['raid0', 'raid1', 'raid10', 'raid5', 'raid6', 'passthrough'])).default([]),
  ipv4Included: z.number().int().nonnegative().default(1),
  ipv6Included: z.number().int().nonnegative().default(1),
  stockTotal: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

router.get('/', async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { priceInr: 'asc' }],
      include: { _count: { select: { servers: true } } },
    })
    res.json({ data: plans.map(serialize) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { servers: true } } },
    })
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND')
    res.json({ data: serialize(plan) })
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const created = await prisma.plan.create({
      data: {
        ...body,
        raidSupported: JSON.stringify(body.raidSupported),
      },
    })
    res.status(201).json({ data: serialize(created) })
  } catch (e: any) {
    if (e?.code === 'P2002') return next(new AppError('Slug already exists', 400, 'SLUG_EXISTS'))
    next(e)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = createSchema.partial().parse(req.body)
    const data: any = { ...body }
    if (body.raidSupported) data.raidSupported = JSON.stringify(body.raidSupported)
    const updated = await prisma.plan.update({
      where: { id: req.params.id },
      data,
    })
    res.json({ data: serialize(updated) })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const inUse = await prisma.server.count({
      where: { planId: req.params.id, deletedAt: null },
    })
    if (inUse > 0) {
      throw new AppError(
        `Plan is in use by ${inUse} active server(s). Set isActive=false instead of deleting.`,
        400,
        'PLAN_IN_USE'
      )
    }
    await prisma.plan.delete({ where: { id: req.params.id } })
    res.json({ message: 'Plan deleted' })
  } catch (e) { next(e) }
})

/**
 * Bulk stock adjustment for bare-metal plans.
 * POST /api/admin/plans/:id/stock { delta: 5 }   → +5 to total
 * POST /api/admin/plans/:id/stock { total: 20 }  → set absolute
 */
router.post('/:id/stock', async (req, res, next) => {
  try {
    const body = z
      .object({
        delta: z.number().int().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .parse(req.body)
    const plan = await prisma.plan.findUnique({ where: { id: req.params.id } })
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND')

    const newTotal =
      typeof body.total === 'number'
        ? body.total
        : (plan.stockTotal + (body.delta || 0))

    if (newTotal < plan.stockReserved) {
      throw new AppError(
        `Cannot set stockTotal=${newTotal} below currently reserved (${plan.stockReserved})`,
        400,
        'STOCK_UNDERFLOW'
      )
    }

    const updated = await prisma.plan.update({
      where: { id: plan.id },
      data: { stockTotal: newTotal },
    })
    res.json({ data: serialize(updated) })
  } catch (e) { next(e) }
})

export default router
