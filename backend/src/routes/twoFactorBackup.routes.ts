import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { customAlphabet } from 'nanoid'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — 2FA backup codes.
 *
 * When a user enables 2FA we issue 10 single-use backup codes (e.g. for
 * lost-phone scenarios). Stored as bcrypt hashes; consumed once per
 * login. User can regenerate any time (invalidates all old codes).
 */

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10)

const formatGroups = (s: string) => s.match(/.{1,5}/g)?.join('-') || s

router.post('/regenerate', async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user?.twoFactorEnabled) {
      throw new AppError('Enable 2FA first', 400, 'TWO_FA_NOT_ENABLED')
    }
    const codes: string[] = []
    const hashes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = formatGroups(codeGen())
      codes.push(code)
      hashes.push(await bcrypt.hash(code, 6))
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: JSON.stringify(hashes) },
    })
    res.json({ data: { codes } })
  } catch (e) { next(e) }
})

router.post('/consume', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ code: z.string().min(8) }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    const stored: string[] = user?.twoFactorBackupCodes
      ? (() => { try { return JSON.parse(user.twoFactorBackupCodes) } catch { return [] } })()
      : []

    let matchedIdx = -1
    for (let i = 0; i < stored.length; i++) {
      if (await bcrypt.compare(body.code, stored[i])) { matchedIdx = i; break }
    }
    if (matchedIdx === -1) throw new AppError('Invalid backup code', 401, 'INVALID_CODE')

    stored.splice(matchedIdx, 1)
    await prisma.user.update({
      where: { id: user!.id },
      data: { twoFactorBackupCodes: JSON.stringify(stored) },
    })
    res.json({ data: { ok: true, remaining: stored.length } })
  } catch (e) { next(e) }
})

router.get('/status', async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
    })
    const codes = user?.twoFactorBackupCodes
      ? (() => { try { return JSON.parse(user.twoFactorBackupCodes) as string[] } catch { return [] } })()
      : []
    res.json({
      data: {
        twoFactorEnabled: !!user?.twoFactorEnabled,
        backupCodesRemaining: codes.length,
      },
    })
  } catch (e) { next(e) }
})

export default router
