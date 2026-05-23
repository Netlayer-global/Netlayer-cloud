/**
 * SLA targets per ticket priority. Targets are the moment by which an
 * agent must reply / resolve. The `firstReplyAt` is what kills the SLA
 * timer once an agent responds; `slaBreached` flips to true when we pass
 * the target without a reply.
 */
export const SLA_HOURS: Record<string, number> = {
  CRITICAL: 1,
  URGENT: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 48,
}

export const slaTargetFor = (priority: string, from = new Date()): Date => {
  const hours = SLA_HOURS[priority?.toUpperCase()] ?? SLA_HOURS.MEDIUM
  return new Date(from.getTime() + hours * 3600_000)
}

export const slaState = (ticket: {
  status: string
  priority: string
  firstReplyAt: Date | null
  slaTargetAt?: Date | null
  slaBreached: boolean
  createdAt: Date
}) => {
  if (ticket.firstReplyAt) {
    return { state: 'met' as const, msRemaining: 0, breached: ticket.slaBreached }
  }
  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    return { state: 'resolved' as const, msRemaining: 0, breached: ticket.slaBreached }
  }
  const target = ticket.slaTargetAt ?? slaTargetFor(ticket.priority, ticket.createdAt)
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return { state: 'breached' as const, msRemaining: 0, breached: true }
  if (ms < 30 * 60_000) return { state: 'critical' as const, msRemaining: ms, breached: false }
  if (ms < 2 * 3600_000) return { state: 'warning' as const, msRemaining: ms, breached: false }
  return { state: 'ok' as const, msRemaining: ms, breached: false }
}
