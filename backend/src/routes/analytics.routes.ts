import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const router = Router()

/**
 * Round 24 — Admin analytics + revenue dashboards.
 *
 * Reads from RevenueSnapshot (daily aggregations) plus live queries.
 * MRR is computed by summing `priceMonthly` across active servers.
 * ARR = MRR × 12. Churn = customers who paid last month but not this.
 */

router.get('/revenue', async (req, res, next) => {
  try {
    const q = z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(req.query)

    const where: any = {}
    if (q.from) where.date = { ...(where.date || {}), gte: new Date(q.from) }
    if (q.to) where.date = { ...(where.date || {}), lte: new Date(q.to) }

    const snapshots = await prisma.revenueSnapshot.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 365,
    })

    // Live MRR — sum of active servers' priceMonthly
    const activeServers = await prisma.server.findMany({
      where: { status: { notIn: ['DELETED', 'AWAITING_PAYMENT'] }, deletedAt: null },
      include: { plan: true },
    })
    const liveMrr = activeServers.reduce((sum, s) => sum + (s.plan?.priceMonthly || 0), 0)
    const liveArr = liveMrr * 12

    // Today's invoices total
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayInvoices = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'PAID', paidAt: { gte: startOfDay } },
    })

    res.json({
      data: {
        liveMrr,
        liveArr,
        todayRevenue: todayInvoices._sum.total ?? 0,
        snapshots,
      },
    })
  } catch (e) { next(e) }
})

router.get('/customers', async (_req, res, next) => {
  try {
    const total = await prisma.user.count({ where: { role: 'USER' } })
    const active = await prisma.user.count({
      where: { role: 'USER', status: 'ACTIVE' },
    })
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const newThisMonth = await prisma.user.count({
      where: { role: 'USER', createdAt: { gte: startOfMonth } },
    })

    const startOfPrevMonth = new Date(startOfMonth)
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1)

    // Churn = users whose last activity was 30+ days ago and have no
    // active server. For SQLite this is OK at our scale.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)
    const stale = await prisma.user.findMany({
      where: {
        role: 'USER',
        lastLoginAt: { lt: thirtyDaysAgo },
        servers: { none: { deletedAt: null, status: { notIn: ['DELETED'] } } },
      },
      select: { id: true },
    })

    res.json({
      data: {
        total,
        active,
        newThisMonth,
        churned30d: stale.length,
        churnRatePct: total ? Number(((stale.length / total) * 100).toFixed(2)) : 0,
      },
    })
  } catch (e) { next(e) }
})

router.get('/cohorts', async (_req, res, next) => {
  try {
    // Group customers by signup month, count how many still have a server
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        createdAt: true,
        servers: { select: { id: true, deletedAt: true, status: true } },
      },
    })

    const cohorts: Record<string, { signups: number; retained: number }> = {}
    for (const u of users) {
      const key = `${u.createdAt.getUTCFullYear()}-${String(u.createdAt.getUTCMonth() + 1).padStart(2, '0')}`
      cohorts[key] = cohorts[key] || { signups: 0, retained: 0 }
      cohorts[key].signups += 1
      const hasActive = u.servers.some((s) => !s.deletedAt && s.status !== 'DELETED')
      if (hasActive) cohorts[key].retained += 1
    }

    const sorted = Object.entries(cohorts)
      .map(([month, c]) => ({
        month,
        ...c,
        retentionPct: c.signups ? Number(((c.retained / c.signups) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    res.json({ data: sorted })
  } catch (e) { next(e) }
})

router.get('/profitability', async (_req, res, next) => {
  try {
    // Per-region profitability — revenue from servers in region minus
    // an estimated cost-per-server (configurable env var; defaults to ₹120/mo).
    const costPerServer = Number(process.env.COST_PER_SERVER_INR || 120)

    const grouped = await prisma.server.groupBy({
      by: ['regionId'],
      where: { deletedAt: null, status: { notIn: ['DELETED', 'AWAITING_PAYMENT'] } },
      _count: true,
    })

    const result: any[] = []
    for (const g of grouped) {
      const region = await prisma.region.findUnique({ where: { id: g.regionId } })
      const servers = await prisma.server.findMany({
        where: { regionId: g.regionId, deletedAt: null, status: { notIn: ['DELETED'] } },
        include: { plan: true },
      })
      const monthlyRevenue = servers.reduce((s, sv) => s + (sv.plan?.priceMonthly || 0), 0)
      const monthlyCost = servers.length * costPerServer
      result.push({
        regionId: g.regionId,
        region: region ? `${region.flag} ${region.city}` : g.regionId,
        servers: g._count,
        monthlyRevenue,
        monthlyCost,
        monthlyMargin: monthlyRevenue - monthlyCost,
        marginPct: monthlyRevenue ? Number((((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100).toFixed(1)) : 0,
      })
    }
    res.json({ data: result.sort((a, b) => b.monthlyMargin - a.monthlyMargin) })
  } catch (e) { next(e) }
})

export default router
