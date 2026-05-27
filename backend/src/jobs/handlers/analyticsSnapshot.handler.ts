import prisma from '../../utils/prisma'
import logger from '../../utils/logger'

/**
 * Round 24 — Daily revenue snapshot.
 *
 * Runs at 00:30 UTC. Aggregates the previous day's totals into a
 * single RevenueSnapshot row that the admin analytics dashboard reads
 * back. Idempotent — if a snapshot for the date already exists we
 * upsert.
 */
export async function runAnalyticsSnapshot() {
  const now = new Date()
  const startOfYesterday = new Date(now)
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1)
  startOfYesterday.setUTCHours(0, 0, 0, 0)
  const endOfYesterday = new Date(startOfYesterday.getTime() + 86_400_000)

  const where = { paidAt: { gte: startOfYesterday, lt: endOfYesterday } }
  const [revenueAgg, refundAgg] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, where: { ...where, status: 'PAID' } }),
    prisma.creditNote.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfYesterday, lt: endOfYesterday } },
    }),
  ])
  const totalRevenue = revenueAgg._sum.total ?? 0
  const totalRefunds = refundAgg._sum.total ?? 0
  const netRevenue = totalRevenue - totalRefunds

  const newCustomers = await prisma.user.count({
    where: { role: 'USER', createdAt: { gte: startOfYesterday, lt: endOfYesterday } },
  })

  const activeCustomers = await prisma.user.count({
    where: { role: 'USER', status: 'ACTIVE' },
  })

  const activeServers = await prisma.server.findMany({
    where: { status: { notIn: ['DELETED', 'AWAITING_PAYMENT'] }, deletedAt: null },
    include: { plan: true },
  })
  const mrr = activeServers.reduce((s, sv) => s + (sv.plan?.priceMonthly || 0), 0)

  const serversNew = await prisma.server.count({
    where: { createdAt: { gte: startOfYesterday, lt: endOfYesterday } },
  })
  const serversTerminated = await prisma.server.count({
    where: { deletedAt: { gte: startOfYesterday, lt: endOfYesterday } },
  })

  // Churned: customers who had an active server yesterday but none today
  const churnedAgg = await prisma.user.findMany({
    where: {
      role: 'USER',
      servers: {
        some: { deletedAt: { gte: startOfYesterday, lt: endOfYesterday } },
        none: { deletedAt: null, status: { notIn: ['DELETED'] } },
      },
    },
    select: { id: true },
  })

  await prisma.revenueSnapshot.upsert({
    where: { date: startOfYesterday },
    create: {
      date: startOfYesterday,
      totalRevenue,
      totalRefunds,
      netRevenue,
      newCustomers,
      activeCustomers,
      churnedCustomers: churnedAgg.length,
      mrr,
      arr: mrr * 12,
      serversActive: activeServers.length,
      serversNew,
      serversTerminated,
    },
    update: {
      totalRevenue,
      totalRefunds,
      netRevenue,
      newCustomers,
      activeCustomers,
      churnedCustomers: churnedAgg.length,
      mrr,
      arr: mrr * 12,
      serversActive: activeServers.length,
      serversNew,
      serversTerminated,
    },
  })

  logger.info(
    {
      date: startOfYesterday.toISOString().split('T')[0],
      mrr,
      newCustomers,
      churnedCustomers: churnedAgg.length,
    },
    'analytics snapshot saved'
  )
}
