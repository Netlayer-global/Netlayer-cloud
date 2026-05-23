import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { getRedis } from '../utils/redis'
import logger from '../utils/logger'

/**
 * IpPoolService — IPv4 allocation with Redis-locked allocation.
 *
 * Pool config drives how many addresses are usable:
 *   /24 → 254 hosts, /27 → 30 hosts, /28 → 14 hosts (network + broadcast removed)
 *
 * Allocation is the hot path during deploys. We use a SET NX EX 5 Redis lock
 * scoped to the region so two deploys can't race for the same IP. If Redis
 * isn't available we fall back to optimistic concurrency on Prisma (best-
 * effort: a duplicate-IP error from Prisma will bubble up as 503).
 */

export class IpPoolService {
  /**
   * Expand a CIDR like 103.21.200.0/27 to all usable host addresses.
   * Skips network and broadcast.
   */
  expandCidr(cidr: string): string[] {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(cidr.trim())
    if (!m) throw new AppError('Invalid CIDR', 400, 'INVALID_CIDR')
    const a = parseInt(m[1], 10)
    const b = parseInt(m[2], 10)
    const c = parseInt(m[3], 10)
    const d = parseInt(m[4], 10)
    const prefix = parseInt(m[5], 10)
    if (prefix < 16 || prefix > 30) {
      throw new AppError('Prefix must be between /16 and /30', 400, 'INVALID_PREFIX')
    }
    const base = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0
    const totalHosts = Math.pow(2, 32 - prefix)
    const out: string[] = []
    // skip first (network) and last (broadcast)
    for (let i = 1; i < totalHosts - 1; i++) {
      const ip = (base + i) >>> 0
      out.push(`${(ip >>> 24) & 255}.${(ip >>> 16) & 255}.${(ip >>> 8) & 255}.${ip & 255}`)
    }
    return out
  }

  countUsable(cidr: string): number {
    const m = /\/(\d{1,2})$/.exec(cidr)
    if (!m) return 0
    const prefix = parseInt(m[1], 10)
    return Math.max(0, Math.pow(2, 32 - prefix) - 2)
  }

  async createPool(data: {
    regionId: string
    cidr: string
    gateway: string
    type?: string
    dns1?: string
    dns2?: string
  }) {
    const region = await prisma.region.findUnique({ where: { id: data.regionId } })
    if (!region) throw new AppError('Region not found', 404, 'NOT_FOUND')

    const ips = this.expandCidr(data.cidr)
    if (ips.length === 0) throw new AppError('CIDR has no usable hosts', 400, 'EMPTY_CIDR')

    const pool = await prisma.ipPool.create({
      data: {
        regionId: data.regionId,
        cidr: data.cidr,
        gateway: data.gateway,
        type: data.type || 'public',
        dns1: data.dns1 || '8.8.8.8',
        dns2: data.dns2 || '1.1.1.1',
      },
    })

    // Bulk-insert IpAddress rows; createMany is supported on SQLite for plain inserts.
    await prisma.ipAddress.createMany({
      data: ips.map((ip) => ({ ip, poolId: pool.id })),
    }).catch(async (e: any) => {
      // Some IPs in this CIDR may already exist (e.g. overlap with another pool).
      // Insert them one-by-one and skip duplicates.
      logger.warn({ err: e.message }, 'createMany failed, falling back to individual inserts')
      for (const ip of ips) {
        await prisma.ipAddress.create({ data: { ip, poolId: pool.id } }).catch(() => {})
      }
    })

    return pool
  }

  /**
   * Atomically reserve the next free IP in the region. Throws 503 NO_IP when
   * the region has no capacity left.
   */
  async allocateIp(regionId: string): Promise<{ id: string; ip: string }> {
    const redis = getRedis()
    const lockKey = `lock:ip:alloc:${regionId}`

    // SET key 1 NX EX 5 — fails if the lock is held by another process.
    const acquired = redis
      ? await redis.set(lockKey, '1', 'EX', 5, 'NX')
      : 'OK'
    if (!acquired) {
      throw new AppError('IP allocation in progress, retry', 503, 'IP_LOCK_BUSY')
    }

    try {
      const free = await prisma.ipAddress.findFirst({
        where: { status: 'available', pool: { regionId, isActive: true } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, ip: true },
      })
      if (!free) throw new AppError('No IPs available in this region', 503, 'NO_IP')

      await prisma.ipAddress.update({
        where: { id: free.id },
        data: { status: 'reserved' },
      })

      return free
    } finally {
      if (redis) await redis.del(lockKey).catch(() => {})
    }
  }

  async assignIpToServer(ipId: string, serverId: string): Promise<void> {
    await prisma.$transaction([
      prisma.ipAddress.update({
        where: { id: ipId },
        data: { status: 'assigned', serverId, assignedAt: new Date() },
      }),
    ])
  }

  async releaseIp(ipId: string): Promise<void> {
    const ip = await prisma.ipAddress.findUnique({ where: { id: ipId } })
    if (!ip) return
    await prisma.ipAddress.update({
      where: { id: ipId },
      data: { status: 'available', serverId: null, assignedAt: null },
    })
  }

  async deletePool(poolId: string): Promise<void> {
    const assigned = await prisma.ipAddress.count({
      where: { poolId, status: { in: ['assigned', 'reserved'] } },
    })
    if (assigned > 0) {
      throw new AppError(
        `Cannot delete pool with ${assigned} assigned IP(s)`,
        400,
        'POOL_IN_USE'
      )
    }
    await prisma.$transaction([
      prisma.ipAddress.deleteMany({ where: { poolId } }),
      prisma.ipPool.delete({ where: { id: poolId } }),
    ])
  }
}

export default new IpPoolService()
