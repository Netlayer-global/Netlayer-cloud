import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { adminOnly, AuthedRequest } from '../middleware/auth'
import { generateAccessToken } from '../utils/jwt'
import {
  serializeServer,
  serializeInvoice,
  serializeNode,
  serializeRole,
  serializeAnnouncement,
  serializeIntegration,
  serializeAudit,
  serializeEmailTemplate,
  serializeSmsTemplate,
} from '../utils/serialize'
import serverService from '../services/server.service'
import paymentService from '../services/payment.service'
import emailService from '../services/email.service'
import smsService from '../services/sms.service'
import { ProxmoxService } from '../services/proxmox.service'
import { CloudflareService } from '../services/cloudflare.service'
import { GrafanaService } from '../services/grafana.service'
import { ZabbixService } from '../services/zabbix.service'
import { EmailService } from '../services/email.service'
import { SmsService } from '../services/sms.service'
import { PaymentService } from '../services/payment.service'
import { clearConfigCache } from '../utils/config'
import workflowRoutes from './admin-workflows.routes'
import statusAdminRoutes from './admin-status.routes'
import abuseAdminRoutes from './admin-abuse.routes'
import cannedRoutes from './admin-canned.routes'
import { slaState } from '../services/sla.service'

const router = Router()
router.use(adminOnly)

router.use('/workflows', workflowRoutes)
router.use('/status/incidents', statusAdminRoutes)
router.use('/abuse', abuseAdminRoutes)
router.use('/canned-responses', cannedRoutes)

// ─── DASHBOARD ───────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = monthStart

    const [
      usersTotal,
      usersActive,
      usersSuspended,
      usersNewToday,
      usersNewThisMonth,
      serversTotal,
      serversRunning,
      serversStopped,
      serversBuilding,
      serversError,
      todayPayments,
      monthPayments,
      lastMonthPayments,
      totalPayments,
      ticketsOpen,
      ticketsInProgress,
      ticketsResolved,
      nodesTotal,
      nodesOnline,
      nodesOffline,
      nodesDegraded,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.server.count({ where: { deletedAt: null } }),
      prisma.server.count({ where: { status: 'RUNNING', deletedAt: null } }),
      prisma.server.count({ where: { status: 'STOPPED', deletedAt: null } }),
      prisma.server.count({ where: { status: { in: ['BUILDING', 'PENDING'] }, deletedAt: null } }),
      prisma.server.count({ where: { status: 'ERROR', deletedAt: null } }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: todayStart } }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: monthStart } }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: lastMonthStart, lt: lastMonthEnd } }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.node.count(),
      prisma.node.count({ where: { status: 'ONLINE' } }),
      prisma.node.count({ where: { status: 'OFFLINE' } }),
      prisma.node.count({ where: { status: 'DEGRADED' } }),
    ])

    res.json({
      data: {
        users: { total: usersTotal, active: usersActive, suspended: usersSuspended, newToday: usersNewToday, newThisMonth: usersNewThisMonth },
        servers: { total: serversTotal, running: serversRunning, stopped: serversStopped, building: serversBuilding, error: serversError },
        revenue: {
          today: todayPayments._sum.total || 0,
          thisMonth: monthPayments._sum.total || 0,
          lastMonth: lastMonthPayments._sum.total || 0,
          total: totalPayments._sum.total || 0,
        },
        tickets: { open: ticketsOpen, inProgress: ticketsInProgress, resolved: ticketsResolved },
        nodes: { total: nodesTotal, online: nodesOnline, offline: nodesOffline, degraded: nodesDegraded },
      },
    })
  } catch (e) { next(e) }
})

router.get('/revenue-chart', async (req, res, next) => {
  try {
    const period = (req.query.period as string) || '30d'
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const start = new Date(Date.now() - days * 86_400_000)

    const invoices = await prisma.invoice.findMany({
      where: { status: 'PAID', paidAt: { gte: start } },
      select: { paidAt: true, total: true, amount: true },
    })

    const buckets = new Map<string, { date: string; amount: number; count: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { date: key, amount: 0, count: 0 })
    }
    for (const inv of invoices) {
      if (!inv.paidAt) continue
      const key = inv.paidAt.toISOString().slice(0, 10)
      const b = buckets.get(key)
      if (b) {
        b.amount += inv.total > 0 ? inv.total : inv.amount
        b.count += 1
      }
    }

    res.json({ data: Array.from(buckets.values()) })
  } catch (e) { next(e) }
})

