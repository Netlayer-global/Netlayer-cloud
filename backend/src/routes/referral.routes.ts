import { Router } from 'express'
import { AuthedRequest } from '../middleware/auth'
import referralService from '../services/referral.service'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const data = await referralService.dashboard(req.user!.userId)
    res.json({ data })
  } catch (e) { next(e) }
})

router.get('/code', async (req: AuthedRequest, res, next) => {
  try {
    const code = await referralService.getOrCreateCode(req.user!.userId)
    res.json({ data: { code } })
  } catch (e) { next(e) }
})

export default router
