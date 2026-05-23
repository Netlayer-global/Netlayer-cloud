import { Router } from 'express'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

const router = Router()

const serializeApp = (a: any) => ({
  ...a,
  envVars: (() => { try { return JSON.parse(a.envVars || '[]') } catch { return [] } })(),
  ports:   (() => { try { return JSON.parse(a.ports   || '[]') } catch { return [] } })(),
  // Don't ship the userDataScript in list responses — too large; only on detail.
})

router.get('/', async (_req, res, next) => {
  try {
    const apps = await prisma.appTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ installs: 'desc' }, { name: 'asc' }],
    })
    // Strip the script in list mode.
    const out = apps.map((a) => {
      const { userDataScript, ...rest } = a as any
      return serializeApp(rest)
    })
    res.json({ data: out })
  } catch (e) { next(e) }
})

router.get('/categories', async (_req, res, next) => {
  try {
    const rows = await prisma.appTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { category: 'asc' },
    })
    res.json({
      data: rows.map((r) => ({ category: r.category, count: r._count._all })),
    })
  } catch (e) { next(e) }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const app = await prisma.appTemplate.findUnique({ where: { slug: req.params.slug } })
    if (!app || !app.isActive) throw new AppError('App not found', 404, 'NOT_FOUND')
    res.json({ data: serializeApp(app) })
  } catch (e) { next(e) }
})

export default router
