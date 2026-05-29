import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server as IOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'

import { config } from './config/env'
import errorHandler from './middleware/errorHandler'
import { authMiddleware } from './middleware/auth'
import { adminOnly } from './middleware/auth'
import { requestContext } from './middleware/requestContext'
import { idempotency } from './middleware/idempotency'
import { httpMetricsMiddleware, metricsHandler } from './observability/metrics'
import logger from './utils/logger'
import { getPubSubClients } from './utils/redis'
import { setIo } from './services/socket.service'
import { openapiSpec } from './openapi'

import authRoutes from './routes/auth.routes'
import serverRoutes from './routes/servers.routes'
import billingRoutes from './routes/billing.routes'
import adminRoutes from './routes/admin.routes'
import planRoutes from './routes/plans.routes'
import sshRoutes from './routes/ssh.routes'
import notificationRoutes from './routes/notification.routes'
import apiKeyRoutes from './routes/apikey.routes'
import announcementRoutes from './routes/announcement.routes'
import webhookRoutes from './routes/webhook.routes'
import { alertmanagerRouter } from './routes/webhook.routes'
import healthRoutes from './routes/health.routes'
import statusRoutes from './routes/status.routes'
import adminStatusRoutes from './routes/admin-status.routes'
// Round 20
import creditNotesRoutes, { adminCreditNotesRouter } from './routes/creditNotes.routes'
import gstr1Routes from './routes/gstr1.routes'
import adminPlatformRoutes from './routes/adminPlatform.routes'
// Round 22
import deployOrderRoutes from './routes/deployOrders.routes'
import enterpriseAdminRoutes from './routes/enterprise.routes'
import abuseRoutes from './routes/abuse.routes'
import storageRoutes, { storagePublicRouter } from './routes/storage.routes'
import platformRoutes from './routes/platform.routes'
import platformStatsRoutes from './routes/platformStats.routes'
import blogRoutes from './routes/blog.routes'
import websiteRoutes from './routes/website.routes'
// Round 18 routes
import floatingIpRoutes from './routes/floatingIp.routes'
import alertRulesRoutes from './routes/alertRules.routes'
import snapshotsAggregateRoutes from './routes/snapshots.routes'
import promoRoutes from './routes/promo.routes'
import promoAdminRoutes from './routes/promoAdmin.routes'
import ipPoolRoutes from './routes/ipPool.routes'
import isoRoutes from './routes/iso.routes'
import { publicIsoRouter } from './routes/iso.routes'
import capacityRoutes from './routes/capacity.routes'
import healthAdminRoutes from './routes/adminHealth.routes'
import communicationsRoutes from './routes/communications.routes'
import waitlistRoutes from './routes/waitlist.routes'
import volumesRoutes from './routes/volumes.routes'
import loadBalancersRoutes from './routes/loadBalancers.routes'
import databasesRoutes from './routes/databases.routes'
import vpcRoutes from './routes/vpc.routes'
import dnsRoutes from './routes/dns.routes'
import marketplaceRoutes from './routes/marketplace.routes'
import activityRoutes from './routes/activity.routes'
import monitoringRoutes from './routes/monitoring.routes'
import ticketsRoutes from './routes/tickets.routes'
import referralRoutes from './routes/referral.routes'
import webhookSubsRoutes from './routes/webhookSubscriptions.routes'

const app = express()
const httpServer = createServer(app)

// ─── CORS (dev: any localhost; prod: strict allowlist) ──────────────
const corsOrigin = (
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void
) => {
  if (!origin) return cb(null, true)
  if (origin === config.FRONTEND_URL) return cb(null, true)
  if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return cb(null, true)
  }
  return cb(null, false)
}

// ─── Socket.io with optional Redis adapter for horizontal scale ─────
export const io = new IOServer(httpServer, {
  cors: { origin: corsOrigin as any, credentials: true },
})

const pubsub = getPubSubClients()
if (pubsub) {
  io.adapter(createAdapter(pubsub.pub, pubsub.sub))
  logger.info('Socket.io Redis adapter enabled (multi-instance ready)')
} else {
  logger.warn('Socket.io running without Redis adapter (single-instance only)')
}
setIo(io)

// ─── Core middleware ────────────────────────────────────────────────
app.set('trust proxy', 1)
app.use(requestContext)
app.use(httpMetricsMiddleware)
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: corsOrigin, credentials: true }))

// Webhooks need raw body — mount BEFORE express.json()
app.use('/api/webhooks', webhookRoutes)
app.use('/api/webhooks', alertmanagerRouter)

