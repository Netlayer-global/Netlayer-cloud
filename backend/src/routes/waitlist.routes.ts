import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const router = Router()

/**
 * Public waitlist signup. Used by /kubernetes, /pricing#gpu, etc. for
 * "join waitlist" CTAs on un-launched products. Idempotent on (email, product).
 */
router.post('/', async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        product: z.enum(['gpu', 'kubernetes', 'bare-metal', 'spot', 'reserved']),
        source: z.string().max(120).optional(),
      })
      .parse(req.body)

    await prisma.waitlistEntry.upsert({
      where: { email_product: { email: body.email, product: body.product } },
      create: { email: body.email, product: body.product, source: body.source },
      update: { source: body.source ?? undefined },
    })

    res.json({ data: { message: "You're on the list!" } })
  } catch (e) { next(e) }
})

export default router
