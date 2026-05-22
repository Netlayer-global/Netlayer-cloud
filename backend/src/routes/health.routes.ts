import { Router } from 'express'
import prisma from '../utils/prisma'
import logger from '../utils/logger'

/**
 * Liveness vs readiness:
 *   /healthz  → process is up.        Used by Docker/k8s liveness probes.
 *   /readyz   → can serve traffic.    Used by k8s readiness + LB health checks.
 *                                     Fails if DB is unreachable.
 */

const router = Router()

router.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

router.get('/readyz', async (_req, res) => {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  // DB check
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (e: any) {
    checks.db = { ok: false, error: e.message, latencyMs: Date.now() - dbStart }
    logger.warn({ err: e }, 'readyz: db check failed')
  }

  // Redis check (best-effort, doesn't fail readiness if absent in dev)
  try {
    const { isRedisHealthy } = await import('../utils/redis')
    const redisHealthy = await isRedisHealthy()
    checks.redis = { ok: redisHealthy }
  } catch {
    checks.redis = { ok: true } // optional in dev
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not_ready',
    ts: Date.now(),
    checks,
  })
})

// Backwards-compatible alias
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

export default router
