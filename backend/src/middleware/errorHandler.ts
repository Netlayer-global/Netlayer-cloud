import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'
import { ZodError } from 'zod'

export default (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, { stack: err.stack, path: req.path })

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Already exists', code: 'CONFLICT' })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' })
  }

  return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
}
