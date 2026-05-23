import prisma from '../../utils/prisma'
import logger from '../../utils/logger'
import { signPayload } from '../../services/webhook.service'

const MAX_ATTEMPTS = 6
const BACKOFF_MS = (attempt: number) => Math.min(60_000, 2 ** attempt * 1000)

/**
 * Delivers pending webhook deliveries with exponential backoff. Runs every
 * 30 seconds via the BullMQ scheduler. Picks up to 100 pending deliveries
 * per tick, signs each with HMAC-SHA256, posts them, and updates state.
 *
 * Failed deliveries are re-queued unless `attempts >= MAX_ATTEMPTS`, in
 * which case they're marked `failed` and the parent subscription's
 * `failureCount` is incremented. Subscriptions with too many consecutive
 * failures get auto-disabled to avoid hammering dead endpoints.
 */
export async function runWebhookDelivery(_data: { ts: number }): Promise<void> {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: 'pending',
      attempts: { lt: MAX_ATTEMPTS },
    },
    include: { subscription: true },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })

  if (pending.length === 0) return
  logger.info(`Webhook delivery: ${pending.length} pending`)

  for (const delivery of pending) {
    if (!delivery.subscription.isActive) {
      // Subscription was disabled — mark delivery failed, don't retry.
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: 'failed', responseBody: 'subscription disabled' },
      })
      continue
    }

    // Backoff check: skip if last attempt was too recent
    if (delivery.lastAttemptAt) {
      const wait = BACKOFF_MS(delivery.attempts)
      if (Date.now() - delivery.lastAttemptAt.getTime() < wait) continue
    }

    const ts = Math.floor(Date.now() / 1000)
    const signature = signPayload(delivery.subscription.secret, delivery.payload, ts)

    let status = 0
    let body = ''
    try {
      const res = await fetch(delivery.subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type':            'application/json',
          'User-Agent':              'NetLayer-Webhook/1.0',
          'X-NetLayer-Event':        delivery.event,
          'X-NetLayer-Signature':    signature,
          'X-NetLayer-Delivery-Id':  delivery.id,
        },
        body: delivery.payload,
        signal: AbortSignal.timeout(15_000),
      })
      status = res.status
      body = await res.text().then((t) => t.slice(0, 1000)).catch(() => '')
    } catch (err: any) {
      body = err.message
      status = 0
    }

    const success = status >= 200 && status < 300
    const nextAttempts = delivery.attempts + 1

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: success
          ? 'delivered'
          : (nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending'),
        attempts: nextAttempts,
        lastAttemptAt: new Date(),
        responseStatus: status,
        responseBody: body,
      },
    })

    // Update parent subscription stats
    if (success) {
      await prisma.webhookSubscription.update({
        where: { id: delivery.subscription.id },
        data: { lastDeliveredAt: new Date(), failureCount: 0 },
      }).catch(() => {})
    } else {
      const updated = await prisma.webhookSubscription.update({
        where: { id: delivery.subscription.id },
        data: {
          lastFailedAt: new Date(),
          failureCount: { increment: 1 },
        },
      }).catch(() => null)
      // Auto-disable subscriptions with persistent failures
      if (updated && updated.failureCount >= 50) {
        await prisma.webhookSubscription.update({
          where: { id: updated.id },
          data: { isActive: false },
        }).catch(() => {})
        logger.warn({ subscriptionId: updated.id }, 'auto-disabled webhook (>=50 consecutive failures)')
      }
    }
  }
}
