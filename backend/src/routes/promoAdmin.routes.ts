import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()
const codeNano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/** GET /api/admin/promos — list with usage stats */
router.get('/', async (_req, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    })
    res.json({
      data: promos.map((p) => ({
        ...p,
        redemptionCount: p._count.redemptions,
        creditGiven: p.amount * p.usageCount,
      })),
    })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().min(2).max(40).optional(),
        type: z.enum(['credit', 'discount_pct']).default('credit'),
        amount: z.number().positive(),
        currency: z.string().default('INR'),
        usageLimit: z.number().int().positive().default(100),
        minTopup: z.number().nonnegative().default(0),
        expiresAt: z.string().datetime().optional(),
      })
      .parse(req.body)

    const code = (body.code || codeNano()).toUpperCase()

    const promo = await prisma.promoCode.create({
      data: {
        code,
        type: body.type,
        amount: body.amount,
        currency: body.currency,
        usageLimit: body.usageLimit,
        minTopup: body.minTopup,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: promo })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return next(new AppError('Code already exists', 400, 'CODE_EXISTS'))
    }
    next(e)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = z
      .object({
        isActive: z.boolean().optional(),
        usageLimit: z.number().int().positive().optional(),
        expiresAt: z.string().datetime().nullable().optional(),
      })
      .parse(req.body)

    const data: any = {}
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.usageLimit === 'number') data.usageLimit = body.usageLimit
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data })
    res.json({ data: promo })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const promo = await prisma.promoCode.findUnique({ where: { id: req.params.id } })
    if (!promo) throw new AppError('Promo not found', 404, 'NOT_FOUND')
    if (promo.usageCount > 0) {
      throw new AppError(
        'Cannot delete a redeemed code. Disable it instead.',
        400,
        'PROMO_REDEEMED'
      )
    }
    await prisma.promoCode.delete({ where: { id: req.params.id } })
    res.json({ message: 'Promo deleted' })
  } catch (e) { next(e) }
})

export default router
