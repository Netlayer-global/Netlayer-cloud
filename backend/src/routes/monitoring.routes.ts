import { Router } from 'express'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'
import grafanaService from '../services/grafana.service'

const router = Router()

/**
 * Account-wide monitoring overview. Aggregates metrics across every server
 * the user owns. Heavy work is delegated to grafanaService when available;
 * otherwise we synthesize a realistic mock series.
 */

const RANGES: Record<string, { ms: number; resolutionMs: number }> = {
  '1h':  { ms: 3600_000,        resolutionMs: 60_000 },
  '6h':  { ms: 6 * 3600_000,    resolutionMs: 5 * 60_000 },
  '24h': { ms: 24 * 3600_000,   resolutionMs: 15 * 60_000 },
  '7d':  { ms: 7 * 86_400_000,  resolutionMs: 60 * 60_000 },
  '30d': { ms: 30 * 86_400_000, resolutionMs: 4 * 60 * 60_000 },
}

router.get('/overview', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.userId

    const [servers, volumes, dbs, lbs] = await Promise.all([
      prisma.server.findMany({
        where: { userId, deletedAt: null },
        include: { region: true, plan: true },
      }),
      prisma.blockVolume.count({ where: { userId } }),
      prisma.managedDatabase.count({ where: { userId } }),
      prisma.loadBalancer.count({ where: { userId } }),
    ])

    const byStatus = servers.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {})

    const byRegion = servers.reduce<Record<string, { city: string; flag: string; count: number }>>(
      (acc, s) => {
        const k = s.region.slug
        if (!acc[k]) acc[k] = { city: s.region.city, flag: s.region.flag, count: 0 }
        acc[k].count += 1
        return acc
      },
      {}
    )

    res.json({
      data: {
        totals: {
          servers: servers.length,
          running: byStatus.RUNNING || 0,
          stopped: byStatus.STOPPED || 0,
          building: (byStatus.BUILDING || 0) + (byStatus.PENDING || 0),
          error: byStatus.ERROR || 0,
          volumes,
          databases: dbs,
          loadBalancers: lbs,
        },
        byStatus,
        byRegion: Object.entries(byRegion).map(([slug, v]) => ({ slug, ...v })),
      },
    })
  } catch (e) { next(e) }
})

router.get('/aggregate', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const range = (req.query.range as string) || '24h'
    const cfg = RANGES[range] ?? RANGES['24h']

    const servers = await prisma.server.findMany({
      where: { userId, deletedAt: null, status: { in: ['RUNNING', 'STOPPED'] } },
      select: { id: true, ipv4: true, hostname: true },
    })

    if (servers.length === 0) {
      return res.json({ data: { points: [], serverCount: 0, range } })
    }

    const all = await Promise.all(
      servers.map(async (s) => {
        try {
          return await grafanaService.getServerMetrics(s.ipv4 || s.hostname, range)
        } catch {
          return null
        }
      })
    )

    const series = all.filter((m): m is NonNullable<typeof m> => !!m)

    // Bucket all servers' samples into a uniform time grid; values are AVG cpu/ram and SUM net.
    const now = Date.now()
    const start = now - cfg.ms
    const numBuckets = Math.floor(cfg.ms / cfg.resolutionMs)
    const buckets: { t: number; cpu: number[]; ram: number[]; netIn: number[]; netOut: number[] }[] = []
    for (let i = 0; i < numBuckets; i++) {
      buckets.push({
        t: start + i * cfg.resolutionMs,
        cpu: [], ram: [], netIn: [], netOut: [],
      })
    }
    const placeIntoBucket = (arr: { t: number; v: number }[] | undefined, key: 'cpu' | 'ram' | 'netIn' | 'netOut') => {
      if (!arr) return
      for (const p of arr) {
        const ts = typeof p.t === 'number' ? (p.t > 1e12 ? p.t : p.t * 1000) : 0
        if (ts < start || ts > now) continue
        const idx = Math.min(numBuckets - 1, Math.floor((ts - start) / cfg.resolutionMs))
        buckets[idx][key].push(p.v)
      }
    }
    for (const m of series) {
      placeIntoBucket(m.cpu as any, 'cpu')
      placeIntoBucket(m.ram as any, 'ram')
      placeIntoBucket(m.networkIn as any, 'netIn')
      placeIntoBucket(m.networkOut as any, 'netOut')
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const points = buckets.map((b) => ({
      t: b.t,
      cpu: Number(avg(b.cpu).toFixed(2)),
      ram: Number(avg(b.ram).toFixed(2)),
      netIn: Number(sum(b.netIn).toFixed(2)),
      netOut: Number(sum(b.netOut).toFixed(2)),
    }))

    res.json({ data: { points, serverCount: servers.length, range } })
  } catch (e) { next(e) }
})

export default router
