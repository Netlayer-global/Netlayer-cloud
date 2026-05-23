import crypto from 'crypto'
import Razorpay from 'razorpay'
import Stripe from 'stripe'
import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { AppError } from '../utils/errors'
import emailService from './email.service'
import smsService from './sms.service'
import referralService from './referral.service'
import * as eventBus from '../events/bus'
import { EVENTS } from '../events/bus'
import { serializeInvoice } from '../utils/serialize'

const COUNTRY_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR',
  SG: 'SGD', AU: 'AUD', CA: 'CAD',
}

const FALLBACK_RATES: Record<string, number> = {
  INR: 83, EUR: 0.92, GBP: 0.79, SGD: 1.34, AUD: 1.53, CAD: 1.36, USD: 1,
}

export class PaymentService {
  getProviderForCountry(country: string): 'razorpay' | 'stripe' {
    return country === 'IN' ? 'razorpay' : 'stripe'
  }

  getCurrencyForCountry(country: string): string {
    return COUNTRY_CURRENCY[country] || 'USD'
  }

  getExchangeRate(from: string, to: string): number {
    if (from === to) return 1
    const fromUSD = FALLBACK_RATES[from] || 1
    const toUSD = FALLBACK_RATES[to] || 1
    return toUSD / fromUSD
  }

