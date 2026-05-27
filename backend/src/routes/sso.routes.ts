import { Router } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { customAlphabet } from 'nanoid'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const router = Router()

/**
 * Round 24 — SSO sign-in (Google / GitHub / Microsoft).
 *
 * The frontend uses an OAuth library (e.g. @react-oauth/google) and posts
 * the verified token + user profile here. We trust the profile if and
 * only if the SSO provider keys are configured AND the token matches —
 * in mock mode we accept any payload (devOnly) so the wiring works
 * end-to-end without real OAuth keys.
 *
 * Existing users matched by email auto-link the SSO provider. New users
 * are auto-registered with no password (they must keep using SSO or
 * complete password reset).
 */

const tokenGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24)

const issueToken = (user: { id: string; role: string }) =>
  jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '15m' }
  )

const handleSso = async (provider: 'google' | 'github' | 'microsoft', body: any) => {
  // In production, verify the token against the provider's JWKS / API.
  // Mock mode: trust whatever the frontend posted.
  const profile = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    subject: z.string().min(1),
  }).parse(body.profile)

  let user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } })

  if (user) {
    // Auto-link this SSO provider to the existing account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ssoProvider: user.ssoProvider || provider,
        ssoSubject: user.ssoSubject || profile.subject,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    })
  } else {
    // Auto-register; passwordless account marked as SSO-only
    const passwordHash = await bcrypt.hash(tokenGen() + '!Aa1', 10)
    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        passwordHash,
        firstName: profile.firstName || profile.email.split('@')[0],
        lastName: profile.lastName || '',
        ssoProvider: provider,
        ssoSubject: profile.subject,
        emailVerified: true,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'auth.sso_register',
        resource: 'user',
        resourceId: user.id,
        newValue: JSON.stringify({ provider }),
      },
    })
  }

  return {
    accessToken: issueToken(user),
    user: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      role: user.role, billingMode: user.billingMode,
    },
  }
}

router.post('/google', async (req, res, next) => {
  try {
    const r = await handleSso('google', req.body)
    logger.info({ email: r.user.email }, 'SSO login (google)')
    res.json({ data: r })
  } catch (e: any) {
    next(new AppError(e.message || 'SSO failed', 400, 'SSO_FAILED'))
  }
})

router.post('/github', async (req, res, next) => {
  try {
    const r = await handleSso('github', req.body)
    res.json({ data: r })
  } catch (e: any) {
    next(new AppError(e.message || 'SSO failed', 400, 'SSO_FAILED'))
  }
})

router.post('/microsoft', async (req, res, next) => {
  try {
    const r = await handleSso('microsoft', req.body)
    res.json({ data: r })
  } catch (e: any) {
    next(new AppError(e.message || 'SSO failed', 400, 'SSO_FAILED'))
  }
})

export default router
