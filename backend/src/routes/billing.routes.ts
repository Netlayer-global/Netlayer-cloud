import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import { serializeInvoice } from '../utils/serialize'
import paymentService from '../services/payment.service'

const router = Router()

router.get('/invoices', async (req: AuthedRequest, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: invoices.map(serializeInvoice) })
  } catch (e) { next(e) }
})

router.get('/invoices/:id/pdf', async (req: AuthedRequest, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' })
    }
    const { generateInvoicePDF } = await import('../services/invoice.service')
    const pdf = await generateInvoicePDF({ invoiceId: invoice.id })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (e) { next(e) }
})

router.get('/usage', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const servers = await prisma.server.findMany({
      where: { userId, deletedAt: null },
      include: { plan: true, region: true },
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const items = servers.map((s) => {
      const start = s.createdAt > startOfMonth ? s.createdAt : startOfMonth
      const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86_400_000))
      const dailyRate = s.plan.priceInr / daysInMonth
      const amount = Math.round(days * dailyRate * 100) / 100
      return {
        serverId: s.id,
        serverName: s.name,
        plan: s.plan.name,
        region: s.region.city,
        days,
        amount,
      }
    })

    const total = items.reduce((sum, i) => sum + i.amount, 0)
    const user = await prisma.user.findUnique({ where: { id: userId } })

    // Round 19: month-end forecast + credit runway projection
    const dayOfMonth = now.getDate()
    const daysRemaining = daysInMonth - dayOfMonth
    const forecastMonthEnd = dayOfMonth > 0 ? Math.round((total / dayOfMonth) * daysInMonth * 100) / 100 : total
    const forecastPerDay = forecastMonthEnd / daysInMonth
    const balance = user?.balance || 0
    const creditRunwayDays = forecastPerDay > 0 ? Math.floor(balance / forecastPerDay) : null
    const lowBalanceWarning = forecastMonthEnd > 0 && balance < forecastMonthEnd * 0.5

    res.json({
      data: {
        balance,
        total: Math.round(total * 100) / 100,
        items,
        period: { start: startOfMonth.toISOString(), end: now.toISOString() },
        forecastMonthEnd,
        dayOfMonth,
        daysRemaining,
        creditRunwayDays,
        lowBalanceWarning,
      },
    })
  } catch (e) { next(e) }
})

router.get('/transactions', async (req: AuthedRequest, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ data: transactions })
  } catch (e) { next(e) }
})

router.post('/orders', async (req: AuthedRequest, res, next) => {
  try {
    const { invoiceId } = z.object({ invoiceId: z.string().min(1) }).parse(req.body)
    const order = await paymentService.createOrder(req.user!.userId, invoiceId)
    res.json({ data: order })
  } catch (e) { next(e) }
})

// Wallet top-up — opens a fresh payment order for an arbitrary credit amount.
// Frontend can call this directly without first creating an invoice.
router.post('/topup', async (req: AuthedRequest, res, next) => {
  try {
    const { amount } = z.object({
      amount: z.number().min(100).max(1_000_000),
    }).parse(req.body)
    const order = await paymentService.topUpWallet(req.user!.userId, amount)
    res.json({ data: order })
  } catch (e) { next(e) }
})

router.post('/verify-razorpay', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
        invoiceId: z.string().min(1),
      })
      .parse(req.body)

    const ok = paymentService.verifyRazorpaySignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    )
    if (!ok) throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE')

    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, userId: req.user!.userId },
    })
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')

    await paymentService.markInvoicePaid(invoice.id, body.razorpay_payment_id, 'razorpay')
    res.json({ message: 'Payment verified' })
  } catch (e) { next(e) }
})

router.post('/pay/:invoiceId', async (req: AuthedRequest, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, userId: req.user!.userId },
    })
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')
    if (invoice.status === 'PAID') throw new AppError('Already paid', 400, 'ALREADY_PAID')

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const amount = invoice.total > 0 ? invoice.total : invoice.amount

    if (user.balance >= amount) {
      const before = user.balance
      const after = before - amount
      await prisma.$transaction([
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID', paidAt: new Date(), paymentMethod: 'balance' },
        }),
        prisma.user.update({ where: { id: user.id }, data: { balance: after } }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'debit',
            amount,
            currency: invoice.currency,
            description: `Invoice payment ${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
            balanceBefore: before,
            balanceAfter: after,
          },
        }),
      ])
      res.json({ message: 'Invoice paid from balance' })
    } else {
      const order = await paymentService.createOrder(req.user!.userId, invoice.id)
      res.json({ data: order, message: 'Insufficient balance — proceed with checkout' })
    }
  } catch (e) { next(e) }
})

export default router
