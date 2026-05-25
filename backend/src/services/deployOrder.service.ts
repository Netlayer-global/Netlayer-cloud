import { customAlphabet } from 'nanoid'
import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { AppError } from '../utils/errors'
import { computeTax } from './tax.service'
import paymentService from './payment.service'
import invoiceNumberService from './invoiceNumber.service'
import fastDeployService from './fastDeploy.service'
import { startWorkflow } from '../workflows/engine'
import { DeployServerWorkflow } from '../workflows/deployServer.workflow'
import nodeSelector from './nodeSelector.service'
import { emitServerStatus, emitToAdmin, emitToUser } from './socket.service'

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)
const passwordNano = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%',
  16
)

/**
 * Round 22 — pay-per-deploy order service.
 *
 * Flow:
 *   1. Customer picks plan/region/OS, hits Deploy
 *   2. createOrder() pre-allocates a Server row (AWAITING_PAYMENT) and
 *      creates a Razorpay/Stripe order for the full first-month + tax
 *   3. Frontend opens the gateway checkout
 *   4. Webhook → markOrderPaid() flips Server PENDING and triggers fastDeploy
 *   5. 30s later → server is RUNNING + first invoice (status PAID, sequential CN/NL number)
 *
 * Enterprise / wallet users skip this and use the legacy server.service path.
 */

export interface CreateOrderInput {
  userId: string
  planId: string
  regionId: string
  osTemplateId: string
  sshKeyId?: string
  hostname?: string
  rootPassword?: string
  preferredProvider?: 'razorpay' | 'stripe'
}

export interface DeployOrderResult {
  orderId: string
  serverId: string
  amount: number
  tax: number
  total: number
  currency: string
  provider: 'razorpay' | 'stripe'
  /** Provider-specific checkout payload (razorpay order or stripe paymentIntent client secret). */
  checkout: any
}

