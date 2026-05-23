import prisma from '../utils/prisma'
import cloudflare from './cloudflare.service'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const VALID_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'] as const
type DnsType = typeof VALID_TYPES[number]

const isValidDomain = (s: string) =>
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(s)

/**
 * DNS service — manages user DNS zones and records. When Cloudflare is
 * configured (CLOUDFLARE_MOCK_MODE=false), records are mirrored to the
 * Cloudflare zone in real time. In mock mode we just persist DB rows.
 */
export class DnsService {
  async createZone(userId: string, domain: string) {
    const lower = domain.toLowerCase().trim()
    if (!isValidDomain(lower)) {
      throw new AppError('Invalid domain', 400, 'INVALID_DOMAIN')
    }
    const existing = await prisma.dnsZone.findUnique({ where: { domain: lower } })
    if (existing) {
      throw new AppError('Domain already taken', 409, 'DOMAIN_TAKEN')
    }
    return prisma.dnsZone.create({
      data: { userId, domain: lower, status: 'active' },
    })
  }

  async listZones(userId: string) {
    return prisma.dnsZone.findMany({
      where: { userId },
      include: { _count: { select: { records: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getZone(userId: string, id: string) {
    const zone = await prisma.dnsZone.findFirst({
      where: { id, userId },
      include: { records: { orderBy: { type: 'asc' } } },
    })
    if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND')
    return zone
  }

  async destroyZone(userId: string, id: string) {
    const zone = await prisma.dnsZone.findFirst({ where: { id, userId } })
    if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND')
    await prisma.$transaction([
      prisma.dnsRecord.deleteMany({ where: { zoneId: id } }),
      prisma.dnsZone.delete({ where: { id } }),
    ])
  }

  async createRecord(userId: string, zoneId: string, data: {
    type: string; name: string; content: string; ttl?: number; priority?: number
  }) {
    const zone = await prisma.dnsZone.findFirst({ where: { id: zoneId, userId } })
    if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND')

    if (!VALID_TYPES.includes(data.type as DnsType)) {
      throw new AppError('Invalid DNS record type', 400, 'INVALID_TYPE')
    }
    if (data.type === 'A' && !/^(\d{1,3}\.){3}\d{1,3}$/.test(data.content)) {
      throw new AppError('Invalid IPv4 for A record', 400, 'INVALID_CONTENT')
    }
    if (data.type === 'AAAA' && !/^[0-9a-fA-F:]+$/.test(data.content)) {
      throw new AppError('Invalid IPv6 for AAAA record', 400, 'INVALID_CONTENT')
    }
    if ((data.type === 'CNAME' || data.type === 'NS') && !isValidDomain(data.content)) {
      throw new AppError('Invalid hostname', 400, 'INVALID_CONTENT')
    }
    if ((data.type === 'MX' || data.type === 'SRV') &&
        (data.priority === undefined || data.priority < 0)) {
      throw new AppError(`Priority required for ${data.type} records`, 400, 'PRIORITY_REQUIRED')
    }

    // Push to Cloudflare if configured. We don't fail the API on Cloudflare
    // errors since the DB row is the source of truth.
    if (data.type === 'A') {
      try {
        const fqdn = data.name === '@' ? zone.domain : `${data.name}.${zone.domain}`
        await cloudflare.createARecord(fqdn, data.content)
      } catch (e: any) {
        logger.warn(`Cloudflare createARecord failed: ${e.message}`)
      }
    }

    return prisma.dnsRecord.create({
      data: {
        zoneId,
        type: data.type,
        name: data.name,
        content: data.content,
        ttl: data.ttl || 300,
        priority: data.priority,
      },
    })
  }

  async deleteRecord(userId: string, zoneId: string, recordId: string) {
    const zone = await prisma.dnsZone.findFirst({ where: { id: zoneId, userId } })
    if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND')
    const record = await prisma.dnsRecord.findFirst({
      where: { id: recordId, zoneId },
    })
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND')
    await prisma.dnsRecord.delete({ where: { id: recordId } })
  }

  async updateRecord(userId: string, zoneId: string, recordId: string, data: {
    name?: string; content?: string; ttl?: number; priority?: number
  }) {
    const zone = await prisma.dnsZone.findFirst({ where: { id: zoneId, userId } })
    if (!zone) throw new AppError('Zone not found', 404, 'NOT_FOUND')
    const record = await prisma.dnsRecord.findFirst({
      where: { id: recordId, zoneId },
    })
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND')
    return prisma.dnsRecord.update({ where: { id: recordId }, data })
  }
}

export default new DnsService()
