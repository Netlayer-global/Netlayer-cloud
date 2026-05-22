import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/errors'

export interface AuthedRequest extends Request {
  user?: { userId: string; role: string }
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING']

export const authMiddleware = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'))
  }
  try {
    const payload = verifyAccessToken(header.split(' ')[1])
    req.user = payload
    next()
  } catch {
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
