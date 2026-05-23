import { Router } from 'express'
import { z } from 'zod'
import { AuthedRequest } from '../middleware/auth'
import promoService from '../services/promo.service'

const router = Router()

/**
 * Customer-facing promo redemption. Mounted at `/api/billing/promo` so it
 * lives next to the wallet APIs.
 */
router.post('/redeem', async (req: AuthedRequest, res, next) => {
  try {
    const { code } = z
      .object({ code: z.string().min(2).max(40) })
      .parse(req.body)
    const result = await promoService.redeem(code, req.user!.userId)
    res.json({
      data: {
        ...result,
        message: `₹${result.creditAdded.toFixed(2)} credit added`,
      },
    })
  } catch (e) { next(e) }
})

export default router