// Storage mock-upload/mock-download also use raw bodies — mount BEFORE express.json()
app.use('/api/storage', storagePublicRouter)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// ─── Health, metrics, docs ──────────────────────────────────────────
app.use('/', healthRoutes)
if (config.metricsEnabled) {
  app.get('/metrics', metricsHandler)
}
app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'NetLayer API' }))

// ─── Public catalog ─────────────────────────────────────────────────
app.use('/api', planRoutes)
app.use('/api/status', statusRoutes)
app.use('/api/abuse', abuseRoutes)
app.use('/api/platform', platformRoutes)
app.use('/api/platform', platformStatsRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/website', websiteRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/waitlist', waitlistRoutes)

// ─── Auth ───────────────────────────────────────────────────────────
app.use('/api/auth', idempotency(), authRoutes)

// ─── User-protected ─────────────────────────────────────────────────
app.use('/api/servers',       authMiddleware, idempotency(), serverRoutes)
app.use('/api/billing',       authMiddleware, idempotency(), billingRoutes)
app.use('/api/ssh-keys',      authMiddleware, idempotency(), sshRoutes)
app.use('/api/notifications', authMiddleware, notificationRoutes)
app.use('/api/api-keys',      authMiddleware, idempotency(), apiKeyRoutes)
app.use('/api/announcements', authMiddleware, announcementRoutes)
app.use('/api/storage',       authMiddleware, idempotency(), storageRoutes)
app.use('/api/volumes',       authMiddleware, idempotency(), volumesRoutes)
app.use('/api/load-balancers', authMiddleware, idempotency(), loadBalancersRoutes)
app.use('/api/databases',     authMiddleware, idempotency(), databasesRoutes)
app.use('/api/vpc',           authMiddleware, idempotency(), vpcRoutes)
app.use('/api/dns',           authMiddleware, idempotency(), dnsRoutes)
app.use('/api/activity',      authMiddleware, activityRoutes)
app.use('/api/monitoring',    authMiddleware, monitoringRoutes)
app.use('/api/support',       authMiddleware, idempotency(), ticketsRoutes)
app.use('/api/referrals',     authMiddleware, referralRoutes)
app.use('/api/webhooks-subs', authMiddleware, idempotency(), webhookSubsRoutes)

// Round 18 user-protected routes
app.use('/api/floating-ips',  authMiddleware, idempotency(), floatingIpRoutes)
app.use('/api/alert-rules',   authMiddleware, idempotency(), alertRulesRoutes)
app.use('/api/snapshots',     authMiddleware, snapshotsAggregateRoutes)
app.use('/api/billing/promo', authMiddleware, idempotency(), promoRoutes)
app.use('/api/iso/public',    authMiddleware, publicIsoRouter)

// Round 20 customer billing routes
app.use('/api/billing/credit-notes', authMiddleware, creditNotesRoutes)

// Round 22: pay-per-deploy orders (customer)
app.use('/api/deploy-orders',  authMiddleware, idempotency(), deployOrderRoutes)

// ─── Admin ──────────────────────────────────────────────────────────
app.use('/api/admin', authMiddleware, idempotency(), adminRoutes)

// Round 18 admin-only sub-routers (rely on adminOnly mw inside each router)
app.use('/api/admin/ip-pools',       authMiddleware, adminOnly, ipPoolRoutes)
app.use('/api/admin/iso',            authMiddleware, adminOnly, isoRoutes)
app.use('/api/admin/promos',         authMiddleware, adminOnly, promoAdminRoutes)
app.use('/api/admin/capacity',       authMiddleware, adminOnly, capacityRoutes)
app.use('/api/admin/health',         authMiddleware, adminOnly, healthAdminRoutes)
app.use('/api/admin/communications', authMiddleware, adminOnly, communicationsRoutes)

// Round 20 admin routes
app.use('/api/admin/credit-notes',   authMiddleware, adminOnly, adminCreditNotesRouter)
app.use('/api/admin/gstr1',          authMiddleware, adminOnly, gstr1Routes)
app.use('/api/admin/platform',       authMiddleware, adminOnly, adminPlatformRoutes)
app.use('/api/admin',                authMiddleware, adminOnly, enterpriseAdminRoutes)

// ─── 404 + error handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND', path: req.path })
})

app.use(errorHandler)

logger.info(`Express initialized in ${config.NODE_ENV} mode`)

export { httpServer }
export default app
