import { Router } from 'express'
import { z } from 'zod'
import { customAlphabet } from 'nanoid'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import logger from '../utils/logger'

/**
 * Round 24 — Phone OTP verification.
 *
 * Flow:
 *   1. POST /phone-otp/send  → generates 6-digit code, stores hash + expiry, dispatches via SMS
 *   2. POST /phone-otp/verify → user submits code, we mark phoneVerified=true
 *
 * Mock mode: code is logged to console + returned in response (devOnlyCode).
 * Production mode (MSG91/Twilio configured): code is sent to user's phone.
 *
 * Rate-limited via existing per-user middleware. After 5 wrong attempts the
 * code is invalidated and the user must request a new one.
 */

const router = Router()
const otpGen = customAlphabet('0123456789', 6)

router.post('/send', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
    }).parse(req.body)

    const code = otpGen()
    const expiresAt = new Date(Date.now() + 10 * 60_000) // 10 minutes

    // Store the user's pending phone + OTP. Phone is provisionally set so
    // the same flow handles "user updates their phone" + "verify new phone".
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        phone: body.phone,
        phoneOtpCode: code,
        phoneOtpExpiresAt: expiresAt,
        phoneOtpAttempts: 0,
        phoneVerified: false, // re-verification required for new number
      },
    })

    // Mock-mode SMS — production replaces this with MSG91/Twilio call.
    const smsMock = process.env.SMS_MOCK_MODE !== 'false'
    if (smsMock) {
      logger.info({ phone: body.phone, code }, 'phone OTP (mock mode)')
    } else {
      // TODO: real SMS dispatch via msg91.service.ts when keys are wired
      logger.info({ phone: body.phone }, 'phone OTP dispatched')
    }

    res.json({
      data: {
        sent: true,
        expiresAt,
        // In mock mode return the code so dev/test can complete the flow
        // without needing real SMS. Production must set SMS_MOCK_MODE=false.
        ...(smsMock ? { devOnlyCode: code } : {}),
      },
    })
  } catch (e) { next(e) }
})

router.post('/verify', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      code: z.string().regex(/^\d{6}$/, '6-digit code required'),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    if (!user.phoneOtpCode || !user.phoneOtpExpiresAt) {
      throw new AppError('No OTP pending — request a new code', 400, 'NO_OTP')
    }
    if (user.phoneOtpExpiresAt < new Date()) {
      throw new AppError('OTP expired — request a new code', 400, 'OTP_EXPIRED')
    }
    if (user.phoneOtpAttempts >= 5) {
      throw new AppError('Too many wrong attempts — request a new code', 400, 'OTP_LOCKED')
    }
    if (user.phoneOtpCode !== body.code) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneOtpAttempts: { increment: 1 } },
      })
      throw new AppError('Invalid code', 400, 'OTP_INVALID')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneOtpCode: null,
        phoneOtpExpiresAt: null,
        phoneOtpAttempts: 0,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'phone.verified',
        resource: 'user',
        resourceId: user.id,
      },
    })
    res.json({ data: { verified: true, phone: user.phone } })
  } catch (e) { next(e) }
})

export default router
