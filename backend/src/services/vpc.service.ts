import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

/**
 * VPC service — virtual private cloud networking. A VPC has a CIDR block
 * and a set of member servers. We allocate sequential private IPs out of
 * the configured /16 (default 10.0.0.0/16) starting at .10.
 */

const isValidCidr = (cidr: string) => {
  const m = cidr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/)
  if (!m) return false
  const [, a, b, c, d, mask] = m.map(Number)
  return [a, b, c, d].every((x) => x >= 0 && x <= 255) && mask >= 8 && mask <= 30
}

const cidrBase = (cidr: string) => cidr.split('/')[0].split('.').slice(0, 2).join('.')

const allocatePrivateIp = (cidr: string, taken: Set<string>) => {
  const base = cidrBase(cidr)
  for (let i = 10; i < 250; i++) {
    for (let j = 1; j < 250; j++) {
      const ip = `${base}.${i}.${j}`
      if (!taken.has(ip)) return ip
    }
  }
  throw new AppError('VPC IP space exhausted', 400, 'IP_EXHAUSTED')
}

export class VPCService {
  async create(userId: string, data: { name: string; region: string; cidr?: string; isDefault?: boolean }) {
    if (data.cidr && !isValidCidr(data.cidr)) {
      throw new AppError('Invalid CIDR', 400, 'INVALID_CIDR')
    }
    const region = await prisma.region.findUnique({ where: { slug: data.region } })
    if (!region) throw new AppError('Region not found', 400, 'INVALID_REGION')

    if (data.isDefault) {
      // Only one default per user per region.
      await prisma.vPC.updateMany({
        where: { userId, region: data.region, isDefault: true },
        data: { isDefault: false },
      })
    }

    return prisma.vPC.create({
      data: {
        userId,
        name: data.name,
        region: data.region,
        cidr: data.cidr || '10.0.0.0/16',
        isDefault: data.isDefault || false,
      },
    })
  }

  async list(userId: string) {
    return prisma.vPC.findMany({
      where: { userId },
      include: {
        members: {
          include: {
            server: { select: { id: true, name: true, ipv4: true, status: true, regionId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(userId: string, id: string) {
    const vpc = await prisma.vPC.findFirst({
      where: { id, userId },
      include: {
        members: {
          include: {
            server: { select: { id: true, name: true, ipv4: true, status: true, regionId: true } },
          },
        },
      },
    })
    if (!vpc) throw new AppError('VPC not found', 404, 'NOT_FOUND')
    return vpc
  }

  async destroy(userId: string, id: string) {
    const vpc = await prisma.vPC.findFirst({
      where: { id, userId },
      include: { members: true },
    })
    if (!vpc) throw new AppError('VPC not found', 404, 'NOT_FOUND')
    if (vpc.members.length > 0) {
      throw new AppError('Detach all servers before deleting the VPC', 400, 'STILL_ATTACHED')
    }
    await prisma.vPC.delete({ where: { id } })
  }

  async attachServer(userId: string, vpcId: string, serverId: string) {
    const vpc = await prisma.vPC.findFirst({
      where: { id: vpcId, userId },
      include: { members: true },
    })
    if (!vpc) throw new AppError('VPC not found', 404, 'NOT_FOUND')

    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
      include: { region: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (server.region.slug !== vpc.region) {
      throw new AppError('Server and VPC must be in the same region', 400, 'REGION_MISMATCH')
    }

    const existing = await prisma.vPCMember.findFirst({
      where: { vpcId, serverId },
    })
    if (existing) throw new AppError('Server already in VPC', 400, 'ALREADY_ATTACHED')

    const taken = new Set(vpc.members.map((m) => m.privateIp))
    const privateIp = allocatePrivateIp(vpc.cidr, taken)

    return prisma.vPCMember.create({
      data: { vpcId, serverId, privateIp },
      include: {
        server: { select: { id: true, name: true, ipv4: true, status: true } },
      },
    })
  }

  async detachServer(userId: string, vpcId: string, memberId: string) {
    const vpc = await prisma.vPC.findFirst({ where: { id: vpcId, userId } })
    if (!vpc) throw new AppError('VPC not found', 404, 'NOT_FOUND')

    const member = await prisma.vPCMember.findFirst({
      where: { id: memberId, vpcId },
    })
    if (!member) throw new AppError('Member not found', 404, 'NOT_FOUND')

    await prisma.vPCMember.delete({ where: { id: memberId } })
  }
}

export default new VPCService()
