import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

const router = Router()

/**
 * Round 20 — Admin platform-wide views.
 *
 * These endpoints return ALL resources across ALL users so an operator can
 * spot abuse, plan capacity, audit usage, and force-clean orphaned objects.
 *
 * Sub-paths:
 *   /admin/platform/networks   — every floating IP + VPC across users
 *   /admin/platform/storage    — every bucket + volume
 *   /admin/platform/dns        — every DNS zone + record count
 *   /admin/platform/marketplace — AppTemplate CRUD
 */

router.get('/networks', async (_req, res, next) => {
  try {
    const [floatingIps, vpcs] = await Promise.all([
      prisma.floatingIp.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          region: { select: { id: true, name: true, slug: true, flag: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          server: { select: { id: true, name: true } },
        },
      }),
      prisma.vPC.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
      }),
    ])
    res.json({ data: { floatingIps, vpcs } })
  } catch (e) { next(e) }
})

router.post('/networks/floating-ips/:id/release', async (req, res, next) => {
  try {
    const fip = await prisma.floatingIp.findUnique({ where: { id: req.params.id } })
    if (!fip) throw new AppError('Floating IP not found', 404, 'NOT_FOUND')
    await prisma.floatingIp.update({
      where: { id: fip.id },
      data: { serverId: null, status: 'unassigned' },
    })
    res.json({ message: 'Floating IP unassigned (admin override)' })
  } catch (e) { next(e) }
})

router.get('/storage', async (_req, res, next) => {
  try {
    const [buckets, volumes] = await Promise.all([
      prisma.storageBucket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.blockVolume.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          server: { select: { id: true, name: true } },
        },
      }),
    ])
    const totalBytes = buckets.reduce((s, b) => s + Number(b.sizeBytes), 0)
    const totalVolumeGB = volumes.reduce((s, v) => s + v.sizeGB, 0)
    res.json({
      data: {
        buckets: buckets.map((b) => ({ ...b, sizeBytes: Number(b.sizeBytes) })),
        volumes,
        totals: { bytes: totalBytes, volumeGB: totalVolumeGB },
      },
    })
  } catch (e) { next(e) }
})

router.get('/dns', async (_req, res, next) => {
  try {
    const zones = await prisma.dnsZone.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { records: true } },
      },
    })
    res.json({ data: zones })
  } catch (e) { next(e) }
})

router.get('/marketplace', async (_req, res, next) => {
  try {
    const apps = await prisma.appTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    res.json({ data: apps })
  } catch (e) { next(e) }
})

router.post('/marketplace', async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(120),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        description: z.string().min(1),
        logo: z.string(),
        category: z.string(),
        minPlanSlug: z.string().default('c2-medium'),
        userDataScript: z.string().min(1),
        ports: z.array(z.number().int()).default([]),
        envVars: z.array(z.any()).default([]),
        isActive: z.boolean().default(true),
      })
      .parse(req.body)

    const created = await prisma.appTemplate.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        logo: body.logo,
        category: body.category,
        minPlanSlug: body.minPlanSlug,
        userDataScript: body.userDataScript,
        ports: JSON.stringify(body.ports),
        envVars: JSON.stringify(body.envVars),
        isActive: body.isActive,
      },
    })
    res.status(201).json({ data: created })
  } catch (e) { next(e) }
})

router.patch('/marketplace/:id', async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(120).optional(),
        description: z.string().min(1).optional(),
        category: z.string().optional(),
        minPlanSlug: z.string().optional(),
        userDataScript: z.string().min(1).optional(),
        ports: z.array(z.number().int()).optional(),
        envVars: z.array(z.any()).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body)

    const data: any = { ...body }
    if (body.ports) data.ports = JSON.stringify(body.ports)
    if (body.envVars) data.envVars = JSON.stringify(body.envVars)

    const app = await prisma.appTemplate.update({ where: { id: req.params.id }, data })
    res.json({ data: app })
  } catch (e) { next(e) }
})

router.delete('/marketplace/:id', async (req, res, next) => {
  try {
    await prisma.appTemplate.delete({ where: { id: req.params.id } })
    res.json({ message: 'App template deleted' })
  } catch (e) { next(e) }
})

export default router
