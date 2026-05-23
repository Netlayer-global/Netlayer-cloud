import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.cannedResponse.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    })
    res.json({ data: items })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(120),
      content: z.string().min(1).max(10_000),
      category: z.string().min(1).max(64).default('general'),
    })
    const body = schema.parse(req.body)
    const item = await prisma.cannedResponse.create({
      data: { ...body, createdBy: req.user!.userId },
    })
    res.status(201).json({ data: item })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(120).optional(),
      content: z.string().min(1).max(10_000).optional(),
      category: z.string().min(1).max(64).optional(),
    })
    const body = schema.parse(req.body)
    const item = await prisma.cannedResponse.update({
      where: { id: req.params.id },
      data: body,
    })
    res.json({ data: item })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.cannedResponse.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Canned response not found', 404, 'NOT_FOUND')
    await prisma.cannedResponse.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted' })
  } catch (e) { next(e) }
})

export default router
