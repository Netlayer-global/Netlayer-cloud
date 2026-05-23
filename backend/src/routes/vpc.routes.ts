import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'
import vpcService from '../services/vpc.service'
import { emitToUser } from '../services/socket.service'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const vpcs = await vpcService.list(req.user!.userId)
    res.json({ data: vpcs })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      region: z.string().min(1),
      cidr: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/).optional(),
      isDefault: z.boolean().optional(),
    })
    const body = schema.parse(req.body)
    const vpc = await vpcService.create(req.user!.userId, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'vpc.create',
        resource: 'vpc',
        resourceId: vpc.id,
        newValue: JSON.stringify({ name: body.name, region: body.region, cidr: vpc.cidr }),
      },
    })

    emitToUser(req.user!.userId, 'vpc:created', vpc)
    res.status(201).json({ data: vpc })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const vpc = await vpcService.get(req.user!.userId, req.params.id)
    res.json({ data: vpc })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await vpcService.destroy(req.user!.userId, req.params.id)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'vpc.delete',
        resource: 'vpc',
        resourceId: req.params.id,
      },
    })
    res.json({ message: 'VPC deleted' })
  } catch (e) { next(e) }
})

router.post('/:id/members', async (req: AuthedRequest, res, next) => {
  try {
    const { serverId } = z.object({ serverId: z.string().min(1) }).parse(req.body)
    const member = await vpcService.attachServer(req.user!.userId, req.params.id, serverId)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'vpc.member.add',
        resource: 'vpc',
        resourceId: req.params.id,
        newValue: JSON.stringify({ serverId, privateIp: member.privateIp }),
      },
    })

    res.status(201).json({ data: member })
  } catch (e) { next(e) }
})

router.delete('/:id/members/:memberId', async (req: AuthedRequest, res, next) => {
  try {
    await vpcService.detachServer(req.user!.userId, req.params.id, req.params.memberId)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'vpc.member.remove',
        resource: 'vpc',
        resourceId: req.params.id,
      },
    })
    res.json({ message: 'Server removed from VPC' })
  } catch (e) { next(e) }
})

export default router
