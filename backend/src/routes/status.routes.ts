import { Router } from 'express'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

/**
 * Public status routes. No auth required — these power /status on the
 * customer site and any external monitoring integrations (Pingdom, etc.).
 */

const router = Router()

const SERVICES = ['API', 'Console', 'DNS', 'Provisioning', 'Network', 'Object Storage'] as const
const REGIONS = [
  'mumbai', 'delhi', 'singapore', 'tokyo', 'seoul', 'sydney',
  'frankfurt', 'london', 'paris', 'amsterdam',
  'new-york', 'chicago', 'los-angeles', 'sao-paulo', 'dubai',
] as const

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

const serializeIncident = (i: any) => ({
  ...i,
  affectedServices: safeJSON(i.affectedServices, []),
  affectedRegions: safeJSON(i.affectedRegions, []),
  updates: safeJSON(i.updates, []),
})

/** Map an open incident's impact to a service/region status. */
const STATUS_PRIORITY: Record<string, number> = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  major_outage: 3,
}

router.get('/summary', async (_req, res, next) => {
  try {
    const open = await prisma.statusIncident.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    const incidents = open.map(serializeIncident)

    // Compute per-service and per-region status from open incidents
    const serviceStatus: Record<string, string> = {}
    const regionStatus: Record<string, string> = {}
    for (const s of SERVICES) serviceStatus[s] = 'operational'
    for (const r of REGIONS) regionStatus[r] = 'operational'

    let overall = 'operational'

    for (const inc of incidents) {
      const impact = inc.impact === 'major' || inc.impact === 'critical' ? 'major_outage'
        : inc.impact === 'minor' ? 'degraded'
        : inc.impact === 'maintenance' ? 'maintenance'
        : 'degraded'

      for (const svc of inc.affectedServices) {
        if ((STATUS_PRIORITY[impact] ?? 0) > (STATUS_PRIORITY[serviceStatus[svc]] ?? 0)) {
          serviceStatus[svc] = impact
        }
      }
      for (const reg of inc.affectedRegions) {
        if ((STATUS_PRIORITY[impact] ?? 0) > (STATUS_PRIORITY[regionStatus[reg]] ?? 0)) {
          regionStatus[reg] = impact
        }
      }
      if ((STATUS_PRIORITY[impact] ?? 0) > (STATUS_PRIORITY[overall] ?? 0)) {
        overall = impact
      }
    }

    res.json({
      data: {
        overall,
        services: SERVICES.map((name) => ({ name, status: serviceStatus[name] })),
        regions: REGIONS.map((slug) => ({ slug, status: regionStatus[slug] })),
        incidents,
      },
    })
  } catch (e) { next(e) }
})

router.get('/incidents', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20', 10))
    const incidents = await prisma.statusIncident.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    res.json({ data: incidents.map(serializeIncident) })
  } catch (e) { next(e) }
})

router.get('/incidents/:id', async (req, res, next) => {
  try {
    const inc = await prisma.statusIncident.findUnique({ where: { id: req.params.id } })
    if (!inc) throw new AppError('Incident not found', 404, 'NOT_FOUND')
    res.json({ data: serializeIncident(inc) })
  } catch (e) { next(e) }
})

export default router
