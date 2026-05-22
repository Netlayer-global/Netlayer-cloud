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
