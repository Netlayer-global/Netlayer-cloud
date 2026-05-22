import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_SECRET || 'change-me-access'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh'

export const generateAccessToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: '15m' })

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as { userId: string; role: string }

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as { userId: string }
