import { Router } from 'express'
import capacityService from '../services/capacity.service'
import { getRedis } from '../utils/redis'

const router = Router()

const REPORT_KEY = 'admin:capacity:report'
const SUMMARY_KEY = 'admin:capacity:summary'

router.get('/', async (_req, res, next) => {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get(REPORT_KEY).catch(() => null)
      if (cached) return res.json({ data: JSON.parse(cached), cached: true })
    }
    const data = await capacityService.getCapacityReport()
    if (redis) await redis.setex(REPORT_KEY, 60, JSON.stringify(data)).catch(() => {})
    res.json({ data, cached: false })
  } catch (e) { next(e) }
})

router.get('/summary', async (_req, res, next) => {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get(SUMMARY_KEY).catch(() => null)
      if (cached) return res.json({ data: JSON.parse(cached), cached: true })
    }
    const data = await capacityService.getQuickSummary()
    if (redis) await redis.setex(SUMMARY_KEY, 30, JSON.stringify(data)).catch(() => {})
    res.json({ data, cached: false })
  } catch (e) { next(e) }
})

export default router
