/**
 * Webhook subscriptions service.
 *
 * Customers POST to /api/webhooks-subs to subscribe a URL to one or more
 * domain event subjects. We persist the subscription, generate an HMAC
 * secret, and queue a delivery on every matching event published via the
 * NATS / in-memory event bus.
 *
 * Deliveries are written to a `WebhookDelivery` row up front and a
 * background worker drains the queue with retry + backoff.
 */

import crypto from 'crypto'
import prisma from '../utils/prisma'
import logger from '../utils/logger'
import * as eventBus from '../events/bus'

const WATCHED_SUBJECTS = [
  'server.created',
  'server.running',
  'server.deleted',
  'payment.completed',
  'workflow.started',
  'workflow.completed',
  'workflow.failed',
  'ticket.sla_breach',
]

/**
 * Generate the HMAC-SHA256 signature header that customers verify.
 * Header name: X-NetLayer-Signature: t=<unix>, v1=<hex>
 */
export function signPayload(secret: string, payload: string, ts: number): string {
  const mac = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex')
  return `t=${ts}, v1=${mac}`
}

export async function listSubscriptions(userId: string) {
  return prisma.webhookSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, url: true, events: true, isActive: true,
      lastDeliveredAt: true, lastFailedAt: true, failureCount: true,
      createdAt: true,
      // never return the secret after creation
    },
  })
}

export async function createSubscription(userId: string, url: string, events: string[]) {
  const secret = crypto.randomBytes(32).toString('hex')
  const created = await prisma.webhookSubscription.create({
    data: {
      userId, url,
      events: JSON.stringify(events.length === 0 ? ['*'] : events),
      secret,
    },
  })
  return { ...created, secret, events }  // secret returned ONCE
}

export async function deleteSubscription(userId: string, id: string) {
  const sub = await prisma.webhookSubscription.findFirst({ where: { id, userId } })
  if (!sub) throw new Error('Webhook not found')
  await prisma.webhookSubscription.delete({ where: { id } })
}

/**
 * Subscribe the API to every domain event we care about and enqueue a
 * delivery for every matching subscription. Called once at boot from
 * src/index.ts so customer webhooks fire automatically.
 */
export async function attachEventListeners() {
  for (const subject of WATCHED_SUBJECTS) {
    await eventBus.subscribe(subject, async (payload) => {
      try {
        const subs = await prisma.webhookSubscription.findMany({
          where: { isActive: true },
        })
        for (const s of subs) {
          let listed: string[] = []
          try { listed = JSON.parse(s.events) } catch { listed = [] }
          if (!listed.includes('*') && !listed.includes(subject)) continue

          await prisma.webhookDelivery.create({
            data: {
              subscriptionId: s.id,
              event: subject,
              payload: JSON.stringify(payload),
            },
          })
        }
      } catch (err: any) {
        logger.warn({ err: err.message, subject }, 'enqueue webhook delivery failed')
      }
    })
  }
  logger.info(`Webhook event listeners attached for ${WATCHED_SUBJECTS.length} subjects`)
}
