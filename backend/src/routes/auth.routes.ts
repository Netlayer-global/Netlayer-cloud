import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AppError } from '../utils/errors'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { registerLimiter, loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimit'
import emailService from '../services/email.service'

const router = Router()

const REFRESH_COOKIE = 'netlayer_refresh'
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

const sanitize = (u: any) => {
  const { passwordHash, emailVerifyToken, resetToken, resetTokenExpiry, twoFactorSecret, ...rest } = u
  return rest
}

// ─── REGISTER / LOGIN / LOGOUT / REFRESH ─────────────────
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/\d/, 'Need digit'),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
      })
      .parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')

    const passwordHash = await bcrypt.hash(body.password, 12)
    const emailVerifyToken = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        emailVerifyToken,
      },
    })

    const clientRole = await prisma.role.findUnique({ where: { name: 'client' } })
    if (clientRole) {
      await prisma.userRoleAssignment.create({
        data: { userId: user.id, roleId: clientRole.id },
      })
    }

    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts)

    emailService.sendWelcome(user, `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`).catch(() => {})

    res.status(201).json({ data: { user: sanitize(user), accessToken } })
  } catch (e) { next(e) }
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account locked. Try again later.', 423, 'ACCOUNT_LOCKED')
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) {
      const attempts = user.loginAttempts + 1
      const data: any = { loginAttempts: attempts }
      if (attempts >= 5) data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
      await prisma.user.update({ where: { id: user.id }, data })
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    if (user.status !== 'ACTIVE') throw new AppError('Account not active', 403, 'ACCOUNT_INACTIVE')

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginAttempts: 0, lockedUntil: null },
    })

    // Audit/session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts)

    res.json({ data: { user: sanitize(user), accessToken } })
  } catch (e) { next(e) }
})

router.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/' })
  res.json({ message: 'Logged out' })
})

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) throw new AppError('No refresh token', 401, 'NO_REFRESH')
    const { userId } = verifyRefreshToken(token)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.status !== 'ACTIVE') throw new AppError('Invalid refresh', 401, 'INVALID_REFRESH')
    const accessToken = generateAccessToken(user.id, user.role)
    res.json({ data: { accessToken }, accessToken })
  } catch (e) {
    next(e instanceof AppError ? e : new AppError('Invalid refresh', 401, 'INVALID_REFRESH'))
  }
})

router.get('/me', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { roleAssignments: { include: { role: true } } },
    })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    res.json({ data: sanitize(user) })
  } catch (e) { next(e) }
})

router.patch('/profile', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        phone: z.string().optional(),
        country: z.string().length(2).optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
      .parse(req.body)
    const user = await prisma.user.update({ where: { id: req.user!.userId }, data: body })
    res.json({ data: sanitize(user) })
  } catch (e) { next(e) }
})

router.patch('/change-password', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/\d/, 'Need digit'),
      })
      .parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
    if (!valid) throw new AppError('Current password incorrect', 400, 'INVALID_PASSWORD')
    const passwordHash = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    res.json({ message: 'Password changed' })
  } catch (e) { next(e) }
})

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      })
      emailService.sendPasswordReset(user, `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`).catch(() => {})
    }
    res.json({ message: 'If that email exists, a reset link has been sent' })
  } catch (e) { next(e) }
})

router.post('/reset-password', async (req, res, next) => {
  try {
    const body = z
      .object({
        token: z.string().min(1),
        newPassword: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/\d/, 'Need digit'),
      })
      .parse(req.body)
    const user = await prisma.user.findFirst({
      where: { resetToken: body.token, resetTokenExpiry: { gt: new Date() } },
    })
    if (!user) throw new AppError('Invalid or expired token', 400, 'INVALID_TOKEN')
    const passwordHash = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    })
    res.json({ message: 'Password reset successful' })
  } catch (e) { next(e) }
})

// ─── SESSIONS ────────────────────────────────────────────
router.get('/sessions', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user!.userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    })
    res.json({ data: sessions })
  } catch (e) { next(e) }
})

router.delete('/sessions/:id', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const session = await prisma.userSession.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND')
    await prisma.userSession.delete({ where: { id: session.id } })
    res.json({ message: 'Session revoked' })
  } catch (e) { next(e) }
})

// ─── 2FA ─────────────────────────────────────────────────
router.post('/2fa/enable', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const secret = speakeasy.generateSecret({
      name: `NetLayer (${user.email})`,
      issuer: 'NetLayer Cloud',
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 },
    })
    const qr = await qrcode.toDataURL(secret.otpauth_url!)
    res.json({ data: { secret: secret.base32, qrCode: qr } })
  } catch (e) { next(e) }
})

router.post('/2fa/verify', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const { token } = z.object({ token: z.string().length(6) }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user?.twoFactorSecret) throw new AppError('2FA not initialized', 400, 'NO_2FA_SECRET')
    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    })
    if (!ok) throw new AppError('Invalid token', 400, 'INVALID_TOKEN')
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    })
    res.json({ message: '2FA enabled' })
  } catch (e) { next(e) }
})

router.post('/2fa/disable', authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(1) }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new AppError('Invalid password', 400, 'INVALID_PASSWORD')
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    })
    res.json({ message: '2FA disabled' })
  } catch (e) { next(e) }
})

export default router
