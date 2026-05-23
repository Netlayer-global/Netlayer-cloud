import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import ipPoolService from '../services/ipPool.service'

const router = Router()

/** GET /api/admin/ip-pools — admin overview */
router.get('/', async (_req, res, next) => {
  try {
    const pools = await prisma.ipPool.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        region: { select: { id: true, name: true, slug: true, flag: true, countryCode: true } },
        _count: { select: { ips: true } },
      },
    })
    const enriched = await Promise.all(
      pools.map(async (p) => {
        const [available, assigned, reserved] = await Promise.all([
          prisma.ipAddress.count({ where: { poolId: p.id, status: 'available' } }),
          prisma.ipAddress.count({ where: { poolId: p.id, status: 'assigned' } }),
          prisma.ipAddress.count({ where: { poolId: p.id, status: 'reserved' } }),
        ])
        return {
          ...p,
          counts: { total: p._count.ips, available, assigned, reserved },
        }
      })
    )
    res.json({ data: enriched })
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const body = z
      .object({
        regionId: z.string().min(1),
        cidr: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, 'Invalid CIDR'),
        gateway: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP'),
        type: z.enum(['public', 'private', 'floating']).optional(),
        dns1: z.string().optional(),
        dns2: z.string().optional(),
      })
      .parse(req.body)
    const pool = await ipPoolService.createPool(body)
    res.status(201).json({ data: { ...pool, usableHosts: ipPoolService.countUsable(body.cidr) } })
  } catch (e) { next(e) }
})

router.get('/:id/ips', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(200, parseInt((req.query.limit as string) || '50', 10))

    const [total, rows] = await Promise.all([
      prisma.ipAddress.count({ where: { poolId: req.params.id } }),
      prisma.ipAddress.findMany({
        where: { poolId: req.params.id },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { server: { select: { id: true, name: true, hostname: true, status: true } } },
      }),
    ])
    res.json({ data: rows, pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await ipPoolService.deletePool(req.params.id)
    res.json({ message: 'Pool deleted' })
  } catch (e) { next(e) }
})

/** Admin override: force-release an IP back to the pool. */
router.post('/ips/:ipId/release', async (req, res, next) => {
  try {
    const ip = await prisma.ipAddress.findUnique({ where: { id: req.params.ipId } })
    if (!ip) throw new AppError('IP not found', 404, 'NOT_FOUND')
    await ipPoolService.releaseIp(ip.id)
    res.json({ message: 'IP released' })
  } catch (e) { next(e) }
})

export default router