router.get('/activity-feed', async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    })
    res.json({ data: logs.map(serializeAudit) })
  } catch (e) { next(e) }
})

// ─── USERS ───────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10))
    const search = (req.query.search as string) || ''
    const status = req.query.status as string | undefined
    const country = req.query.country as string | undefined
    const role = req.query.role as string | undefined

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (country) where.country = country
    if (role) where.role = role

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { servers: true } },
          roleAssignments: { include: { role: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    const sanitized = users.map((u) => {
      const { passwordHash, twoFactorSecret, resetToken, ...rest } = u
      return rest
    })

    res.json({ data: sanitized, pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        servers: { where: { deletedAt: null }, include: { plan: true, region: true } },
        invoices: { take: 10, orderBy: { createdAt: 'desc' } },
        transactions: { take: 10, orderBy: { createdAt: 'desc' } },
        roleAssignments: { include: { role: true } },
        sessions: { where: { expiresAt: { gt: new Date() } }, take: 10 },
      },
    })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const { passwordHash, twoFactorSecret, resetToken, ...rest } = user
    res.json({
      data: {
        ...rest,
        servers: user.servers.map(serializeServer),
        invoices: user.invoices.map(serializeInvoice),
        roleAssignments: user.roleAssignments.map((a) => ({
          ...a,
          role: serializeRole(a.role),
        })),
      },
    })
  } catch (e) { next(e) }
})

router.patch('/users/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
      role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'BILLING']).optional(),
      balance: z.number().optional(),
      creditLimit: z.number().optional(),
      country: z.string().optional(),
      currency: z.string().optional(),
      notes: z.string().optional(),
    })
    const body = schema.parse(req.body)
    const before = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!before) throw new AppError('User not found', 404, 'NOT_FOUND')

    const user = await prisma.user.update({ where: { id: req.params.id }, data: body })

    if (body.status === 'SUSPENDED' && before.status !== 'SUSPENDED') {
      await emailService.sendAccountSuspended(user, body.notes || 'Admin action').catch(() => {})
    }
    if (body.status === 'ACTIVE' && before.status !== 'ACTIVE') {
      await emailService.sendAccountActivated(user).catch(() => {})
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.user.update',
        resource: 'user',
        resourceId: user.id,
        oldValue: JSON.stringify({ status: before.status, role: before.role, balance: before.balance }),
        newValue: JSON.stringify(body),
      },
    })

    const { passwordHash, twoFactorSecret, resetToken, ...rest } = user
    res.json({ data: rest })
  } catch (e) { next(e) }
})

router.post('/users/:id/adjust-balance', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      amount: z.number(),
      reason: z.string().min(1),
      type: z.enum(['credit', 'debit']),
    })
    const body = schema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const delta = body.type === 'credit' ? body.amount : -body.amount
    const before = user.balance
    const after = before + delta

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: after } }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: body.type,
          amount: Math.abs(body.amount),
          currency: user.currency,
          description: `Admin ${body.type}: ${body.reason}`,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'balance_adjusted',
          title: body.type === 'credit' ? 'Credit added' : 'Balance adjusted',
          message: `${body.type === 'credit' ? '+' : '-'}${body.amount} ${user.currency}: ${body.reason}`,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'admin.balance.adjust',
          resource: 'user',
          resourceId: user.id,
          newValue: JSON.stringify({ type: body.type, amount: body.amount, reason: body.reason }),
        },
      }),
    ])

    res.json({ data: { balanceBefore: before, balanceAfter: after } })
  } catch (e) { next(e) }
})

router.post('/users/:id/impersonate', async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    // 5-minute impersonation token
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      { userId: user.id, role: user.role, impersonatedBy: req.user!.userId },
      process.env.JWT_SECRET || 'change-me-access',
      { expiresIn: '5m' }
    )

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'user.impersonated',
        resource: 'user',
        resourceId: user.id,
      },
    })

    res.json({ data: { token, userId: user.id, expiresIn: 300 } })
  } catch (e) { next(e) }
})

router.delete('/users/:id', async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'BANNED' },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.user.delete',
        resource: 'user',
        resourceId: user.id,
      },
    })
    res.json({ message: 'User banned' })
  } catch (e) { next(e) }
})

