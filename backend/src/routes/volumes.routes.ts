import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import blockStorage from '../services/blockStorage.service'
import { emitToUser, emitToAdmin } from '../services/socket.service'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const volumes = await prisma.blockVolume.findMany({
      where: { userId: req.user!.userId },
      include: {
        server: { select: { id: true, name: true, hostname: true, ipv4: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: volumes })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, numbers, and hyphens'),
      sizeGB: z.number().int().min(10).max(16384),
      region: z.string().min(1),
    })
    const body = schema.parse(req.body)

    // Validate region exists
    const region = await prisma.region.findUnique({ where: { slug: body.region } })
    if (!region) throw new AppError('Region not found', 400, 'INVALID_REGION')

    const volume = await blockStorage.createVolume(req.user!.userId, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'volume.create',
        resource: 'block_volume',
        resourceId: volume.id,
        newValue: JSON.stringify({ name: body.name, sizeGB: body.sizeGB, region: body.region }),
      },
    })

    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'volume_created',
        title: 'Volume created',
        message: `${body.name} (${body.sizeGB} GB) is ready.`,
        link: `/dashboard/storage/block`,
      },
    })

    emitToUser(req.user!.userId, 'volume:created', volume)
    emitToAdmin('admin:volume_created', { userId: req.user!.userId, volumeId: volume.id })

    res.status(201).json({ data: volume })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const volume = await prisma.blockVolume.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        server: { select: { id: true, name: true, hostname: true, ipv4: true, status: true } },
      },
    })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')
    res.json({ data: volume })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64).optional(),
      sizeGB: z.number().int().min(10).max(16384).optional(),
    })
    const body = schema.parse(req.body)

    let volume = await prisma.blockVolume.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')

    if (body.sizeGB && body.sizeGB !== volume.sizeGB) {
      volume = await blockStorage.resizeVolume(volume.id, req.user!.userId, body.sizeGB)
    }
    if (body.name && body.name !== volume.name) {
      volume = await prisma.blockVolume.update({ where: { id: volume.id }, data: { name: body.name } })
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'volume.update',
        resource: 'block_volume',
        resourceId: volume.id,
        newValue: JSON.stringify(body),
      },
    })

    res.json({ data: volume })
  } catch (e) { next(e) }
})

router.post('/:id/attach', async (req: AuthedRequest, res, next) => {
  try {
    const { serverId } = z.object({ serverId: z.string().min(1) }).parse(req.body)
    const volume = await blockStorage.attachVolume(req.params.id, req.user!.userId, serverId)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'volume.attach',
        resource: 'block_volume',
        resourceId: volume.id,
        newValue: JSON.stringify({ serverId }),
      },
    })

    emitToUser(req.user!.userId, 'volume:attached', volume)
    res.json({ data: volume })
  } catch (e) { next(e) }
})

router.post('/:id/detach', async (req: AuthedRequest, res, next) => {
  try {
    const volume = await blockStorage.detachVolume(req.params.id, req.user!.userId)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'volume.detach',
        resource: 'block_volume',
        resourceId: volume.id,
      },
    })

    emitToUser(req.user!.userId, 'volume:detached', volume)
    res.json({ data: volume })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await blockStorage.deleteVolume(req.params.id, req.user!.userId)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'volume.delete',
        resource: 'block_volume',
        resourceId: req.params.id,
      },
    })

    emitToUser(req.user!.userId, 'volume:deleted', { id: req.params.id })
    res.json({ message: 'Volume deleted' })
  } catch (e) { next(e) }
})

export default router
