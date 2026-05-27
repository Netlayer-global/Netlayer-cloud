import prisma from '../../utils/prisma'
import logger from '../../utils/logger'

/**
 * Round 24 — Backup schedule runner.
 *
 * Runs every 30 minutes. Picks any active schedule whose nextRunAt has
 * passed and creates a snapshot via the existing snapshots flow. Then
 * trims old snapshots beyond retentionDays.
 */
export async function runBackupRunner() {
  const now = new Date()
  const due = await prisma.backupSchedule.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    take: 100,
  })
  if (due.length === 0) return

  for (const sched of due) {
    try {
      // Skip if the server has been deleted
      const server = await prisma.server.findUnique({
        where: { id: sched.serverId },
      })
      if (!server || server.deletedAt) {
        await prisma.backupSchedule.update({
          where: { id: sched.id },
          data: { isActive: false },
        })
        continue
      }

      // Create a snapshot. In mock mode this is a DB row; real mode
      // would call ProxmoxService.createSnapshot.
      await prisma.serverSnapshot.create({
        data: {
          serverId: server.id,
          name: `auto-${sched.frequency}-${now.toISOString().split('T')[0]}`,
          status: 'available',
          size: 0,
        },
      })

      // Trim snapshots older than retentionDays
      const cutoff = new Date(now.getTime() - sched.retentionDays * 86_400_000)
      const deletedRes = await prisma.serverSnapshot.deleteMany({
        where: {
          serverId: server.id,
          name: { startsWith: 'auto-' },
          createdAt: { lt: cutoff },
        },
      })

      // Compute next run
      const nextRunAt = (() => {
        const next = new Date(sched.nextRunAt)
        if (sched.frequency === 'daily') next.setUTCDate(next.getUTCDate() + 1)
        else if (sched.frequency === 'weekly') next.setUTCDate(next.getUTCDate() + 7)
        else next.setUTCMonth(next.getUTCMonth() + 1)
        return next
      })()

      await prisma.backupSchedule.update({
        where: { id: sched.id },
        data: { lastRunAt: now, nextRunAt },
      })

      logger.info(
        { scheduleId: sched.id, serverId: server.id, retentionTrimmed: deletedRes.count },
        'auto-backup completed'
      )
    } catch (err: any) {
      logger.error({ err: err.message, scheduleId: sched.id }, 'backup runner failed')
    }
  }
}