// ─── SERVERS ─────────────────────────────────────────────
router.get('/servers', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10))
    const status = req.query.status as string | undefined
    const regionId = req.query.regionId as string | undefined
    const userId = req.query.userId as string | undefined
    const nodeId = req.query.nodeId as string | undefined

    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (regionId) where.regionId = regionId
    if (userId) where.userId = userId
    if (nodeId) where.nodeId = nodeId

    const [servers, total] = await Promise.all([
      prisma.server.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          region: true,
          osTemplate: true,
          node: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.server.count({ where }),
    ])

    res.json({
      data: servers.map(serializeServer),
      pagination: { page, limit, total },
    })
  } catch (e) { next(e) }
})

router.get('/servers/:id', async (req, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        plan: true,
        region: true,
        osTemplate: true,
        node: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true, balance: true, country: true } },
      },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    res.json({ data: serializeServer(server) })
  } catch (e) { next(e) }
})

router.delete('/servers/:id', async (req: AuthedRequest, res, next) => {
  try {
    await serverService.destroyServer(req.params.id, req.user!.userId, true)
    res.json({ message: 'Server deleted' })
  } catch (e) { next(e) }
})

router.post('/servers/:id/power', async (req: AuthedRequest, res, next) => {
  try {
    const { action } = z.object({ action: z.enum(['start', 'stop', 'restart']) }).parse(req.body)
    await serverService.powerAction(req.params.id, action, req.user!.userId, true)
    res.json({ message: `Power ${action} initiated` })
  } catch (e) { next(e) }
})

router.post('/servers/:id/migrate', async (req: AuthedRequest, res, next) => {
  try {
    const { targetNodeId } = z.object({ targetNodeId: z.string().min(1) }).parse(req.body)
    await serverService.migrateServer(req.params.id, targetNodeId, req.user!.userId)
    res.json({ message: 'Migration started' })
  } catch (e) { next(e) }
})

// ─── NODES ───────────────────────────────────────────────
router.get('/nodes', async (_req, res, next) => {
  try {
    const nodes = await prisma.node.findMany({
      include: { region: true, _count: { select: { servers: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: nodes.map(serializeNode) })
  } catch (e) { next(e) }
})

router.post('/nodes', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      regionId: z.string().min(1),
      proxmoxHost: z.string().url(),
      proxmoxNode: z.string().min(1),
      proxmoxTokenId: z.string().min(1),
      proxmoxTokenSecret: z.string().min(1),
      totalCpu: z.number().int().positive(),
      totalRamGB: z.number().int().positive(),
      totalDiskGB: z.number().int().positive(),
      maxVMs: z.number().int().positive().optional(),
      networkGbps: z.number().int().positive().optional(),
      ipRanges: z.array(z.string()).optional(),
    })
    const body = schema.parse(req.body)
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const node = await prisma.node.create({
      data: {
        ...body,
        slug,
        maxVMs: body.maxVMs ?? 100,
        networkGbps: body.networkGbps ?? 1,
        ipRanges: JSON.stringify(body.ipRanges ?? []),
        status: 'ONLINE',
      },
      include: { region: true },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.node.create',
        resource: 'node',
        resourceId: node.id,
        newValue: JSON.stringify({ name: node.name }),
      },
    })
    res.status(201).json({ data: serializeNode(node) })
  } catch (e) { next(e) }
})

router.get('/nodes/:id', async (req, res, next) => {
  try {
    const node = await prisma.node.findUnique({
      where: { id: req.params.id },
      include: {
        region: true,
        servers: {
          where: { deletedAt: null },
          include: { plan: true, user: { select: { id: true, email: true } } },
        },
      },
    })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    res.json({ data: { ...serializeNode(node), servers: node.servers.map(serializeServer) } })
  } catch (e) { next(e) }
})

router.patch('/nodes/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      maxVMs: z.number().int().optional(),
      isActive: z.boolean().optional(),
      maintenanceNote: z.string().optional(),
      networkGbps: z.number().int().optional(),
      proxmoxTokenSecret: z.string().optional(),
      totalCpu: z.number().int().optional(),
      totalRamGB: z.number().int().optional(),
      totalDiskGB: z.number().int().optional(),
      ipRanges: z.array(z.string()).optional(),
    })
    const body = schema.parse(req.body) as any
    if (body.ipRanges) body.ipRanges = JSON.stringify(body.ipRanges)
    const node = await prisma.node.update({ where: { id: req.params.id }, data: body })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.node.update',
        resource: 'node',
        resourceId: node.id,
        newValue: JSON.stringify(body),
      },
    })
    res.json({ data: serializeNode(node) })
  } catch (e) { next(e) }
})

