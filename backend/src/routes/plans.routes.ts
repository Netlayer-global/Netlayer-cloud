import { Router } from 'express'
import prisma from '../utils/prisma'

const router = Router()

router.get('/plans', async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    // Round 23: serialize raidSupported (JSON-string in DB) and expose stockAvailable
    const out = plans.map((p) => ({
      ...p,
      raidSupported: (() => {
        try { return JSON.parse(p.raidSupported || '[]') } catch { return [] }
      })(),
      stockAvailable: Math.max(0, (p.stockTotal || 0) - (p.stockReserved || 0)),
    }))
    res.json({ data: out })
  } catch (e) {
    next(e)
  }
})

router.get('/regions', async (_req, res, next) => {
  try {
    const regions = await prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    res.json({ data: regions })
  } catch (e) {
    next(e)
  }
})

router.get('/os', async (_req, res, next) => {
  try {
    const os = await prisma.osTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ family: 'asc' }, { name: 'asc' }],
    })
    res.json({ data: os })
  } catch (e) {
    next(e)
  }
})

export default router
