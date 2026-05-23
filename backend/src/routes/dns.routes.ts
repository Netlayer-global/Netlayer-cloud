import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'
import dnsService from '../services/dns.service'
import { emitToUser } from '../services/socket.service'

const router = Router()

router.get('/zones', async (req: AuthedRequest, res, next) => {
  try {
    const zones = await dnsService.listZones(req.user!.userId)
    res.json({ data: zones })
  } catch (e) { next(e) }
})

router.post('/zones', async (req: AuthedRequest, res, next) => {
  try {
    const { domain } = z.object({ domain: z.string().min(1) }).parse(req.body)
    const zone = await dnsService.createZone(req.user!.userId, domain)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'dns.zone.create',
        resource: 'dns_zone',
        resourceId: zone.id,
        newValue: JSON.stringify({ domain }),
      },
    })

    emitToUser(req.user!.userId, 'dns:zone_created', zone)
    res.status(201).json({ data: zone })
  } catch (e) { next(e) }
})

router.get('/zones/:id', async (req: AuthedRequest, res, next) => {
  try {
    const zone = await dnsService.getZone(req.user!.userId, req.params.id)
    res.json({ data: zone })
  } catch (e) { next(e) }
})

router.delete('/zones/:id', async (req: AuthedRequest, res, next) => {
  try {
    await dnsService.destroyZone(req.user!.userId, req.params.id)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'dns.zone.delete',
        resource: 'dns_zone',
        resourceId: req.params.id,
      },
    })
    res.json({ message: 'Zone deleted' })
  } catch (e) { next(e) }
})

router.post('/zones/:id/records', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']),
      name: z.string().min(1).max(255),
      content: z.string().min(1).max(2048),
      ttl: z.number().int().min(60).max(86400).optional(),
      priority: z.number().int().min(0).max(65535).optional(),
    })
    const body = schema.parse(req.body)
    const record = await dnsService.createRecord(req.user!.userId, req.params.id, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'dns.record.create',
        resource: 'dns_zone',
        resourceId: req.params.id,
        newValue: JSON.stringify(body),
      },
    })

    res.status(201).json({ data: record })
  } catch (e) { next(e) }
})

router.patch('/zones/:id/records/:recordId', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      content: z.string().optional(),
      ttl: z.number().int().min(60).max(86400).optional(),
      priority: z.number().int().min(0).max(65535).optional(),
    })
    const body = schema.parse(req.body)
    const record = await dnsService.updateRecord(
      req.user!.userId, req.params.id, req.params.recordId, body
    )
    res.json({ data: record })
  } catch (e) { next(e) }
})

router.delete('/zones/:id/records/:recordId', async (req: AuthedRequest, res, next) => {
  try {
    await dnsService.deleteRecord(req.user!.userId, req.params.id, req.params.recordId)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'dns.record.delete',
        resource: 'dns_zone',
        resourceId: req.params.id,
      },
    })
    res.json({ message: 'Record deleted' })
  } catch (e) { next(e) }
})

export default router
