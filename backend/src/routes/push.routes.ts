import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Web Push subscriptions (PWA-ready).
 *
 * Customers' browsers register a push subscription with Service Worker;
 * the endpoint URL plus encryption keys are POSTed here. When a server
 * event fires (`server.ready`, `payment.failed`, etc.) we look up active
 * subscriptions for that user and dispatch via web-push.
 *
 * The dispatch worker is wired separately when VAPID keys are configured
 * via env (PUSH_VAPID_PUBLIC, PUSH_VAPID_PRIVATE). In mock mode we just
 * log the would-be payload.
 */

router.post('/subscribe', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(10),
        auth: z.string().min(10),
      }),
      platform: z.enum(['web', 'ios', 'android']).default('web'),
    }).parse(req.body)

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId: req.user!.userId,
        endpoint: body.endpoint,
        keys: JSON.stringify(body.keys),
        platform: body.platform,
      },
      update: {
        userId: req.user!.userId,
        keys: JSON.stringify(body.keys),
        isActive: true,
        platform: body.platform,
      },
    })
    res.status(201).json({ data: { id: sub.id } })
  } catch (e) { next(e) }
})

router.delete('/subscribe', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ endpoint: z.string().url() }).parse(req.body)
    await prisma.pushSubscription.updateMany({
      where: { endpoint: body.endpoint, userId: req.user!.userId },
      data: { isActive: false },
    })
    res.json({ message: 'Unsubscribed' })
  } catch (e) { next(e) }
})

router.get('/subscriptions', async (req: AuthedRequest, res, next) => {
  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: req.user!.userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: subs.map((s) => ({ ...s, keys: undefined })) })
  } catch (e) { next(e) }
})

router.get('/vapid-public-key', async (_req, res) => {
  res.json({
    data: { key: process.env.PUSH_VAPID_PUBLIC || 'mock-vapid-public-key' },
  })
})

export default router
