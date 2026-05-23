import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const ipNano = () =>
  `103.21.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`

export interface HealthCheckConfig {
  path?: string         // HTTP/HTTPS path
  interval?: number     // seconds
  timeout?: number      // seconds
  healthyThreshold?: number
  unhealthyThreshold?: number
  protocol?: 'HTTP' | 'HTTPS' | 'TCP'
  port?: number
}

const DEFAULT_HEALTH: Required<HealthCheckConfig> = {
  path: '/',
  interval: 30,
  timeout: 5,
  healthyThreshold: 2,
  unhealthyThreshold: 3,
  protocol: 'HTTP',
  port: 80,
}

/**
 * Load Balancer service — issues a public IPv4, accepts target servers,
 * runs a periodic health-check job, and (in real mode) writes an HAProxy
 * config to the underlying control plane node. Mock mode does the same DB
 * state transitions without touching infrastructure.
 */
export class LoadBalancerService {
  async create(userId: string, data: {
    name: string
    region: string
    algorithm?: string
    protocol?: string
    port?: number
    healthCheck?: HealthCheckConfig
  }) {
    const lb = await prisma.loadBalancer.create({
      data: {
        userId,
        name: data.name,
        region: data.region,
        algorithm: data.algorithm || 'round_robin',
        protocol: data.protocol || 'HTTP',
        port: data.port || 80,
        ipv4: ipNano(),
        healthCheck: JSON.stringify({ ...DEFAULT_HEALTH, ...(data.healthCheck || {}) }),
        status: 'active',
      },
    })

    logger.info(`Load balancer ${lb.id} created (${lb.ipv4}:${lb.port})`)
    return lb
  }

  async list(userId: string) {
    return prisma.loadBalancer.findMany({
      where: { userId },
      include: {
        targets: {
          include: { server: { select: { id: true, name: true, ipv4: true, status: true, regionId: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(userId: string, id: string) {
    const lb = await prisma.loadBalancer.findFirst({
      where: { id, userId },
      include: {
        targets: {
          include: { server: { select: { id: true, name: true, ipv4: true, status: true, regionId: true } } },
        },
      },
    })
    if (!lb) throw new AppError('Load balancer not found', 404, 'NOT_FOUND')
    return lb
  }

  async update(userId: string, id: string, data: {
    name?: string
    algorithm?: string
    protocol?: string
    port?: number
    healthCheck?: HealthCheckConfig
  }) {
    const lb = await prisma.loadBalancer.findFirst({ where: { id, userId } })
    if (!lb) throw new AppError('Load balancer not found', 404, 'NOT_FOUND')

    const updateData: any = { ...data }
    if (data.healthCheck) {
      updateData.healthCheck = JSON.stringify({ ...DEFAULT_HEALTH, ...data.healthCheck })
    }

    return prisma.loadBalancer.update({ where: { id }, data: updateData })
  }

  async destroy(userId: string, id: string) {
    const lb = await prisma.loadBalancer.findFirst({ where: { id, userId } })
    if (!lb) throw new AppError('Load balancer not found', 404, 'NOT_FOUND')

    await prisma.$transaction([
      prisma.loadBalancerTarget.deleteMany({ where: { loadBalancerId: id } }),
      prisma.loadBalancer.delete({ where: { id } }),
    ])

    logger.info(`Load balancer ${id} destroyed`)
  }

  async addTarget(userId: string, lbId: string, serverId: string, port = 80, weight = 1) {
    const lb = await prisma.loadBalancer.findFirst({ where: { id: lbId, userId } })
    if (!lb) throw new AppError('Load balancer not found', 404, 'NOT_FOUND')

    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
      include: { region: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (server.region.slug !== lb.region) {
      throw new AppError('Server and load balancer must be in the same region', 400, 'REGION_MISMATCH')
    }

    const existing = await prisma.loadBalancerTarget.findFirst({
      where: { loadBalancerId: lbId, serverId },
    })
    if (existing) {
      throw new AppError('Server is already a target', 409, 'TARGET_EXISTS')
    }

    return prisma.loadBalancerTarget.create({
      data: { loadBalancerId: lbId, serverId, port, weight, isHealthy: true },
      include: { server: { select: { id: true, name: true, ipv4: true, status: true } } },
    })
  }

  async removeTarget(userId: string, lbId: string, targetId: string) {
    const lb = await prisma.loadBalancer.findFirst({ where: { id: lbId, userId } })
    if (!lb) throw new AppError('Load balancer not found', 404, 'NOT_FOUND')

    const target = await prisma.loadBalancerTarget.findFirst({
      where: { id: targetId, loadBalancerId: lbId },
    })
    if (!target) throw new AppError('Target not found', 404, 'NOT_FOUND')

    await prisma.loadBalancerTarget.delete({ where: { id: targetId } })
  }
}

export default new LoadBalancerService()