  async createOrder(userId: string, invoiceId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } })
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')
    if (invoice.status === 'PAID') throw new AppError('Invoice already paid', 400, 'ALREADY_PAID')

    const provider = this.getProviderForCountry(user.country)
    const currency = invoice.currency || this.getCurrencyForCountry(user.country)
    const amount = invoice.total > 0 ? invoice.total : invoice.amount

    if (provider === 'razorpay') {
      const order = await this.createRazorpayOrder(amount, currency, invoice.invoiceNumber)
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { razorpayOrderId: order.id },
      })
      return {
        provider: 'razorpay' as const,
        orderId: order.id,
        amount,
        currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      }
    } else {
      const intent = await this.createStripePaymentIntent(amount, currency, user.stripeCustomerId)
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { stripePaymentId: intent.id },
      })
      return {
        provider: 'stripe' as const,
        orderId: intent.id,
        amount,
        currency,
        key: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
        clientSecret: intent.client_secret || '',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      }
    }
  }

  // ─── RAZORPAY ──────────────────────────────────────
  async createRazorpayOrder(amount: number, currency: string, receipt: string): Promise<any> {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      // Mock order
      logger.info(`[Razorpay MOCK] createOrder ${amount} ${currency}`)
      return {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        status: 'created',
      }
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
    return rzp.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: true,
    })
  }

  verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      // In mock mode, accept any signature for the mock order id
      return orderId.startsWith('order_mock_')
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    return expected === signature
  }

  async handleRazorpayWebhook(body: any, signature: string): Promise<void> {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex')
      if (expected !== signature) throw new AppError('Invalid signature', 401, 'INVALID_SIGNATURE')
    }
    if (body.event === 'payment.captured') {
      const payment = body.payload?.payment?.entity
      const invoice = await prisma.invoice.findFirst({
        where: { razorpayOrderId: payment.order_id },
      })
      if (invoice) {
        await this.markInvoicePaid(invoice.id, payment.id, 'razorpay')
      }
    }
  }

  // ─── STRIPE ────────────────────────────────────────
  async createStripePaymentIntent(amount: number, currency: string, customerId?: string | null): Promise<any> {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) {
      logger.info(`[Stripe MOCK] createPaymentIntent ${amount} ${currency}`)
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
      }
    }
    const stripe = new Stripe(secret)
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      customer: customerId || undefined,
      automatic_payment_methods: { enabled: true },
    })
  }

  async handleStripeWebhook(body: Buffer, signature: string): Promise<void> {
    const secret = process.env.STRIPE_SECRET_KEY
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret || !whSecret) {
      logger.warn('Stripe webhook received but secrets not configured')
      return
    }
    const stripe = new Stripe(secret)
    const event = stripe.webhooks.constructEvent(body, signature, whSecret)
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const invoice = await prisma.invoice.findFirst({ where: { stripePaymentId: intent.id } })
      if (invoice) {
        await this.markInvoicePaid(invoice.id, intent.id, 'stripe')
      }
    }
  }

  // ─── COMMON ────────────────────────────────────────
  async markInvoicePaid(invoiceId: string, paymentId: string, method: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')
    if (invoice.status === 'PAID') return

    const user = await prisma.user.findUnique({ where: { id: invoice.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const amount = invoice.total > 0 ? invoice.total : invoice.amount
    const before = user.balance
    const after = before + amount

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: method,
          razorpayPaymentId: method === 'razorpay' ? paymentId : invoice.razorpayPaymentId,
          stripePaymentId: method === 'stripe' ? paymentId : invoice.stripePaymentId,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { balance: after },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'credit',
          amount,
          currency: invoice.currency,
          description: `Payment received: invoice ${invoice.invoiceNumber}`,
          reference: paymentId,
          invoiceId: invoice.id,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'payment_success',
          title: 'Payment received',
          message: `₹${amount} for invoice ${invoice.invoiceNumber.slice(-8).toUpperCase()}`,
          link: `/dashboard/billing`,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'invoice.paid',
          resource: 'invoice',
          resourceId: invoice.id,
          newValue: JSON.stringify({ amount, method, paymentId }),
        },
      }),
    ])

    try {
      await emailService.sendPaymentSuccess(user, { id: invoice.invoiceNumber, amount })
    } catch (e: any) {
      logger.warn('payment success email failed', { error: e.message })
    }

    // Settle any pending referral once the referee crosses the spend threshold.
    try {
      await referralService.settlePending(user.id)
    } catch (e: any) {
      logger.warn('referral settle failed', { error: e.message })
    }

    // Domain event (NATS in real mode, in-process otherwise)
    void eventBus.publish(EVENTS.PAYMENT_COMPLETED, {
      invoiceId: invoice.id, userId: user.id, amount, currency: invoice.currency,
    })
    if (user.phone) {
      try {
        await smsService.sendPaymentSuccess(user.phone, `₹${amount.toFixed(2)}`)
      } catch (e: any) {
        logger.warn('payment success SMS failed', { error: e.message })
      }
    }
  }

  async processRefund(invoiceId: string, reason: string, adminId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')
    if (invoice.status !== 'PAID') throw new AppError('Only paid invoices can be refunded', 400, 'NOT_PAID')

    const amount = invoice.total > 0 ? invoice.total : invoice.amount
    const method = invoice.paymentMethod || ''

    if (method === 'razorpay' && invoice.razorpayPaymentId && process.env.RAZORPAY_KEY_ID) {
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      })
      await (rzp as any).payments.refund(invoice.razorpayPaymentId, {
        amount: Math.round(amount * 100),
        notes: { reason },
      })
    } else if (method === 'stripe' && invoice.stripePaymentId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      await stripe.refunds.create({
        payment_intent: invoice.stripePaymentId,
        reason: 'requested_by_customer',
        metadata: { reason },
      })
    } else {
      logger.info(`[Refund MOCK] ${invoice.invoiceNumber} ${amount} ${invoice.currency}: ${reason}`)
    }

    const user = await prisma.user.findUnique({ where: { id: invoice.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const before = user.balance
    const after = before - amount

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'REFUNDED' },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { balance: after },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'debit',
          amount,
          currency: invoice.currency,
          description: `Refund: ${reason}`,
          reference: invoice.invoiceNumber,
          invoiceId: invoice.id,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'invoice.refunded',
          resource: 'invoice',
          resourceId: invoice.id,
          newValue: JSON.stringify({ amount, reason }),
        },
      }),
    ])
  }

  static async testRazorpay(
    keyId: string,
    keySecret: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
      // Attempt a tiny zero-impact call: list payments (limit 1)
      const result = await rzp.payments.all({ count: 1 } as any)
      return { success: true, accountName: `Verified (${result.count} payments)` }
    } catch (e: any) {
      return { success: false, error: e.error?.description || e.message }
    }
  }

  static async testStripe(
    secretKey: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const stripe = new Stripe(secretKey)
      const account = await stripe.accounts.retrieve()
      return {
        success: true,
        accountName: account.business_profile?.name || account.email || account.id,
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}

export default new PaymentService()
