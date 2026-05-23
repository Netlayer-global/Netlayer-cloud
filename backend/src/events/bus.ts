/**
 * NetLayer event bus.
 *
 * Single abstraction across NATS (real mode) and an in-process EventEmitter
 * (mock / dev mode). Every cross-service domain event flows through this.
 *
 * Subjects follow the convention <resource>.<verb> :
 *   server.created       — payload: { serverId, userId, regionId }
 *   server.running       — payload: { serverId, ipv4 }
 *   server.deleted       — payload: { serverId }
 *   payment.completed    — payload: { invoiceId, userId, amount }
 *   workflow.started     — payload: { workflowId, type, resourceId }
 *   workflow.completed   — payload: { workflowId, status }
 *   workflow.failed      — payload: { workflowId, error }
 *   ticket.sla_breach    — payload: { ticketId, priority }
 *
 * Real-mode requires `NATS_URL` (e.g. nats://localhost:4222). When absent we
 * silently fall back to the in-process bus — same API, no network hop.
 */

import { EventEmitter } from 'events'
import logger from '../utils/logger'

type Connection =
  | { kind: 'memory'; emitter: EventEmitter }
  | { kind: 'nats'; nc: any; jc: any }

let conn: Connection | null = null
let initPromise: Promise<Connection> | null = null

async function init(): Promise<Connection> {
  const url = process.env.NATS_URL
  if (!url) {
    logger.info('Event bus: in-process EventEmitter (no NATS_URL set)')
    return { kind: 'memory', emitter: new EventEmitter().setMaxListeners(50) }
  }
  try {
    // dynamic require so the package can be optional during type-check on systems
    // without it; we install it via npm in the same step we ship this file.
    const dynamicRequire = new Function('m', 'return require(m)') as (m: string) => any
    const natsLib: any = dynamicRequire('nats')
    const { connect, JSONCodec } = natsLib
    const nc = await connect({ servers: url, name: 'netlayer-api', reconnect: true, maxReconnectAttempts: -1 })
    const jc = JSONCodec()
    logger.info({ url }, 'Event bus: connected to NATS')
    nc.closed().then((err: any) => {
      if (err) logger.error({ err: err.message }, 'NATS connection closed with error')
    })
    return { kind: 'nats', nc, jc }
  } catch (e: any) {
    logger.warn({ err: e.message }, 'NATS connect failed — falling back to in-process bus')
    return { kind: 'memory', emitter: new EventEmitter().setMaxListeners(50) }
  }
}

async function ensure(): Promise<Connection> {
  if (conn) return conn
  if (!initPromise) initPromise = init().then((c) => { conn = c; return c })
  return initPromise
}

/**
 * Publish a domain event. Returns a promise but most callers fire-and-forget.
 * Errors are logged, never thrown — events are best-effort by design.
 */
export async function publish(subject: string, payload: any): Promise<void> {
  try {
    const c = await ensure()
    if (c.kind === 'nats') {
      c.nc.publish(subject, c.jc.encode(payload))
    } else {
      c.emitter.emit(subject, payload)
    }
  } catch (e: any) {
    logger.warn({ err: e.message, subject }, 'event publish failed')
  }
}

/**
 * Subscribe to a subject. Returns an unsubscribe handle. Wildcards (`*`, `>`)
 * are supported in NATS mode; in memory mode we exact-match the subject only.
 */
export async function subscribe(subject: string, handler: (payload: any) => void | Promise<void>): Promise<() => void> {
  const c = await ensure()
  if (c.kind === 'nats') {
    const sub = c.nc.subscribe(subject)
    ;(async () => {
      for await (const m of sub) {
        try {
          await handler(c.jc.decode(m.data))
        } catch (e: any) {
          logger.error({ err: e.message, subject }, 'event handler threw')
        }
      }
    })()
    return () => sub.unsubscribe()
  }
  c.emitter.on(subject, handler)
  return () => c.emitter.off(subject, handler)
}

export async function close(): Promise<void> {
  if (!conn) return
  if (conn.kind === 'nats') {
    await conn.nc.drain().catch(() => {})
  }
  conn = null
  initPromise = null
}

// Strongly-typed subject helpers — the canonical list lives here so refactors
// surface every call site at compile time.
export const EVENTS = {
  SERVER_CREATED:   'server.created',
  SERVER_RUNNING:   'server.running',
  SERVER_DELETED:   'server.deleted',
  PAYMENT_COMPLETED: 'payment.completed',
  WORKFLOW_STARTED:  'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED:   'workflow.failed',
  TICKET_SLA_BREACH: 'ticket.sla_breach',
} as const
