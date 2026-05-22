import pino from 'pino'
import { config } from '../config/env'

/**
 * Pino-based structured logger with a small compatibility shim so legacy
 * call sites that used `logger.warn('msg', { error: ... })` still work.
 *
 * Native pino: logger.warn({ err }, 'msg')
 * Legacy:      logger.warn('msg', { error: '...' })
 * Both supported.
 */

const transport = config.logPretty && !config.isProd
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }
  : undefined

const base = pino({
  level: config.LOG_LEVEL,
  base: { service: 'netlayer-api', env: config.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.passwordHash',
      '*.password',
      '*.rootPassword',
      '*.apiKey',
      '*.keySecret',
      '*.authToken',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  transport,
})

type LogArgs =
  | [msg: string]
  | [obj: object, msg?: string]
  | [msg: string, obj: object]

const dispatch = (level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace') =>
  (...args: unknown[]) => {
    if (args.length === 0) return
    const a = args[0]
    const b = args[1]
    if (typeof a === 'string' && b && typeof b === 'object') {
      base[level](b as object, a)
    } else if (typeof a === 'object' && a !== null) {
      base[level](a as object, typeof b === 'string' ? b : undefined)
    } else {
      base[level](String(a))
    }
  }

const logger = {
  fatal: dispatch('fatal'),
  error: dispatch('error'),
  warn:  dispatch('warn'),
  info:  dispatch('info'),
  debug: dispatch('debug'),
  trace: dispatch('trace'),
  child: (bindings: object) => base.child(bindings),
  raw: base,
}

export default logger
