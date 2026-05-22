import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import { serializeApiKey } from '../utils/serialize'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    // never return the hash; return prefix only
    const sanitized = keys.map((k) => {
      const { keyHash, ...rest } = k
      return serializeApiKey(rest)
    })
    res.json({ data: sanitized })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      permissions: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
    })
    const body = schema.parse(req.body)

    const raw = crypto.randomBytes(32).toString('hex')
    const fullKey = `nl_${raw}`
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')
    const keyPrefix = fullKey.slice(0, 11)

    const created = await prisma.apiKey.create({
      data: {
        userId: req.user!.userId,
        name: body.name,
        keyHash,
        keyPrefix,
        permissions: JSON.stringify(body.permissions ?? []),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    const { keyHash: _h, ...rest } = created
    res.status(201).json({
      data: { ...serializeApiKey(rest), key: fullKey },
      message: 'Save this key now. It will not be shown again.',
    })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!key) throw new AppError('API key not found', 404, 'NOT_FOUND')
    await prisma.apiKey.delete({ where: { id: key.id } })
    res.json({ message: 'API key revoked' })
  } catch (e) { next(e) }
})

export default router
