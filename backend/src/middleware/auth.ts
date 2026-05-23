import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/errors'
import prisma from '../utils/prisma'

export interface AuthedRequest extends Request {
  user?: { userId: string; role: string }
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING']

const isApiKey = (token: string) => token.startsWith('nl_') || token.startsWith('nlt_')

/**
 * Resolve a long-lived API key by looking up its sha256 hash. Returns the
 * owner's userId + role and best-effort updates lastUsedAt for usage stats.
 */
async function resolveApiKey(token: string): Promise<{ userId: string; role: string }> {
  const keyHash = crypto.createHash('sha256').update(token).digest('hex')
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, role: true, status: true } } },
  })
  if (!apiKey || !apiKey.isActive) {
    throw new AppError('Invalid API key', 401, 'INVALID_API_KEY')
  }
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw new AppError('API key expired', 401, 'API_KEY_EXPIRED')
  }
  if (!apiKey.user || apiKey.user.status !== 'ACTIVE') {
    throw new AppError('Account not active', 403, 'ACCOUNT_INACTIVE')
  }

  // Update lastUsedAt asynchronously — don't block the request.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return { userId: apiKey.user.id, role: apiKey.user.role }
}

export const authMiddleware = async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'))
  }
  const token = header.split(' ')[1]
  try {
    if (isApiKey(token)) {
      req.user = await resolveApiKey(token)
    } else {
      req.user = verifyAccessToken(token)
    }
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(new AppError('Invalid token', 401, 'INVALID_TOKEN'))
  }
}

/** Allow any of the admin-tier roles. */
export const adminOnly = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'))
  }
  next()
}

/** Strict super-admin gate. */
export const superAdminOnly = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return next(new AppError('Forbidden — Super Admin only', 403, 'FORBIDDEN'))
  }
  next()
}

/** Require a specific role from a list. */
export const requireRole = (...roles: string[]) => {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'))
    }
    next()
  }
}
