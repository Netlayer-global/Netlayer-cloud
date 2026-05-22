/**
 * billing-svc — invoices, transactions, payment orders, webhook ingest.
 *
 * Standalone:  npm run svc:billing
 *
 * Webhooks need raw body for signature verification, so they're mounted
 * before the global JSON parser.
 */

import 'dotenv/config'
import express from 'express'
import { config } from '../config/env'
import { createService } from './createService'
import { authMiddleware } from '../middleware/auth'
import billingRoutes from '../routes/billing.routes'
import webhookRoutes from '../routes/webhook.routes'
import { idempotency } from '../middleware/idempotency'

const PORT = parseInt(process.env.BILLING_SVC_PORT || '5002', 10)

if (require.main === module) {
  createService({
    name: 'billing-svc',
    port: PORT,
    jsonBody: false, // we mount webhooks first with raw body, then add json globally
    mount: (app) => {
      // webhooks first (raw body inside the router)
      app.use('/api/webhooks', webhookRoutes)
      // then JSON parser for everything else
      app.use(express.json({ limit: '1mb' }))
      app.use('/api/billing', authMiddleware, idempotency(), billingRoutes)
    },
  })
  void config
}
