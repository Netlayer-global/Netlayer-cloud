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

    // Round 22: retail users must use the pay-per-deploy flow. Surface a
    // 402 with a clear pointer instead of letting deployServer throw.
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { billingMode: true },
    })
    if (user?.billingMode === 'retail') {
      return res.status(402).json({
        error: 'Retail customers must pay for the first month upfront. Create a deploy order instead.',
        code: 'USE_CHECKOUT_FLOW',
        requiresCheckout: true,
        checkoutEndpoint: '/api/deploy-orders',
      })
    }

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

// ─── Round 18: resize / clone / rescue ──────────────
import { customAlphabet } from 'nanoid'
import fastDeployService from '../services/fastDeploy.service'
import { emitServerStatus } from '../services/socket.service'
import { computeTax } from '../services/tax.service'

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

const safeJSONParse = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

router.post('/:id/resize', async (req: AuthedRequest, res, next) => {
  try {
    const { newPlanId } = z.object({ newPlanId: z.string().min(1) }).parse(req.body)

    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
      include: { plan: true, node: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } })
    if (!newPlan?.isActive) throw new AppError('Plan not available', 400, 'INVALID_PLAN')
    if (newPlan.id === server.planId) throw new AppError('Already on this plan', 400, 'SAME_PLAN')

    if (server.status === 'RUNNING' && newPlan.cpu < server.plan.cpu) {
      throw new AppError(
        'Cannot downsize a running server. Stop it first.',
        400,
        'DOWNSIZE_BLOCKED'
      )
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    // Charge prorated upgrade for the rest of the current month
    const upgradeDelta = Math.max(0, newPlan.priceInr - server.plan.priceInr)
    const tax = computeTax({
      amount: upgradeDelta,
      country: user.country || 'IN',
      gstNumber: user.gstNumber || undefined,
      vatNumber: user.vatNumber || undefined,
    })
    const upgradeTotal = Number((upgradeDelta + tax.total).toFixed(2))

    if (upgradeTotal > 0) {
      const effective = user.balance + (user.creditLimit || 0)
      if (effective < upgradeTotal) {
        throw new AppError(
          `Insufficient balance. Add ₹${(upgradeTotal - effective).toFixed(2)} for this upgrade.`,
          402,
          'INSUFFICIENT_BALANCE'
        )
      }
    }

    // Adjust node resource counters (subtract old, add new)
    const ops: any[] = []
    if (server.node) {
      ops.push(
        prisma.node.update({
          where: { id: server.node.id },
          data: {
            usedCpu:    { increment: newPlan.cpu - server.plan.cpu },
            usedRamGB:  { increment: newPlan.ramGB - server.plan.ramGB },
            usedDiskGB: { increment: newPlan.diskGB - server.plan.diskGB },
          },
        })
      )
    }

    if (upgradeTotal > 0) {
      const before = user.balance
      const after = Number((before - upgradeTotal).toFixed(2))
      ops.push(
        prisma.user.update({ where: { id: user.id }, data: { balance: after } }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'debit',
            amount: upgradeTotal,
            currency: user.currency || 'INR',
            description: `Upgrade ${server.name}: ${server.plan.name} → ${newPlan.name}`,
            balanceBefore: before,
            balanceAfter: after,
          },
        })
      )
    }

    ops.push(
      prisma.server.update({
        where: { id: server.id },
        data: {
          planId: newPlan.id,
          specs: JSON.stringify({ cpu: newPlan.cpu, ram: newPlan.ramGB, disk: newPlan.diskGB }),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'server.resized',
          resource: 'server',
          resourceId: server.id,
          oldValue: JSON.stringify({ planId: server.planId }),
          newValue: JSON.stringify({ planId: newPlan.id }),
        },
      })
    )

    await prisma.$transaction(ops)
    emitServerStatus(server.id, { status: server.status, plan: newPlan.name })

    const fresh = await prisma.server.findUnique({
      where: { id: server.id },
      include: { plan: true, region: true, osTemplate: true },
    })
    res.json({ data: serializeServer(fresh!) })
  } catch (e) { next(e) }
})

