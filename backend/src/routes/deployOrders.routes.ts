import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import deployOrderService from '../services/deployOrder.service'
import paymentService from '../services/payment.service'

const router = Router()

const serialize = (o: any) => ({
  ...o,
  taxBreakdown: (() => {
    if (!o.taxBreakdown) return null
    try { return JSON.parse(o.taxBreakdown) } catch { return null }
  })(),
})

/**
 * Customer creates a new deploy order (pre-payment).
 * Returns the gateway checkout payload — frontend opens Razorpay checkout
 * directly with the returned orderId / keyId.
 */
router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        planId: z.string().min(1),
        regionId: z.string().min(1),
        osTemplateId: z.string().min(1),
        sshKeyId: z.string().optional(),
        hostname: z.string().min(3).max(64).optional(),
        rootPassword: z.string().min(8).optional(),
        preferredProvider: z.enum(['razorpay', 'stripe']).optional(),
      })
      .parse(req.body)

    const result = await deployOrderService.createOrder({
      userId: req.user!.userId,
      ...body,
    })
    res.status(201).json({ data: result })
  } catch (e) { next(e) }
})

/** List the user's deploy orders (paid + pending). */
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const orders = await prisma.deployOrder.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        // Don't include Server here — front-end uses the order to navigate
        // to the server detail page once status == 'paid'.
      },
    })
    res.json({ data: orders.map(serialize) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const order = await prisma.deployOrder.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')
    res.json({ data: serialize(order) })
  } catch (e) { next(e) }
})

/**
 * Customer-initiated payment confirmation. Used by Razorpay's `handler`
 * callback (frontend) — verifies signature client-side then asks us to
 * confirm. The webhook is the source of truth, but this endpoint shortens
 * the perceived latency from "card swiped" → "deploy starts" to ~1s.
 */
router.post('/:id/verify-payment', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        razorpay_payment_id: z.string().optional(),
        razorpay_order_id: z.string().optional(),
        razorpay_signature: z.string().optional(),
        stripe_payment_intent_id: z.string().optional(),
      })
      .parse(req.body)

    const order = await prisma.deployOrder.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')
    if (order.status === 'paid') {
      return res.json({ data: { alreadyPaid: true, serverId: order.serverId } })
    }
    if (order.status !== 'pending') {
      throw new AppError(`Order is ${order.status}`, 400, 'ORDER_INVALID_STATE')
    }

    let paymentRef: string | null = null

    if (order.provider === 'razorpay') {
      if (!body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
        throw new AppError('razorpay_payment_id + razorpay_order_id + razorpay_signature required', 400, 'INVALID_INPUT')
      }
      if (body.razorpay_order_id !== order.providerOrderId) {
        throw new AppError('order id mismatch', 400, 'ORDER_MISMATCH')
      }
      const ok = paymentService.verifyRazorpaySignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature
      )
      if (!ok) throw new AppError('Invalid signature', 401, 'INVALID_SIGNATURE')
      paymentRef = body.razorpay_payment_id
    } else if (order.provider === 'stripe') {
      if (!body.stripe_payment_intent_id) {
        throw new AppError('stripe_payment_intent_id required', 400, 'INVALID_INPUT')
      }
      paymentRef = body.stripe_payment_intent_id
    }

    if (!paymentRef) {
      throw new AppError('payment reference missing', 400, 'INVALID_INPUT')
    }

    await deployOrderService.markOrderPaid(order.id, paymentRef)

    res.json({
      data: {
        success: true,
        orderId: order.id,
        serverId: order.serverId,
      },
    })
  } catch (e) { next(e) }
})

/** Customer cancels a pending order they don't want to pay. */
router.post('/:id/cancel', async (req: AuthedRequest, res, next) => {
  try {
    const order = await prisma.deployOrder.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND')
    if (order.status !== 'pending') {
      throw new AppError(`Order is ${order.status}, cannot cancel`, 400, 'ORDER_INVALID_STATE')
    }
    await deployOrderService.cancelOrder(order.id, 'cancelled by customer')
    res.json({ data: { cancelled: true } })
  } catch (e) { next(e) }
})

export default router
