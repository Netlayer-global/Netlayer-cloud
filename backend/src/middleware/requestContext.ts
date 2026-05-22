import { Request, Response, NextFunction } from 'express'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import logger from '../utils/logger'

/**
 * Per-request structured logging with a request ID.
 * The ID is taken from `x-request-id` header if present, otherwise generated.
 * Echoed back to the client so support can correlate.
 */
export const requestContext = pinoHttp({
  // Use the underlying pino instance, not the compatibility wrapper
  logger: logger.raw,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id']
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID()
    res.setHeader('x-request-id', id)
    return id
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} ${err.message}`,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
})

/** Express helper that attaches the request id to res.locals for handler use. */
export const attachRequestId = (req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = (req as any).id
  next()
}
