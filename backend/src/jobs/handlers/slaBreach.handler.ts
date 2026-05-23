import prisma from '../../utils/prisma'
import logger from '../../utils/logger'
import { emitToAdmin } from '../../services/socket.service'
import { slaTargetFor } from '../../services/sla.service'
import * as eventBus from '../../events/bus'
import { EVENTS } from '../../events/bus'

/**
 * SLA breach handler — runs every 5 minutes.
 *
 * Walks all open tickets and flips `slaBreached=true` on any that have
 * passed their target without a first reply. Emits an admin notification
 * + creates an audit log row exactly once per ticket so dashboards can
 * surface the breach.
 */
export async function runSlaBreach(_data: { ts: number }): Promise<void> {
  const now = new Date()

  // Find tickets that:
  //   - aren't yet marked breached
  //   - haven't had a first reply yet
  //   - are in an open-ish state
  const candidates = await prisma.supportTicket.findMany({
    where: {
      slaBreached: false,
      firstReplyAt: null,
      status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING'] },
    },
    select: {
      id: true, subject: true, priority: true, createdAt: true, slaTargetAt: true, userId: true,
    },
  })

  let breached = 0
  for (const t of candidates) {
    const target = t.slaTargetAt ?? slaTargetFor(t.priority, t.createdAt)
    if (target.getTime() > now.getTime()) continue

    try {
      await prisma.$transaction([
        prisma.supportTicket.update({
          where: { id: t.id },
          data: { slaBreached: true },
        }),
        prisma.auditLog.create({
          data: {
            userId: t.userId,
            action: 'ticket.sla_breached',
            resource: 'ticket',
            resourceId: t.id,
            metadata: JSON.stringify({
              priority: t.priority,
              targetAt: target.toISOString(),
              breachedAt: now.toISOString(),
            }),
          },
        }),
      ])

      emitToAdmin('admin:ticket_sla_breach', {
        ticketId: t.id,
        subject: t.subject,
        priority: t.priority,
        targetAt: target.toISOString(),
      })

      void eventBus.publish(EVENTS.TICKET_SLA_BREACH, {
        ticketId: t.id, priority: t.priority, targetAt: target.toISOString(),
      })

      breached++
    } catch (err: any) {
      logger.error({ err: err.message, ticketId: t.id }, 'failed to mark SLA breach')
    }
  }

  if (breached > 0) {
    logger.info(`SLA breach sweep: ${breached} ticket(s) marked breached`)
  }
}
