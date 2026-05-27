import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Server templates.
 *
 * A "template" is a saved configuration (sometimes a snapshot too) of an
 * existing server that can be re-deployed without re-doing the install.
 * Customers can mark templates as private (default) or shared with their
 * org — public templates are an admin-only feature.
 */

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const templates = await prisma.serverTemplate.findMany({
      where: { OR: [{ userId: req.user!.userId }, { isPublic: true }] },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: templates })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).max(80),
      description: z.string().optional(),
      sourceServerId: z.string().optional(),
    }).parse(req.body)

    if (body.sourceServerId) {
      const owned = await prisma.server.findFirst({
        where: { id: body.sourceServerId, userId: req.user!.userId, deletedAt: null },
      })
      if (!owned) throw new AppError('Source server not found', 404, 'NOT_FOUND')
    }

    // Per-user quota
    const count = await prisma.serverTemplate.count({ where: { userId: req.user!.userId } })
    if (count >= 20) {
      throw new AppError('Template limit reached (20 per account)', 400, 'QUOTA_EXCEEDED')
    }

    const tpl = await prisma.serverTemplate.create({
      data: {
        userId: req.user!.userId,
        name: body.name,
        description: body.description,
        sourceServerId: body.sourceServerId,
        // In mock mode mark ready immediately. Real flow: kick off a
        // proxmox snapshot job and flip status when it completes.
        status: 'ready',
      },
    })
    res.status(201).json({ data: tpl })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const tpl = await prisma.serverTemplate.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!tpl) throw new AppError('Template not found', 404, 'NOT_FOUND')
    await prisma.serverTemplate.delete({ where: { id: tpl.id } })
    res.json({ message: 'Template deleted' })
  } catch (e) { next(e) }
})

export default router