router.delete('/nodes/:id', async (req: AuthedRequest, res, next) => {
  try {
    const node = await prisma.node.findUnique({ where: { id: req.params.id } })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    if (node.currentVMs > 0) {
      throw new AppError('Cannot delete a node with active VMs', 400, 'NODE_HAS_VMS')
    }
    await prisma.node.delete({ where: { id: req.params.id } })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.node.delete',
        resource: 'node',
        resourceId: node.id,
      },
    })
    res.json({ message: 'Node deleted' })
  } catch (e) { next(e) }
})

router.post('/nodes/:id/test', async (req, res, next) => {
  try {
    const node = await prisma.node.findUnique({ where: { id: req.params.id } })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    const result = await ProxmoxService.testCredentials(
      node.proxmoxHost,
      node.proxmoxNode,
      node.proxmoxTokenId,
      node.proxmoxTokenSecret
    )
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/nodes/:id/sync', async (req, res, next) => {
  try {
    const node = await prisma.node.findUnique({ where: { id: req.params.id } })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    const proxmox = new ProxmoxService(node)
    const vms = await proxmox.getVMList()
    const dbServers = await prisma.server.count({
      where: { nodeId: node.id, deletedAt: null },
    })
    await prisma.node.update({
      where: { id: node.id },
      data: { currentVMs: vms.length, lastSyncAt: new Date() },
    })
    res.json({ data: { proxmoxVms: vms.length, dbServers, discrepancy: vms.length - dbServers } })
  } catch (e) { next(e) }
})

router.post('/nodes/:id/maintenance', async (req: AuthedRequest, res, next) => {
  try {
    const { enabled, note } = z.object({ enabled: z.boolean(), note: z.string().optional() }).parse(req.body)
    const node = await prisma.node.update({
      where: { id: req.params.id },
      data: {
        status: enabled ? 'MAINTENANCE' : 'ONLINE',
        maintenanceNote: enabled ? note || 'Scheduled maintenance' : null,
      },
    })
    res.json({ data: serializeNode(node) })
  } catch (e) { next(e) }
})

router.get('/nodes/:id/vms', async (req, res, next) => {
  try {
    const node = await prisma.node.findUnique({ where: { id: req.params.id } })
    if (!node) throw new AppError('Node not found', 404, 'NOT_FOUND')
    const proxmox = new ProxmoxService(node)
    const vms = await proxmox.getVMList()
    res.json({ data: vms })
  } catch (e) { next(e) }
})

// ─── BILLING ─────────────────────────────────────────────
router.get('/invoices', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10))
    const status = req.query.status as string | undefined
    const userId = req.query.userId as string | undefined
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.invoice.count({ where }),
    ])

    res.json({ data: invoices.map(serializeInvoice), pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

router.get('/invoices/:id', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, balance: true } },
      },
    })
    if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND')
    const txns = await prisma.transaction.findMany({
      where: { invoiceId: inv.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: { ...serializeInvoice(inv), transactions: txns } })
  } catch (e) { next(e) }
})

router.patch('/invoices/:id/mark-paid', async (req: AuthedRequest, res, next) => {
  try {
    const { paymentId, note } = z
      .object({ paymentId: z.string().optional(), note: z.string().optional() })
      .parse(req.body)
    await paymentService.markInvoicePaid(req.params.id, paymentId || `manual-${Date.now()}`, 'manual')
    if (note) {
      await prisma.invoice.update({ where: { id: req.params.id }, data: { notes: note } })
    }
    res.json({ message: 'Invoice marked as paid' })
  } catch (e) { next(e) }
})

router.post('/invoices/:id/refund', async (req: AuthedRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
    await paymentService.processRefund(req.params.id, reason, req.user!.userId)
    res.json({ message: 'Refund processed' })
  } catch (e) { next(e) }
})

// ─── SUPPORT TICKETS ─────────────────────────────────────
router.get('/tickets', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10))
    const status = req.query.status as string | undefined
    const priority = req.query.priority as string | undefined
    const assignedTo = req.query.assignedTo as string | undefined

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    res.json({
      data: tickets.map((t: any) => ({ ...t, sla: slaState(t) })),
      pagination: { page, limit, total },
    })
  } catch (e) { next(e) }
})

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, country: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')
    res.json({ data: { ...ticket, sla: slaState(ticket) } })
  } catch (e) { next(e) }
})

