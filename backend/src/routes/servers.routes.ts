import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import serverService from '../services/server.service'
import { ProxmoxService } from '../services/proxmox.service'
import { serializeServer } from '../utils/serialize'

const router = Router()

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const servers = await prisma.server.findMany({
      where: { userId: req.user!.userId, deletedAt: null },
      include: { plan: true, region: true, osTemplate: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: servers.map(serializeServer) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      planId: z.string().min(1),
      regionId: z.string().min(1),
      osTemplateId: z.string().min(1),
      sshKeyId: z.string().optional(),
      rootPassword: z.string().optional(),
    })
    const body = schema.parse(req.body)
    const server = await serverService.deployServer(req.user!.userId, body)
    res.status(201).json({ data: serializeServer(server) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
      include: { plan: true, region: true, osTemplate: true, node: { select: { id: true, name: true } } },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    res.json({ data: serializeServer(server) })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await serverService.destroyServer(req.params.id, req.user!.userId)
    res.json({ message: 'Server deleted' })
  } catch (e) { next(e) }
})

router.post('/:id/power', async (req: AuthedRequest, res, next) => {
  try {
    const { action } = z.object({ action: z.enum(['start', 'stop', 'restart']) }).parse(req.body)
    await serverService.powerAction(req.params.id, action, req.user!.userId)
    res.json({ message: `Power ${action} initiated` })
  } catch (e) { next(e) }
})

router.get('/:id/metrics', async (req: AuthedRequest, res, next) => {
  try {
    const range = (req.query.range as string) || '24h'
    const metrics = await serverService.getMetrics(req.params.id, req.user!.userId, range)
    res.json({ data: metrics })
  } catch (e) { next(e) }
})

router.post('/:id/rebuild', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({ osTemplateId: z.string().min(1), rootPassword: z.string().min(8) })
      .parse(req.body)
    await serverService.rebuildServer(req.params.id, req.user!.userId, body.osTemplateId, body.rootPassword)
    res.json({ message: 'Rebuild initiated' })
  } catch (e) { next(e) }
})

// ─── Console ────────────────────────────────────────
router.get('/:id/console', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
      include: { node: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (!server.node || !server.proxmoxVmId) {
      throw new AppError('Server not provisioned', 400, 'NOT_READY')
    }
    const proxmox = new ProxmoxService(server.node)
    const console = await proxmox.getVMConsole(server.proxmoxVmId)
    res.json({
      data: {
        ...console,
        host: server.node.proxmoxHost,
        nodeName: server.node.proxmoxNode,
        vmId: server.proxmoxVmId,
      },
    })
  } catch (e) { next(e) }
})

// ─── Snapshots ──────────────────────────────────────
router.get('/:id/snapshots', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    const snapshots = await prisma.serverSnapshot.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: snapshots })
  } catch (e) { next(e) }
})

router.post('/:id/snapshots', async (req: AuthedRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(64) }).parse(req.body)
    const snapshot = await serverService.createSnapshot(req.params.id, req.user!.userId, name)
    res.status(201).json({ data: snapshot })
  } catch (e) { next(e) }
})

router.delete('/:id/snapshots/:snapId', async (req: AuthedRequest, res, next) => {
  try {
    await serverService.deleteSnapshot(req.params.id, req.user!.userId, req.params.snapId)
    res.json({ message: 'Snapshot deleted' })
  } catch (e) { next(e) }
})

// ─── Firewall ───────────────────────────────────────
router.get('/:id/firewall', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    const rules = await prisma.firewallRule.findMany({
      where: { serverId: server.id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ data: rules })
  } catch (e) { next(e) }
})

router.post('/:id/firewall', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      direction: z.enum(['INBOUND', 'OUTBOUND']),
      protocol: z.enum(['TCP', 'UDP', 'ICMP', 'ALL']),
      portFrom: z.number().int().min(1).max(65535).optional(),
      portTo: z.number().int().min(1).max(65535).optional(),
      sourceIp: z.string().optional(),
      action: z.enum(['ACCEPT', 'DROP', 'REJECT']).optional(),
      priority: z.number().int().optional(),
    })
    const body = schema.parse(req.body)
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    const rule = await prisma.firewallRule.create({
      data: { serverId: server.id, ...body, action: body.action ?? 'ACCEPT' },
    })
    res.status(201).json({ data: rule })
  } catch (e) { next(e) }
})

router.delete('/:id/firewall/:ruleId', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    const rule = await prisma.firewallRule.findFirst({
      where: { id: req.params.ruleId, serverId: server.id },
    })
    if (!rule) throw new AppError('Rule not found', 404, 'NOT_FOUND')
    await prisma.firewallRule.delete({ where: { id: rule.id } })
    res.json({ message: 'Rule deleted' })
  } catch (e) { next(e) }
})

export default router
