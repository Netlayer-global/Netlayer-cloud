import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import { sshFingerprint } from '../utils/fingerprint'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const keys = await prisma.sshKey.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: keys })
  } catch (e) {
    next(e)
  }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      publicKey: z
        .string()
        .min(1)
        .refine((s) => /^(ssh-rsa|ssh-ed25519|ecdsa-sha2)/.test(s.trim()), {
          message: 'Public key must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2',
        }),
    })
    const body = schema.parse(req.body)

    let fingerprint: string
    try {
      fingerprint = sshFingerprint(body.publicKey)
    } catch {
      throw new AppError('Invalid SSH public key', 400, 'INVALID_KEY')
    }

    const key = await prisma.sshKey.create({
      data: {
        userId: req.user!.userId,
        name: body.name,
        publicKey: body.publicKey.trim(),
        fingerprint,
      },
    })
    res.status(201).json({ data: key })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const key = await prisma.sshKey.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!key) throw new AppError('SSH key not found', 404, 'NOT_FOUND')
    await prisma.sshKey.delete({ where: { id: key.id } })
    res.json({ message: 'SSH key deleted' })
  } catch (e) {
    next(e)
  }
})

export default router