router.post('/:id/clone', async (req: AuthedRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(64).optional() }).parse(req.body)

    const source = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
      include: { plan: true, region: true, osTemplate: true, node: true },
    })
    if (!source) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (!['RUNNING', 'STOPPED'].includes(source.status)) {
      throw new AppError('Server must be running or stopped to clone', 400, 'INVALID_STATE')
    }

    const cloneName = name || `${source.name}-copy`
    const cloneHostname = `srv-${nano()}.${process.env.CLOUDFLARE_DOMAIN || 'netlayer.com'}`

    const cloned = await prisma.server.create({
      data: {
        userId: source.userId,
        nodeId: source.nodeId,
        name: cloneName,
        hostname: cloneHostname,
        planId: source.planId,
        regionId: source.regionId,
        osTemplateId: source.osTemplateId,
        status: 'PENDING',
        rootPassword: source.rootPassword,
        specs: source.specs,
        bandwidth: source.bandwidth,
      },
      include: { plan: true, region: true, osTemplate: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: source.userId,
        action: 'server.cloned',
        resource: 'server',
        resourceId: cloned.id,
        oldValue: JSON.stringify({ sourceServerId: source.id }),
      },
    })

    // Run the same fast-deploy pipeline so the user gets the full progress UX.
    setImmediate(() => {
      fastDeployService
        .deploy({
          serverId: cloned.id,
          userId: source.userId,
          hostname: cloneHostname,
          rootPassword: source.rootPassword || 'cloned',
        })
        .catch(() => {})
    })

    res.status(201).json({ data: serializeServer(cloned) })
  } catch (e) { next(e) }
})

router.post('/:id/rescue', async (req: AuthedRequest, res, next) => {
  try {
    const { isoId } = z.object({ isoId: z.string().min(1) }).parse(req.body)
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const iso = await prisma.isoImage.findUnique({ where: { id: isoId } })
    if (!iso) throw new AppError('ISO not found', 404, 'NOT_FOUND')
    if (!iso.isPublic && iso.userId !== req.user!.userId) {
      throw new AppError('ISO not accessible', 403, 'FORBIDDEN')
    }

    const meta = safeJSONParse<any>(server.notes, {})
    const newMeta = { ...meta, rescueMode: true, rescueIsoId: iso.id, rescuedAt: new Date().toISOString() }

    await prisma.server.update({
      where: { id: server.id },
      data: { notes: JSON.stringify(newMeta), status: 'REBOOTING' },
    })

    await prisma.auditLog.create({
      data: {
        userId: server.userId,
        action: 'server.rescue',
        resource: 'server',
        resourceId: server.id,
        newValue: JSON.stringify({ isoId: iso.id }),
      },
    })

    setTimeout(async () => {
      await prisma.server
        .update({ where: { id: server.id }, data: { status: 'RUNNING' } })
        .catch(() => {})
      emitServerStatus(server.id, { status: 'RUNNING', rescueMode: true })
    }, 4000)

    res.json({ data: { message: 'Booting into rescue mode', rescueIsoId: iso.id } })
  } catch (e) { next(e) }
})

router.post('/:id/rescue-exit', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const meta = safeJSONParse<any>(server.notes, {})
    const { rescueMode, rescueIsoId, rescuedAt, ...rest } = meta

    await prisma.server.update({
      where: { id: server.id },
      data: {
        notes: Object.keys(rest).length ? JSON.stringify(rest) : null,
        status: 'REBOOTING',
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: server.userId,
        action: 'server.rescue_exit',
        resource: 'server',
        resourceId: server.id,
      },
    })

    setTimeout(async () => {
      await prisma.server.update({ where: { id: server.id }, data: { status: 'RUNNING' } }).catch(() => {})
      emitServerStatus(server.id, { status: 'RUNNING', rescueMode: false })
    }, 3000)

    res.json({ data: { message: 'Exiting rescue mode' } })
  } catch (e) { next(e) }
})

export default router
