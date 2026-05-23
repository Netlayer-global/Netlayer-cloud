import { customAlphabet } from 'nanoid'
import prisma from '../utils/prisma'
import { ProxmoxService } from './proxmox.service'
import cloudflare from './cloudflare.service'
import emailService from './email.service'
import smsService from './sms.service'
import grafanaService from './grafana.service'
import zabbixService from './zabbix.service'
import nodeSelector from './nodeSelector.service'
import fastDeployService from './fastDeploy.service'
import { emitServerStatus, emitToAdmin } from './socket.service'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'
import { startWorkflow } from '../workflows/engine'
import { DeployServerWorkflow } from '../workflows/deployServer.workflow'
import { computeTax } from './tax.service'

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)
const passwordNano = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%',
  16
)

export interface DeployConfig {
  name: string
  planId: string
  regionId: string
  osTemplateId: string
  sshKeyId?: string
  rootPassword?: string
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const addMonths = (d: Date, n: number) => {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

export class ServerService {
  async deployServer(userId: string, config: DeployConfig) {
    // 1. User must be active
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    if (user.status !== 'ACTIVE') throw new AppError('Account not active', 403, 'FORBIDDEN')

    // 2. Validate plan, region, os
    const [plan, region, os] = await Promise.all([
      prisma.plan.findUnique({ where: { id: config.planId } }),
      prisma.region.findUnique({ where: { id: config.regionId } }),
      prisma.osTemplate.findUnique({ where: { id: config.osTemplateId } }),
    ])
    if (!plan?.isActive) throw new AppError('Plan not available', 400, 'INVALID_PLAN')
    if (!region?.isActive) throw new AppError('Region not available', 400, 'INVALID_REGION')
    if (!os?.isActive) throw new AppError('OS not available', 400, 'INVALID_OS')

    // 3. Balance check — prepaid wallet must cover the first hour with tax.
    // We bill hourly and the agent meters real consumption afterwards; the
    // first-hour debit acts as an anti-abuse deposit.
    const firstHourSubtotal = Number(plan.priceHourly.toFixed(2))
    const taxRes = computeTax({
      amount: firstHourSubtotal,
      country: user.country || 'IN',
      gstNumber: user.gstNumber || undefined,
      vatNumber: user.vatNumber || undefined,
    })
    const taxAmount = taxRes.total
    const firstHourTotal = Number((firstHourSubtotal + taxAmount).toFixed(2))

    // Honour platform credit limit — users can carry a small negative balance
    // (e.g. enterprise customers on net-30) but everyone else must be at zero+.
    const minRequired = firstHourTotal
    const effectiveBalance = user.balance + (user.creditLimit || 0)
    if (effectiveBalance < minRequired) {
      const shortfall = Number((minRequired - effectiveBalance).toFixed(2))
      throw new AppError(
        `Insufficient balance. Add ${user.currency} ${shortfall.toFixed(2)} to deploy this plan.`,
        402,
        'INSUFFICIENT_BALANCE'
      )
    }

    // 4. Optional SSH key
    let sshPublicKey: string | undefined
    if (config.sshKeyId) {
      const key = await prisma.sshKey.findFirst({ where: { id: config.sshKeyId, userId } })
      if (!key) throw new AppError('SSH key not found', 404, 'NOT_FOUND')
      sshPublicKey = key.publicKey
    }

    // 5. Pick the best node
    const node = await nodeSelector.selectBestNode(region.id, plan.cpu, plan.ramGB, plan.diskGB)

    // 6. Hostname + password
    const domain = process.env.CLOUDFLARE_DOMAIN || 'netlayer.com'
    const hostname = `srv-${nano()}.${domain}`
    const rootPassword = config.rootPassword || passwordNano()

    // 7. Charge the first hour atomically: debit balance, create a PAID
    // invoice covering the first hour, write a Transaction. The whole thing
    // is a Prisma $transaction so a partial debit can never happen.
    const balanceBefore = user.balance
    const balanceAfter = Number((balanceBefore - firstHourTotal).toFixed(2))

    const [, invoice] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: balanceAfter },
      }),
      prisma.invoice.create({
        data: {
          userId: user.id,
          amount: firstHourSubtotal,
          tax: taxAmount,
          taxBreakdown: JSON.stringify(taxRes),
          total: firstHourTotal,
          currency: user.currency,
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: 'wallet',
          dueDate: new Date(),
          items: JSON.stringify([
            {
              description: `${plan.name} · 1 hour · ${region.city}`,
              qty: 1,
              unitPrice: firstHourSubtotal,
              total: firstHourSubtotal,
            },
          ]),
          notes: 'First-hour deposit. Hourly metering begins after deploy completes.',
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'debit',
          amount: firstHourTotal,
          currency: user.currency,
          description: `Deploy ${plan.name} in ${region.city} — first hour`,
          balanceBefore,
          balanceAfter,
        },
      }),
    ])

    // 8. Create server DB row (PENDING) — invoice is already paid before
    // any provisioning side-effect runs.
    const server = await prisma.server.create({
      data: {
        userId,
        nodeId: node.id,
        name: config.name,
        hostname,
        planId: plan.id,
        regionId: region.id,
        osTemplateId: os.id,
        status: 'PENDING',
        rootPassword,
        specs: JSON.stringify({ cpu: plan.cpu, ram: plan.ramGB, disk: plan.diskGB }),
        bandwidth: JSON.stringify({ used: 0, limit: plan.bandwidthTB * 1000 }),
        nextBillDate: new Date(Date.now() + 3600_000),
      },
      include: { plan: true, region: true, osTemplate: true, node: true },
    })

    // Link the prepaid invoice to the server it covers
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { notes: `${invoice.notes || ''}\nServer: ${server.id}` },
    }).catch(() => {})

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'server.deploy_requested',
        resource: 'server',
        resourceId: server.id,
        newValue: JSON.stringify({ name: config.name, plan: plan.name, region: region.city, firstHourTotal }),
      },
    })

    emitServerStatus(server.id, { status: 'PENDING' })
    emitToAdmin('admin:server_deployed', { serverId: server.id, userId })

    // 7. Hand off to the fast-deploy pipeline. Targets ~30s in production
    // and a realistic ~10s in mock mode. The pipeline emits granular
    // Socket.io events at every step which the DeployProgress overlay
    // listens to. On hard failure we fall back to the durable workflow
    // engine so the request still eventually succeeds.
    setImmediate(() => {
      fastDeployService
        .deploy({
          serverId: server.id,
          userId,
          hostname,
          rootPassword,
          sshPublicKey,
        })
        .catch((err) => {
          logger.warn(
            { err: err.message, serverId: server.id },
            'fast deploy failed — handing off to durable workflow'
          )
          // Reset to PENDING so the workflow can take over without surfacing
          // the transient error to the user.
          prisma.server
            .update({ where: { id: server.id }, data: { status: 'PENDING' } })
            .catch(() => {})
          startWorkflow(DeployServerWorkflow, {
            id: `deploy-${server.id}`,
            resourceId: server.id,
            context: {
              serverId: server.id,
              userId,
              hostname,
              rootPassword,
              sshPublicKey,
            },
          }).catch((err2) => {
            logger.error({ err: err2, serverId: server.id }, 'fallback workflow also failed')
          })
        })
    })

    return server
  }

  async destroyServer(serverId: string, userId: string, isAdmin = false): Promise<void> {
    const where: any = { id: serverId, deletedAt: null }
    if (!isAdmin) where.userId = userId

    const server = await prisma.server.findFirst({
      where,
      include: { node: true, user: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'DELETING' },
    })
    emitServerStatus(serverId, { status: 'DELETING' })

    if (server.node && server.proxmoxVmId) {
      try {
        const proxmox = new ProxmoxService(server.node)
        await proxmox.deleteVM(server.proxmoxVmId)
      } catch (e: any) {
        logger.error('Proxmox delete failed (continuing)', { error: e.message })
      }
    }

    if (server.dnsRecordId) {
      try {
        await cloudflare.deleteRecord(server.dnsRecordId)
      } catch (e: any) {
        logger.warn('Cloudflare DNS delete failed', { error: e.message })
      }
    }

    if (server.zabbixHostId) {
      try {
        await zabbixService.deleteHost(server.zabbixHostId)
      } catch (e: any) {
        logger.warn('Zabbix host delete failed', { error: e.message })
      }
    }

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'DELETED', deletedAt: new Date() },
    })

    if (server.node) {
      const specs = (() => {
        try { return JSON.parse(server.specs) } catch { return { cpu: 0, ram: 0, disk: 0 } }
      })()
      await prisma.node.update({
        where: { id: server.node.id },
        data: {
          usedCpu: { decrement: specs.cpu || 0 },
          usedRamGB: { decrement: specs.ram || 0 },
          usedDiskGB: { decrement: specs.disk || 0 },
          currentVMs: { decrement: 1 },
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: isAdmin ? userId : server.userId,
        action: isAdmin ? 'server.admin_deleted' : 'server.deleted',
        resource: 'server',
        resourceId: serverId,
        oldValue: JSON.stringify({ name: server.name }),
      },
    })

    try {
      await emailService.sendServerDeleted(server.user, server.name)
    } catch (e: any) {
      logger.warn('server deleted email failed', { error: e.message })
    }

    emitServerStatus(serverId, { status: 'DELETED' })
  }

  async powerAction(
    serverId: string,
    action: 'start' | 'stop' | 'restart',
    userId: string,
    isAdmin = false
  ) {
    const where: any = { id: serverId, deletedAt: null }
    if (!isAdmin) where.userId = userId

    const server = await prisma.server.findFirst({ where, include: { node: true } })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (!server.node || !server.proxmoxVmId) {
      throw new AppError('Server not provisioned yet', 400, 'NOT_READY')
    }

    const proxmox = new ProxmoxService(server.node)
    const proxAction = action === 'restart' ? 'reset' : action
    await proxmox.powerAction(server.proxmoxVmId, proxAction as any)

    const newStatus = action === 'start' ? 'RUNNING' : action === 'stop' ? 'STOPPED' : 'REBOOTING'
    await prisma.server.update({ where: { id: serverId }, data: { status: newStatus } })
    emitServerStatus(serverId, { status: newStatus })

    await prisma.auditLog.create({
      data: {
        userId,
        action: `server.power.${action}`,
        resource: 'server',
        resourceId: serverId,
      },
    })

    if (action === 'restart') {
      setTimeout(async () => {
        await prisma.server.update({ where: { id: serverId }, data: { status: 'RUNNING' } }).catch(() => {})
        emitServerStatus(serverId, { status: 'RUNNING' })
      }, 5000)
    }
  }

  async rebuildServer(
    serverId: string,
    userId: string,
    osTemplateId: string,
    rootPassword: string
  ) {
    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const os = await prisma.osTemplate.findUnique({ where: { id: osTemplateId } })
    if (!os?.isActive) throw new AppError('OS not available', 400, 'INVALID_OS')

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'BUILDING', osTemplateId, rootPassword },
    })
    emitServerStatus(serverId, { status: 'BUILDING' })

    setTimeout(async () => {
      await prisma.server.update({ where: { id: serverId }, data: { status: 'RUNNING' } }).catch(() => {})
      emitServerStatus(serverId, { status: 'RUNNING' })
    }, 4000)
  }

  async getMetrics(serverId: string, userId: string, range: string, isAdmin = false) {
    const where: any = { id: serverId, deletedAt: null }
    if (!isAdmin) where.userId = userId
    const server = await prisma.server.findFirst({ where })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    return grafanaService.getServerMetrics(server.ipv4 || server.hostname, range)
  }

  async createSnapshot(serverId: string, userId: string, name: string) {
    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
      include: { node: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const snapshot = await prisma.serverSnapshot.create({
      data: {
        serverId,
        name,
        status: 'creating',
      },
    })

    if (server.node && server.proxmoxVmId) {
      try {
        const proxmox = new ProxmoxService(server.node)
        await proxmox.createSnapshot(server.proxmoxVmId, name.replace(/\s+/g, '_'))
        await prisma.serverSnapshot.update({
          where: { id: snapshot.id },
          data: { status: 'ready', size: 0 },
        })
      } catch (e: any) {
        await prisma.serverSnapshot.update({
          where: { id: snapshot.id },
          data: { status: 'error' },
        })
        throw new AppError(`Snapshot failed: ${e.message}`, 500, 'SNAPSHOT_FAILED')
      }
    }
    return snapshot
  }

  async deleteSnapshot(serverId: string, userId: string, snapshotId: string) {
    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
      include: { node: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const snapshot = await prisma.serverSnapshot.findFirst({
      where: { id: snapshotId, serverId },
    })
    if (!snapshot) throw new AppError('Snapshot not found', 404, 'NOT_FOUND')

    if (server.node && server.proxmoxVmId) {
      try {
        const proxmox = new ProxmoxService(server.node)
        await proxmox.deleteSnapshot(server.proxmoxVmId, snapshot.name.replace(/\s+/g, '_'))
      } catch (e: any) {
        logger.warn('Proxmox snapshot delete failed', { error: e.message })
      }
    }

    await prisma.serverSnapshot.delete({ where: { id: snapshotId } })
  }

  async migrateServer(serverId: string, targetNodeId: string, adminId: string) {
    const server = await prisma.server.findFirst({
      where: { id: serverId, deletedAt: null },
      include: { node: true, plan: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (!server.node || !server.proxmoxVmId) throw new AppError('Server not provisioned', 400, 'NOT_READY')

    const target = await prisma.node.findUnique({ where: { id: targetNodeId } })
    if (!target) throw new AppError('Target node not found', 404, 'NOT_FOUND')
    if (target.id === server.nodeId) throw new AppError('Already on this node', 400, 'SAME_NODE')

    const proxmox = new ProxmoxService(server.node)
    await proxmox.migrateVM(server.proxmoxVmId, target.proxmoxNode)

    const specs = (() => {
      try { return JSON.parse(server.specs) } catch { return { cpu: 0, ram: 0, disk: 0 } }
    })()

    await prisma.$transaction([
      prisma.server.update({
        where: { id: serverId },
        data: { nodeId: target.id, proxmoxNode: target.proxmoxNode },
      }),
      prisma.node.update({
        where: { id: server.node.id },
        data: {
          usedCpu: { decrement: specs.cpu || 0 },
          usedRamGB: { decrement: specs.ram || 0 },
          usedDiskGB: { decrement: specs.disk || 0 },
          currentVMs: { decrement: 1 },
        },
      }),
      prisma.node.update({
        where: { id: target.id },
        data: {
          usedCpu: { increment: specs.cpu || 0 },
          usedRamGB: { increment: specs.ram || 0 },
          usedDiskGB: { increment: specs.disk || 0 },
          currentVMs: { increment: 1 },
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'server.migrated',
          resource: 'server',
          resourceId: serverId,
          newValue: JSON.stringify({ from: server.node.name, to: target.name }),
        },
      }),
    ])
  }
}

export default new ServerService()