router.post('/tickets/:id/reply', async (req: AuthedRequest, res, next) => {
  try {
    const { content, isInternal } = z
      .object({ content: z.string().min(1), isInternal: z.boolean().optional() })
      .parse(req.body)
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: req.user!.userId,
        authorRole: 'admin',
        content,
        isInternal: !!isInternal,
      },
    })

    const dataUpdate: any = { updatedAt: new Date() }
    if (!ticket.firstReplyAt && !isInternal) dataUpdate.firstReplyAt = new Date()
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: dataUpdate })

    if (!isInternal) {
      await emailService.sendTicketReply(ticket.user, ticket.subject, content).catch(() => {})
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: 'ticket_reply',
          title: 'New reply on your ticket',
          message: ticket.subject,
          link: `/dashboard/tickets/${ticket.id}`,
        },
      })
    }

    res.status(201).json({ data: message })
  } catch (e) { next(e) }
})

router.patch('/tickets/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
      assignedTo: z.string().nullable().optional(),
      category: z.string().optional(),
    })
    const body = schema.parse(req.body)
    const data: any = { ...body, updatedAt: new Date() }
    if (body.status === 'RESOLVED') data.resolvedAt = new Date()
    if (body.status === 'CLOSED') data.closedAt = new Date()
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data })
    res.json({ data: ticket })
  } catch (e) { next(e) }
})

// ─── INTEGRATIONS ────────────────────────────────────────
router.get('/integrations', async (_req, res, next) => {
  try {
    const configs = await prisma.integrationConfig.findMany({
      where: { key: { not: { startsWith: 'platform.' } } },
      orderBy: { key: 'asc' },
    })
    res.json({ data: configs.map(serializeIntegration) })
  } catch (e) { next(e) }
})

router.patch('/integrations/:key', async (req: AuthedRequest, res, next) => {
  try {
    const { value, isActive } = z
      .object({ value: z.any(), isActive: z.boolean().optional() })
      .parse(req.body)
    const config = await prisma.integrationConfig.upsert({
      where: { key: req.params.key },
      update: { value: JSON.stringify(value), ...(isActive !== undefined && { isActive }), updatedBy: req.user!.userId },
      create: { key: req.params.key, value: JSON.stringify(value), updatedBy: req.user!.userId },
    })
    clearConfigCache()
    res.json({ data: serializeIntegration(config) })
  } catch (e) { next(e) }
})

router.post('/integrations/proxmox/test', async (req, res, next) => {
  try {
    const { host, nodeId, tokenId, tokenSecret } = z
      .object({
        host: z.string().url(),
        nodeId: z.string().min(1),
        tokenId: z.string().min(1),
        tokenSecret: z.string().min(1),
      })
      .parse(req.body)
    const result = await ProxmoxService.testCredentials(host, nodeId, tokenId, tokenSecret)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/cloudflare/test', async (req, res, next) => {
  try {
    const { apiToken, zoneId } = z
      .object({ apiToken: z.string().min(1), zoneId: z.string().min(1) })
      .parse(req.body)
    const result = await CloudflareService.testCredentials(apiToken, zoneId)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/grafana/test', async (req, res, next) => {
  try {
    const { url, apiKey } = z.object({ url: z.string().url(), apiKey: z.string().min(1) }).parse(req.body)
    const result = await GrafanaService.testCredentials(url, apiKey)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/zabbix/test', async (req, res, next) => {
  try {
    const { url, user, password } = z
      .object({ url: z.string().url(), user: z.string().min(1), password: z.string().min(1) })
      .parse(req.body)
    const result = await ZabbixService.testCredentials(url, user, password)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/email/test', async (req, res, next) => {
  try {
    const { apiKey, to } = z
      .object({ apiKey: z.string().min(1), to: z.string().email() })
      .parse(req.body)
    const result = await EmailService.testCredentials(apiKey, to)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/sms/test', async (req, res, next) => {
  try {
    const { provider, config, to } = z
      .object({ provider: z.string().min(1), config: z.any(), to: z.string().min(5) })
      .parse(req.body)
    const result = await SmsService.testCredentials(provider, config, to)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/razorpay/test', async (req, res, next) => {
  try {
    const { keyId, keySecret } = z
      .object({ keyId: z.string().min(1), keySecret: z.string().min(1) })
      .parse(req.body)
    const result = await PaymentService.testRazorpay(keyId, keySecret)
    res.json({ data: result })
  } catch (e) { next(e) }
})

router.post('/integrations/stripe/test', async (req, res, next) => {
  try {
    const { secretKey } = z.object({ secretKey: z.string().min(1) }).parse(req.body)
    const result = await PaymentService.testStripe(secretKey)
    res.json({ data: result })
  } catch (e) { next(e) }
})

// ─── ROLES ───────────────────────────────────────────────
router.get('/roles', async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ data: roles.map(serializeRole) })
  } catch (e) { next(e) }
})

router.post('/roles', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).regex(/^[a-z_]+$/),
      displayName: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    })
    const body = schema.parse(req.body)
    const role = await prisma.role.create({
      data: { ...body, permissions: JSON.stringify(body.permissions) },
    })
    res.status(201).json({ data: serializeRole(role) })
  } catch (e) { next(e) }
})

