import { Router } from 'express'
import { z } from 'zod'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import * as webhookService from '../services/webhook.service'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const subs = await webhookService.listSubscriptions(req.user!.userId)
    res.json({
      data: subs.map((s) => ({
        ...s,
        events: (() => { try { return JSON.parse(s.events) } catch { return [] } })(),
      })),
    })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      url: z.string().url('Must be a valid URL').refine(
        (u) => u.startsWith('https://') || u.startsWith('http://'),
        'URL must be http(s)'
      ),
      events: z.array(z.string()).optional().default([]),
    })
    const body = schema.parse(req.body)
    const created = await webhookService.createSubscription(req.user!.userId, body.url, body.events)
    res.status(201).json({
      data: {
        id: created.id,
        url: created.url,
        events: created.events,
        secret: created.secret,
        isActive: created.isActive,
      },
      message: 'Save this secret. It will not be shown again.',
    })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await webhookService.deleteSubscription(req.user!.userId, req.params.id)
    res.json({ message: 'Webhook deleted' })
  } catch (e: any) {
    if (e.message === 'Webhook not found') return next(new AppError('Webhook not found', 404, 'NOT_FOUND'))
    next(e)
  }
})

export default router
