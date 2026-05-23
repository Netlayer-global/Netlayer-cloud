import { Router } from 'express'
import express from 'express'
import paymentService from '../services/payment.service'
import logger from '../utils/logger'

const router = Router()

// Razorpay (signature in header `x-razorpay-signature`)
router.post('/razorpay', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    await paymentService.handleRazorpayWebhook(req.body, signature || '')
    res.json({ ok: true })
  } catch (e: any) {
    logger.error('Razorpay webhook error', { error: e.message })
    res.status(400).json({ error: e.message })
  }
})

// Stripe (signature in header `stripe-signature`, raw body required)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    await paymentService.handleStripeWebhook(req.body as Buffer, signature || '')
    res.json({ ok: true })
  } catch (e: any) {
    logger.error('Stripe webhook error', { error: e.message })
    res.status(400).json({ error: e.message })
  }
})

export default router


// ─── ALERTMANAGER webhook ────────────────────────────────
// Receives alerts from Prometheus Alertmanager (observability stack).
// We turn them into admin Notifications + emit a socket event so the dashboard
// can surface them in real time. The route below is registered after the
// existing default export's webhook routes by mounting via app.ts.

import * as eventBus from '../events/bus'
import prismaClient from '../utils/prisma'
import logger2 from '../utils/logger'
import { emitToAdmin as emitAdmin } from '../services/socket.service'

export const alertmanagerRouter = express.Router()

interface AlertmanagerPayload {
  status: 'firing' | 'resolved'
  alerts: Array<{
    status: 'firing' | 'resolved'
    labels: Record<string, string>
    annotations: { summary?: string; description?: string }
    startsAt: string
    endsAt: string
    fingerprint: string
  }>
  groupLabels?: Record<string, string>
  commonLabels?: Record<string, string>
  receiver?: string
}

alertmanagerRouter.post('/alertmanager', express.json({ limit: '512kb' }), async (req, res) => {
  try {
    const body = req.body as AlertmanagerPayload
    if (!body || !Array.isArray(body.alerts)) {
      return res.status(400).json({ error: 'Invalid Alertmanager payload' })
    }

    for (const a of body.alerts) {
      const severity = a.labels?.severity || 'warning'
      const name = a.labels?.alertname || 'UnnamedAlert'
      const summary = a.annotations?.summary || name
      const description = a.annotations?.description || ''
      const isResolved = a.status === 'resolved'

      // Persist as an admin-broadcast notification. We pick a stable type
      // string so the UI can filter and group by alert kind.
      // Send to every admin user — recipientUserId is null-friendly via
      // separate notifications-per-admin loop kept short for simplicity.
      const admins = await prismaClient.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] } },
        select: { id: true },
      })
      await Promise.all(
        admins.map((u) =>
          prismaClient.notification.create({
            data: {
              userId: u.id,
              type: isResolved ? 'alert_resolved' : 'alert_firing',
              title: `[${severity.toUpperCase()}] ${summary}`,
              message: description.slice(0, 500),
              link: '/admin/dashboard',
            },
          })
        )
      )

      emitAdmin('admin:alert', {
        name,
        severity,
        status: a.status,
        summary,
        description,
        startsAt: a.startsAt,
        labels: a.labels,
      })

      void eventBus.publish('alert.' + (isResolved ? 'resolved' : 'firing'), {
        name, severity, summary, description, labels: a.labels,
      })

      logger2.info({ alert: name, status: a.status, severity }, 'alertmanager webhook')
    }

    res.json({ ok: true, received: body.alerts.length })
  } catch (e: any) {
    logger2.error({ err: e.message }, 'alertmanager webhook failed')
    res.status(500).json({ error: 'webhook failed' })
  }
})
