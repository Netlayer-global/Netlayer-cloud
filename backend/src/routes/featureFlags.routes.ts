import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Feature flags.
 *
 * Admin manages a small catalogue of flags; customers see them resolved
 * to booleans via /api/feature-flags/resolved.
 *
 * Resolution order:
 *   1. Per-user override (if set)
 *   2. Rollout-percent: hash(userId + flagKey) % 100 < rolloutPercent
 *   3. Default
 */

const hashRollout = (userId: string, key: string): number => {
  let h = 0
  for (const ch of `${userId}:${key}`) h = ((h << 5) - h + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 100
}

router.get('/', async (_req, res, next) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
      include: { _count: { select: { overrides: true } } },
    })
    res.json({ data: flags })
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const body = z.object({
      key: z.string().regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      defaultEnabled: z.boolean().default(false),
      rolloutPercent: z.number().int().min(0).max(100).default(0),
    }).parse(req.body)
    const flag = await prisma.featureFlag.create({ data: body })
    res.status(201).json({ data: flag })
  } catch (e: any) {
    if (e?.code === 'P2002') return next(new AppError('Flag key exists', 400, 'KEY_EXISTS'))
    next(e)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = z.object({
      description: z.string().optional(),
      defaultEnabled: z.boolean().optional(),
      rolloutPercent: z.number().int().min(0).max(100).optional(),
    }).parse(req.body)
    const flag = await prisma.featureFlag.update({ where: { id: req.params.id }, data: body })
    res.json({ data: flag })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.featureFlagOverride.deleteMany({ where: { flagId: req.params.id } }),
      prisma.featureFlag.delete({ where: { id: req.params.id } }),
    ])
    res.json({ message: 'Flag deleted' })
  } catch (e) { next(e) }
})

router.post('/:id/overrides', async (req, res, next) => {
  try {
    const body = z.object({
      userId: z.string(),
      enabled: z.boolean(),
    }).parse(req.body)
    const ov = await prisma.featureFlagOverride.upsert({
      where: { flagId_userId: { flagId: req.params.id, userId: body.userId } },
      create: { flagId: req.params.id, userId: body.userId, enabled: body.enabled },
      update: { enabled: body.enabled },
    })
    res.json({ data: ov })
  } catch (e) { next(e) }
})

router.delete('/:id/overrides/:userId', async (req, res, next) => {
  try {
    await prisma.featureFlagOverride.deleteMany({
      where: { flagId: req.params.id, userId: req.params.userId },
    })
    res.json({ message: 'Override removed' })
  } catch (e) { next(e) }
})

// Customer-facing resolution endpoint
router.get('/resolved', async (req: AuthedRequest, res, next) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      include: {
        overrides: { where: { userId: req.user!.userId } },
      },
    })
    const out: Record<string, boolean> = {}
    for (const f of flags) {
      const ov = f.overrides[0]
      if (ov) {
        out[f.key] = ov.enabled
      } else if (f.rolloutPercent > 0) {
        out[f.key] = hashRollout(req.user!.userId, f.key) < f.rolloutPercent
      } else {
        out[f.key] = f.defaultEnabled
      }
    }
    res.json({ data: out })
  } catch (e) { next(e) }
})

export default router