router.patch('/roles/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      displayName: z.string().optional(),
      description: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    })
    const body = schema.parse(req.body) as any
    if (body.permissions) body.permissions = JSON.stringify(body.permissions)
    const role = await prisma.role.update({ where: { id: req.params.id }, data: body })
    res.json({ data: serializeRole(role) })
  } catch (e) { next(e) }
})

router.delete('/roles/:id', async (req, res, next) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { assignments: true } } },
    })
    if (!role) throw new AppError('Role not found', 404, 'NOT_FOUND')
    if (role.isSystem) throw new AppError('Cannot delete system role', 400, 'IS_SYSTEM')
    if (role._count.assignments > 0) {
      throw new AppError('Cannot delete role with assigned users', 400, 'HAS_ASSIGNMENTS')
    }
    await prisma.role.delete({ where: { id: role.id } })
    res.json({ message: 'Role deleted' })
  } catch (e) { next(e) }
})

router.post('/users/:id/roles', async (req: AuthedRequest, res, next) => {
  try {
    const { roleId, expiresAt } = z
      .object({ roleId: z.string().min(1), expiresAt: z.string().datetime().optional() })
      .parse(req.body)
    const assignment = await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: req.params.id, roleId } },
      update: { grantedBy: req.user!.userId, expiresAt: expiresAt ? new Date(expiresAt) : null },
      create: {
        userId: req.params.id,
        roleId,
        grantedBy: req.user!.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    res.status(201).json({ data: assignment })
  } catch (e) { next(e) }
})

router.delete('/users/:id/roles/:roleId', async (req, res, next) => {
  try {
    await prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId: req.params.id, roleId: req.params.roleId } },
    })
    res.json({ message: 'Role removed' })
  } catch (e) { next(e) }
})

// ─── ANNOUNCEMENTS ───────────────────────────────────────
router.get('/announcements', async (_req, res, next) => {
  try {
    const items = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ data: items.map(serializeAnnouncement) })
  } catch (e) { next(e) }
})

router.post('/announcements', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.enum(['info', 'warning', 'maintenance']).optional(),
      targetAll: z.boolean().optional(),
      targetRoles: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
    })
    const body = schema.parse(req.body)
    const item = await prisma.announcement.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type ?? 'info',
        targetAll: body.targetAll ?? true,
        targetRoles: JSON.stringify(body.targetRoles ?? []),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: serializeAnnouncement(item) })
  } catch (e) { next(e) }
})

router.patch('/announcements/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      message: z.string().optional(),
      type: z.enum(['info', 'warning', 'maintenance']).optional(),
      isActive: z.boolean().optional(),
      targetAll: z.boolean().optional(),
      targetRoles: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().nullable().optional(),
    })
    const body = schema.parse(req.body) as any
    if (body.targetRoles) body.targetRoles = JSON.stringify(body.targetRoles)
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt)
    const item = await prisma.announcement.update({ where: { id: req.params.id }, data: body })
    res.json({ data: serializeAnnouncement(item) })
  } catch (e) { next(e) }
})

router.delete('/announcements/:id', async (req, res, next) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } })
    res.json({ message: 'Announcement deleted' })
  } catch (e) { next(e) }
})