export class DeployOrderService {
  /**
   * Create a deploy order. Server is pre-allocated in AWAITING_PAYMENT state
   * so the customer can resume checkout if they close the browser.
   */
  async createOrder(input: CreateOrderInput): Promise<DeployOrderResult> {
    const user = await prisma.user.findUnique({ where: { id: input.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    if (user.status !== 'ACTIVE') throw new AppError('Account not active', 403, 'FORBIDDEN')

    const [plan, region, os] = await Promise.all([
      prisma.plan.findUnique({ where: { id: input.planId } }),
      prisma.region.findUnique({ where: { id: input.regionId } }),
      prisma.osTemplate.findUnique({ where: { id: input.osTemplateId } }),
    ])
    if (!plan?.isActive)   throw new AppError('Plan not available', 400, 'INVALID_PLAN')
    if (!region?.isActive) throw new AppError('Region not available', 400, 'INVALID_REGION')
    if (!os?.isActive)     throw new AppError('OS not available', 400, 'INVALID_OS')

    let sshPublicKey: string | undefined
    if (input.sshKeyId) {
      const key = await prisma.sshKey.findFirst({
        where: { id: input.sshKeyId, userId: input.userId },
      })
      if (!key) throw new AppError('SSH key not found', 404, 'NOT_FOUND')
      sshPublicKey = key.publicKey
    }

    const node = await nodeSelector.selectBestNode(region.id, plan.cpu, plan.ramGB, plan.diskGB)

    const domain = process.env.CLOUDFLARE_DOMAIN || 'netlayer.com'
    const hostname = input.hostname || `srv-${nano()}.${domain}`
    const rootPassword = input.rootPassword || passwordNano()

    // Price the first month upfront (not first hour like wallet flow).
    const subtotal = Number(plan.priceInr.toFixed(2))
    const taxRes = computeTax({
      amount: subtotal,
      country: user.country || 'IN',
      state: user.state || undefined,
      gstNumber: user.gstNumber || undefined,
      vatNumber: user.vatNumber || undefined,
    })
    const total = Number((subtotal + taxRes.total).toFixed(2))

    // Pre-allocate the server in AWAITING_PAYMENT state so capacity
    // accounting starts correctly + customer can resume.
    const server = await prisma.server.create({
      data: {
        userId: user.id,
        nodeId: node.id,
        name: hostname.split('.')[0],
        hostname,
        planId: plan.id,
        regionId: region.id,
        osTemplateId: os.id,
        status: 'AWAITING_PAYMENT',
        rootPassword,
        specs: JSON.stringify({ cpu: plan.cpu, ram: plan.ramGB, disk: plan.diskGB }),
        bandwidth: JSON.stringify({ used: 0, limit: plan.bandwidthTB * 1000 }),
        notes: sshPublicKey ? JSON.stringify({ sshPublicKey }) : null,
      },
    })

    // Pick payment provider — INR → Razorpay, anything else → Stripe.
    const provider: 'razorpay' | 'stripe' =
      input.preferredProvider ||
      ((user.currency || 'INR') === 'INR' ? 'razorpay' : 'stripe')

    let providerOrderId: string | null = null
    let checkout: any = {}
    if (provider === 'razorpay') {
      const order = await paymentService.createRazorpayOrder(
        total,
        user.currency || 'INR',
        `srv-${server.id}`
      )
      providerOrderId = order.id
      checkout = {
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockmode',
        amount: order.amount,
        currency: order.currency,
        name: 'NetLayer Cloud',
        description: `${plan.name} · ${region.city}`,
        prefill: { email: user.email, contact: user.phone || '' },
      }
    } else {
      const intent = await paymentService.createStripePaymentIntent(
        total,
        (user.currency || 'USD').toLowerCase(),
        user.stripeCustomerId
      )
      providerOrderId = intent.id
      checkout = {
        clientSecret: intent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      }
    }

    const order = await prisma.deployOrder.create({
      data: {
        userId: user.id,
        serverId: server.id,
        planId: plan.id,
        regionId: region.id,
        osTemplateId: os.id,
        hostname,
        amount: subtotal,
        tax: taxRes.total,
        taxBreakdown: JSON.stringify(taxRes),
        total,
        currency: user.currency || 'INR',
        provider,
        providerOrderId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    await prisma.server.update({
      where: { id: server.id },
      data: { pendingPaymentRef: providerOrderId },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'deploy.order_created',
        resource: 'deploy_order',
        resourceId: order.id,
        newValue: JSON.stringify({ serverId: server.id, total, provider }),
      },
    })

    emitServerStatus(server.id, { status: 'AWAITING_PAYMENT' })

    return {
      orderId: order.id,
      serverId: server.id,
      amount: subtotal,
      tax: taxRes.total,
      total,
      currency: user.currency || 'INR',
      provider,
      checkout,
    }
  }

  /**
   * Called by the payment webhook (or verify endpoint) once a successful
   * capture is confirmed. Issues the sequential invoice, marks the server
   * PENDING, kicks off fastDeploy.
   */
  async markOrderPaid(orderId: string, paymentRef: string): Promise<void> {
    const order = await prisma.deployOrder.findUnique({
      where: { id: orderId },
      include: { user: true },
    })
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')
    if (order.status === 'paid') return // idempotent
    if (order.status !== 'pending') {
      throw new AppError(`Order is ${order.status}, cannot mark paid`, 400, 'ORDER_INVALID_STATE')
    }

    // Sequential invoice number (India FY).
    const { number: invoiceNumber } = await invoiceNumberService.issue('invoice')

    const paidAt = new Date()
    const paidUntil = new Date(paidAt.getTime() + 30 * 86_400_000)

    const [, , invoice] = await prisma.$transaction([
      prisma.deployOrder.update({
        where: { id: order.id },
        data: { status: 'paid', paidAt, providerPaymentId: paymentRef },
      }),
      prisma.server.update({
        where: { id: order.serverId },
        data: {
          status: 'PENDING',
          pendingPaymentRef: null,
          paidUntil,
          nextBillDate: paidUntil,
        },
      }),
      prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: order.userId,
          amount: order.amount,
          tax: order.tax,
          taxBreakdown: order.taxBreakdown,
          total: order.total,
          currency: order.currency,
          status: 'PAID',
          paidAt,
          paymentMethod: order.provider,
          razorpayPaymentId: order.provider === 'razorpay' ? paymentRef : null,
          stripePaymentId:   order.provider === 'stripe'   ? paymentRef : null,
          dueDate: paidAt,
          items: JSON.stringify([
            {
              description: `Server ${order.hostname} · 30 days`,
              qty: 1,
              unitPrice: order.amount,
              total: order.amount,
            },
          ]),
          notes: `Pay-per-deploy first month. Order ${order.id}.`,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: 'deploy.order_paid',
          resource: 'deploy_order',
          resourceId: order.id,
          newValue: JSON.stringify({ paymentRef, total: order.total }),
        },
      }),
    ])

    // Link invoice to order for cross-referencing
    await prisma.deployOrder.update({
      where: { id: order.id },
      data: { invoiceId: invoice.id },
    })

    // Now actually deploy the server.
    const server = await prisma.server.findUniqueOrThrow({
      where: { id: order.serverId },
      include: { user: true },
    })

    let sshPublicKey: string | undefined
    if (server.notes) {
      try {
        const parsed = JSON.parse(server.notes)
        sshPublicKey = parsed.sshPublicKey
      } catch {}
    }

    emitServerStatus(server.id, { status: 'PENDING' })
    emitToAdmin('admin:server_deployed', { serverId: server.id, userId: server.userId })
    emitToUser(server.userId, 'order:paid', { orderId: order.id, serverId: server.id })

    setImmediate(() => {
      fastDeployService
        .deploy({
          serverId: server.id,
          userId: server.userId,
          hostname: server.hostname,
          rootPassword: server.rootPassword || passwordNano(),
          sshPublicKey,
        })
        .catch((err) => {
          logger.warn(
            { err: err.message, serverId: server.id },
            'fast deploy failed — handing off to durable workflow'
          )
          prisma.server.update({ where: { id: server.id }, data: { status: 'PENDING' } }).catch(() => {})
          startWorkflow(DeployServerWorkflow, {
            id: `deploy-${server.id}`,
            resourceId: server.id,
            context: {
              serverId: server.id,
              userId: server.userId,
              hostname: server.hostname,
              rootPassword: server.rootPassword || '',
              sshPublicKey,
            },
          }).catch((e) => logger.error({ err: e, serverId: server.id }, 'fallback workflow failed'))
        })
    })
  }

  /**
   * Cancel a pending order. Releases the pre-allocated server row.
   * Customer can call this from "Cancel checkout" button or background
   * job sweeps expired orders.
   */
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const order = await prisma.deployOrder.findUnique({ where: { id: orderId } })
    if (!order) return
    if (order.status !== 'pending') return

    await prisma.$transaction([
      prisma.deployOrder.update({
        where: { id: order.id },
        data: { status: 'cancelled' },
      }),
      prisma.server.update({
        where: { id: order.serverId },
        data: { status: 'DELETED', deletedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: 'deploy.order_cancelled',
          resource: 'deploy_order',
          resourceId: order.id,
          newValue: JSON.stringify({ reason }),
        },
      }),
    ])
  }

  /** Sweep expired pending orders. Called by cron every 15 minutes. */
  async sweepExpired(): Promise<number> {
    const expired = await prisma.deployOrder.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      select: { id: true },
    })
    for (const o of expired) {
      await this.cancelOrder(o.id, 'expired (24h timeout)').catch(() => {})
    }
    return expired.length
  }
}

export default new DeployOrderService()
