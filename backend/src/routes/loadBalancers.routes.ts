import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import lbService from '../services/loadBalancer.service'
import { emitToUser, emitToAdmin } from '../services/socket.service'

const router = Router()

const serializeLB = (lb: any) => ({
  ...lb,
  healthCheck: (() => {
    if (!lb.healthCheck) return {}
    if (typeof lb.healthCheck === 'object') return lb.healthCheck
    try { return JSON.parse(lb.healthCheck) } catch { return {} }
  })(),
})

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const lbs = await lbService.list(req.user!.userId)
    res.json({ data: lbs.map(serializeLB) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      region: z.string().min(1),
      algorithm: z.enum(['round_robin', 'least_connections', 'ip_hash']).optional(),
      protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).optional(),
      port: z.number().int().min(1).max(65535).optional(),
      healthCheck: z.object({
        path: z.string().optional(),
        interval: z.number().int().min(5).max(300).optional(),
        timeout: z.number().int().min(1).max(60).optional(),
        healthyThreshold: z.number().int().min(1).max(10).optional(),
        unhealthyThreshold: z.number().int().min(1).max(10).optional(),
        protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).optional(),
        port: z.number().int().min(1).max(65535).optional(),
      }).optional(),
    })
    const body = schema.parse(req.body)

    const region = await prisma.region.findUnique({ where: { slug: body.region } })
    if (!region) throw new AppError('Region not found', 400, 'INVALID_REGION')

    const lb = await lbService.create(req.user!.userId, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'lb.create',
        resource: 'load_balancer',
        resourceId: lb.id,
        newValue: JSON.stringify({ name: body.name, region: body.region }),
      },
    })

    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'lb_created',
        title: 'Load balancer created',
        message: `${body.name} is active at ${lb.ipv4}:${lb.port}.`,
        link: `/dashboard/load-balancers`,
      },
    })

    emitToUser(req.user!.userId, 'lb:created', serializeLB(lb))
    emitToAdmin('admin:lb_created', { userId: req.user!.userId, lbId: lb.id })

    res.status(201).json({ data: serializeLB(lb) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const lb = await lbService.get(req.user!.userId, req.params.id)
    res.json({ data: serializeLB(lb) })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64).optional(),
      algorithm: z.enum(['round_robin', 'least_connections', 'ip_hash']).optional(),
      protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).optional(),
      port: z.number().int().min(1).max(65535).optional(),
      healthCheck: z.object({
        path: z.string().optional(),
        interval: z.number().int().min(5).max(300).optional(),
        timeout: z.number().int().min(1).max(60).optional(),
        healthyThreshold: z.number().int().min(1).max(10).optional(),
        unhealthyThreshold: z.number().int().min(1).max(10).optional(),
        protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).optional(),
        port: z.number().int().min(1).max(65535).optional(),
      }).optional(),
    })
    const body = schema.parse(req.body)
    const lb = await lbService.update(req.user!.userId, req.params.id, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'lb.update',
        resource: 'load_balancer',
        resourceId: lb.id,
        newValue: JSON.stringify(body),
      },
    })

    res.json({ data: serializeLB(lb) })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await lbService.destroy(req.user!.userId, req.params.id)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'lb.delete',
        resource: 'load_balancer',
        resourceId: req.params.id,
      },
    })

    emitToUser(req.user!.userId, 'lb:deleted', { id: req.params.id })
    res.json({ message: 'Load balancer deleted' })
  } catch (e) { next(e) }
})

router.post('/:id/targets', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      serverId: z.string().min(1),
      port: z.number().int().min(1).max(65535).optional(),
      weight: z.number().int().min(1).max(100).optional(),
    })
    const body = schema.parse(req.body)
    const target = await lbService.addTarget(
      req.user!.userId, req.params.id, body.serverId, body.port, body.weight
    )

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'lb.target.add',
        resource: 'load_balancer',
        resourceId: req.params.id,
        newValue: JSON.stringify({ serverId: body.serverId, port: body.port }),
      },
    })

    res.status(201).json({ data: target })
  } catch (e) { next(e) }
})

router.delete('/:id/targets/:targetId', async (req: AuthedRequest, res, next) => {
  try {
    await lbService.removeTarget(req.user!.userId, req.params.id, req.params.targetId)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'lb.target.remove',
        resource: 'load_balancer',
        resourceId: req.params.id,
      },
    })

    res.json({ message: 'Target removed' })
  } catch (e) { next(e) }
})

export default router