// ─── AUDIT LOGS ──────────────────────────────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(200, parseInt((req.query.limit as string) || '50', 10))
    const userId = req.query.userId as string | undefined
    const action = req.query.action as string | undefined
    const resource = req.query.resource as string | undefined
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    const where: any = {}
    if (userId) where.userId = userId
    if (action) where.action = { contains: action }
    if (resource) where.resource = resource
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({ data: logs.map(serializeAudit), pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

// ─── PLATFORM SETTINGS ───────────────────────────────────
router.get('/settings', async (_req, res, next) => {
  try {
    const configs = await prisma.integrationConfig.findMany({
      where: { key: { startsWith: 'platform.' } },
    })
    res.json({ data: configs.map(serializeIntegration) })
  } catch (e) { next(e) }
})

router.patch('/settings', async (req: AuthedRequest, res, next) => {
  try {
    const { key, value } = z.object({ key: z.string().min(1), value: z.any() }).parse(req.body)
    const fullKey = key.startsWith('platform.') ? key : `platform.${key}`
    const config = await prisma.integrationConfig.upsert({
      where: { key: fullKey },
      update: { value: JSON.stringify(value), updatedBy: req.user!.userId },
      create: { key: fullKey, value: JSON.stringify(value), updatedBy: req.user!.userId },
    })
    clearConfigCache()
    res.json({ data: serializeIntegration(config) })
  } catch (e) { next(e) }
})

// ─── EMAIL TEMPLATES ─────────────────────────────────────
router.get('/email-templates', async (_req, res, next) => {
  try {
    const items = await prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } })
    res.json({ data: items.map(serializeEmailTemplate) })
  } catch (e) { next(e) }
})

router.post('/email-templates', async (req, res, next) => {
  try {
    const schema = z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      subject: z.string().min(1),
      htmlBody: z.string().min(1),
      variables: z.array(z.string()).optional(),
    })
    const body = schema.parse(req.body)
    const item = await prisma.emailTemplate.create({
      data: { ...body, variables: JSON.stringify(body.variables ?? []) },
    })
    res.status(201).json({ data: serializeEmailTemplate(item) })
  } catch (e) { next(e) }
})

router.patch('/email-templates/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      subject: z.string().optional(),
      htmlBody: z.string().optional(),
      variables: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
    const body = schema.parse(req.body) as any
    if (body.variables) body.variables = JSON.stringify(body.variables)
    const item = await prisma.emailTemplate.update({ where: { id: req.params.id }, data: body })
    res.json({ data: serializeEmailTemplate(item) })
  } catch (e) { next(e) }
})

router.post('/email-templates/:id/test', async (req, res, next) => {
  try {
    const { to } = z.object({ to: z.string().email() }).parse(req.body)
    const tpl = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } })
    if (!tpl) throw new AppError('Template not found', 404, 'NOT_FOUND')
    await emailService.sendCustomEmail(to, `[Test] ${tpl.subject}`, tpl.htmlBody)
    res.json({ message: 'Test email sent' })
  } catch (e) { next(e) }
})

// ─── SMS TEMPLATES ───────────────────────────────────────
router.get('/sms-templates', async (_req, res, next) => {
  try {
    const items = await prisma.smsTemplate.findMany({ orderBy: { name: 'asc' } })
    res.json({ data: items.map(serializeSmsTemplate) })
  } catch (e) { next(e) }
})

router.post('/sms-templates', async (req, res, next) => {
  try {
    const schema = z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      body: z.string().min(1),
      variables: z.array(z.string()).optional(),
    })
    const body = schema.parse(req.body)
    const item = await prisma.smsTemplate.create({
      data: { ...body, variables: JSON.stringify(body.variables ?? []) },
    })
    res.status(201).json({ data: serializeSmsTemplate(item) })
  } catch (e) { next(e) }
})

router.patch('/sms-templates/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      body: z.string().optional(),
      variables: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
    const body = schema.parse(req.body) as any
    if (body.variables) body.variables = JSON.stringify(body.variables)
    const item = await prisma.smsTemplate.update({ where: { id: req.params.id }, data: body })
    res.json({ data: serializeSmsTemplate(item) })
  } catch (e) { next(e) }
})

router.post('/sms-templates/:id/test', async (req, res, next) => {
  try {
    const { to } = z.object({ to: z.string().min(5) }).parse(req.body)
    const tpl = await prisma.smsTemplate.findUnique({ where: { id: req.params.id } })
    if (!tpl) throw new AppError('Template not found', 404, 'NOT_FOUND')
    await smsService.send(to, tpl.body)
    res.json({ message: 'Test SMS sent' })
  } catch (e) { next(e) }
})

export default router
