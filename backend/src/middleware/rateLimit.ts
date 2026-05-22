import rateLimit from 'express-rate-limit'

const isDev = process.env.NODE_ENV !== 'production'

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 3,
  message: { error: 'Too many registration attempts', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 5,
  message: { error: 'Too many login attempts', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 3,
  message: { error: 'Too many password reset attempts', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
})
