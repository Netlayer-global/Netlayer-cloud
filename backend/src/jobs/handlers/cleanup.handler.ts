import prisma from '../../utils/prisma'
import logger from '../../utils/logger'

const subDays = (n: number) => new Date(Date.now() - n * 86_400_000)

export async function runCleanup(_data: { ts: number }) {
  try {
    const sessions = await prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    const metrics = await prisma.serverMetric.deleteMany({
      where: { timestamp: { lt: subDays(30) } },
    })
    const announcements = await prisma.announcement.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    })
    logger.info(
      {
        sessionsDeleted: sessions.count,
        metricsDeleted: metrics.count,
        announcementsDeactivated: announcements.count,
      },
      '✓ cleanup complete'
    )
  } catch (e: any) {
    logger.warn({ error: e.message }, 'cleanup failed')
  }
}
