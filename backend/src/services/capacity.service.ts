import prisma from '../utils/prisma'

/**
 * CapacityService — admin-facing planning view.
 *
 * For each region the report computes:
 *   - aggregated CPU/RAM/Disk usage across all active nodes
 *   - VM utilisation (currentVMs / maxVMs)
 *   - 7-day deploy growth rate vs the previous 7 days
 *   - days-until-full projection based on trailing growth
 *
 * Mock-mode-friendly: when there's no traffic yet (everything zero) the
 * function still returns sane data so the admin UI looks alive in dev.
 */

export interface RegionCapacity {
  regionId: string
  regionSlug: string
  regionName: string
  flag: string
  countryCode: string
  totalCpu: number
  usedCpu: number
  totalRamGB: number
  usedRamGB: number
  totalDiskGB: number
  usedDiskGB: number
  maxVMs: number
  currentVMs: number
  cpuPercent: number
  ramPercent: number
  diskPercent: number
  vmPercent: number
  deploysLast7d: number
  deploysPrev7d: number
  growthPerDay: number
  daysUntilFull: number | null
  status: 'healthy' | 'warning' | 'critical'
  recommendation: string | null
}

export interface CapacityReport {
  generatedAt: string
  totalRegions: number
  totalNodes: number
  totalCpu: number
  usedCpu: number
  totalRamGB: number
  usedRamGB: number
  totalVMs: number
  currentVMs: number
  averageUtilization: number
  regions: RegionCapacity[]
}

const safeDiv = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 1000) / 10) : 0)

export class CapacityService {
  async getCapacityReport(): Promise<CapacityReport> {
    const regions = await prisma.region.findMany({
      include: { nodes: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    })

    // 7-day deploy windows for growth-rate calculation
    const now = new Date()
    const d7  = new Date(now.getTime() - 7 * 86_400_000)
    const d14 = new Date(now.getTime() - 14 * 86_400_000)

    const [last7d, prev7d] = await Promise.all([
      prisma.server.groupBy({
        by: ['regionId'],
        where: { createdAt: { gte: d7, lte: now }, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.server.groupBy({
        by: ['regionId'],
        where: { createdAt: { gte: d14, lte: d7 }, deletedAt: null },
        _count: { _all: true },
      }),
    ])

    const last7Map = new Map(last7d.map((r) => [r.regionId, r._count._all]))
    const prev7Map = new Map(prev7d.map((r) => [r.regionId, r._count._all]))

    const regionRows: RegionCapacity[] = regions.map((region) => {
      const totals = region.nodes.reduce(
        (acc, n) => {
          acc.totalCpu += n.totalCpu
          acc.usedCpu += n.usedCpu
          acc.totalRamGB += n.totalRamGB
          acc.usedRamGB += n.usedRamGB
          acc.totalDiskGB += n.totalDiskGB
          acc.usedDiskGB += n.usedDiskGB
          acc.maxVMs += n.maxVMs
          acc.currentVMs += n.currentVMs
          return acc
        },
        { totalCpu: 0, usedCpu: 0, totalRamGB: 0, usedRamGB: 0, totalDiskGB: 0, usedDiskGB: 0, maxVMs: 0, currentVMs: 0 }
      )

      const cpuPercent  = safeDiv(totals.usedCpu, totals.totalCpu)
      const ramPercent  = safeDiv(totals.usedRamGB, totals.totalRamGB)
      const diskPercent = safeDiv(totals.usedDiskGB, totals.totalDiskGB)
      const vmPercent   = safeDiv(totals.currentVMs, totals.maxVMs)

      const deploys7  = last7Map.get(region.id) || 0
      const deploysP7 = prev7Map.get(region.id) || 0
      const growthPerDay = deploys7 / 7

      const remaining = totals.maxVMs - totals.currentVMs
      const daysUntilFull =
        growthPerDay > 0 && remaining > 0
          ? Math.floor(remaining / growthPerDay)
          : null

      const peak = Math.max(cpuPercent, ramPercent, diskPercent, vmPercent)
      const status: 'healthy' | 'warning' | 'critical' =
        peak >= 85 ? 'critical' : peak >= 70 ? 'warning' : 'healthy'

      const recommendation =
        status === 'critical'
          ? `Add a node to ${region.city} immediately — saturation imminent`
          : status === 'warning'
          ? `Plan to add capacity in ${region.city} within ${daysUntilFull ?? 14} days`
          : null

      return {
        regionId: region.id,
        regionSlug: region.slug,
        regionName: region.name,
        flag: region.flag,
        countryCode: region.countryCode,
        ...totals,
        cpuPercent,
        ramPercent,
        diskPercent,
        vmPercent,
        deploysLast7d: deploys7,
        deploysPrev7d: deploysP7,
        growthPerDay: Math.round(growthPerDay * 100) / 100,
        daysUntilFull,
        status,
        recommendation,
      }
    })

    const totals = regionRows.reduce(
      (acc, r) => {
        acc.totalCpu += r.totalCpu
        acc.usedCpu += r.usedCpu
        acc.totalRamGB += r.totalRamGB
        acc.usedRamGB += r.usedRamGB
        acc.totalVMs += r.maxVMs
        acc.currentVMs += r.currentVMs
        return acc
      },
      { totalCpu: 0, usedCpu: 0, totalRamGB: 0, usedRamGB: 0, totalVMs: 0, currentVMs: 0 }
    )
    const averageUtilization =
      regionRows.length > 0
        ? Math.round(
            regionRows.reduce((s, r) => s + Math.max(r.cpuPercent, r.ramPercent, r.vmPercent), 0) /
              regionRows.length
          )
        : 0

    return {
      generatedAt: new Date().toISOString(),
      totalRegions: regionRows.length,
      totalNodes: regions.reduce((s, r) => s + r.nodes.length, 0),
      ...totals,
      averageUtilization,
      regions: regionRows,
    }
  }

  async getQuickSummary(): Promise<{
    totalNodes: number
    totalVMs: number
    currentVMs: number
    overallUtilization: number
    regionsCritical: number
    regionsWarning: number
  }> {
    const report = await this.getCapacityReport()
    return {
      totalNodes: report.totalNodes,
      totalVMs: report.totalVMs,
      currentVMs: report.currentVMs,
      overallUtilization: report.averageUtilization,
      regionsCritical: report.regions.filter((r) => r.status === 'critical').length,
      regionsWarning: report.regions.filter((r) => r.status === 'warning').length,
    }
  }
}

export default new CapacityService()
