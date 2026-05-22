/**
 * Deploy-server workflow.
 *
 * Each step is idempotent: rerunning is safe (keyed off serverId or external
 * provider IDs already stored on the Server row). On failure, completed steps
 * compensate in reverse to release any allocated resources.
 *
 * Step graph:
 *
 *   1. mark_building          (status PENDING → BUILDING, persist proxmoxVmId)
 *   2. create_vm              (Proxmox createVM, idempotent on vmId)
 *   3. await_ip               (poll qemu-guest-agent for IPv4)
 *   4. dns_record             (Cloudflare A record, comp: delete record)
 *   5. mark_running           (status BUILDING → RUNNING, set ipv4)
 *   6. update_node_usage      (increment node usedCpu/Ram/Disk/VMs)
 *   7. create_first_invoice   (idempotent on invoiceNumber)
 *   8. notify                 (email + sms + in-app, best-effort)
 *
 * On any unrecoverable failure: status → ERROR and previously-allocated
 * resources are released by the compensate hooks.
 */

import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { ProxmoxService } from '../services/proxmox.service'
import cloudflare from '../services/cloudflare.service'
import emailService from '../services/email.service'
import smsService from '../services/sms.service'
import zabbixService from '../services/zabbix.service'
import { emitServerStatus } from '../services/socket.service'
import { serverDeployments, serverDeploymentDuration } from '../observability/metrics'
import type { WorkflowDef } from './engine'

const addMonths = (d: Date, n: number) => {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

/** Context passed between steps. Persisted as JSON in WorkflowRun.context. */
export interface DeployCtx {
  serverId: string
  userId: string
  hostname: string
  rootPassword: string
  sshPublicKey?: string
  // resolved during execution
  nodeId?: string
  proxmoxVmId?: number
  ipv4?: string
  dnsRecordId?: string
  zabbixHostId?: string
  startTs?: number
}

export const DeployServerWorkflow: WorkflowDef<DeployCtx> = {
  type: 'deploy_server',
  steps: [
    // ─── 1. mark BUILDING ──────────────────────────────────
    {
      name: 'mark_building',
      run: async (ctx) => {
        ctx.startTs = Date.now()
        const server = await prisma.server.findUnique({ where: { id: ctx.serverId } })
        if (!server) throw new Error('server vanished before deploy could start')
        if (!server.nodeId) throw new Error('server has no nodeId — scheduler did not assign one')
        const proxmox = new ProxmoxService(await loadNode(server.nodeId))
        const vmId = server.proxmoxVmId ?? (await proxmox.getNextVmId())
        await prisma.server.update({
          where: { id: ctx.serverId },
          data: { status: 'BUILDING', proxmoxVmId: vmId },
        })
        emitServerStatus(ctx.serverId, { status: 'BUILDING' })
        return { nodeId: server.nodeId, proxmoxVmId: vmId }
      },
      retry: { maxAttempts: 3, backoffMs: 500 },
    },

    // ─── 2. create the VM on Proxmox ───────────────────────
    {
      name: 'create_vm',
      run: async (ctx) => {
        const server = await prisma.server.findUniqueOrThrow({
          where: { id: ctx.serverId },
          include: { plan: true, osTemplate: true, node: true },
        })
        if (!server.node) throw new Error('node missing')
        const proxmox = new ProxmoxService(server.node)
        await proxmox.createVM({
          vmId: ctx.proxmoxVmId!,
          name: ctx.hostname,
          cpu: server.plan.cpu,
          ramMB: server.plan.ramGB * 1024,
          diskGB: server.plan.diskGB,
          osTemplateId: server.osTemplate.proxmoxId,
          password: ctx.rootPassword,
          sshKey: ctx.sshPublicKey,
        })
      },
      compensate: async (ctx) => {
        if (!ctx.proxmoxVmId || !ctx.nodeId) return
        const proxmox = new ProxmoxService(await loadNode(ctx.nodeId))
        await proxmox.deleteVM(ctx.proxmoxVmId).catch((e) =>
          logger.warn({ err: e.message }, 'compensate.create_vm: delete failed (continuing)')
        )
      },
      retry: { maxAttempts: 2, backoffMs: 2000 },
    },

    // ─── 3. wait for guest agent IP ────────────────────────
    {
      name: 'await_ip',
      run: async (ctx) => {
        const node = await loadNode(ctx.nodeId!)
        const proxmox = new ProxmoxService(node)
        const ip = await proxmox.getVMIP(ctx.proxmoxVmId!)
        if (!ip) throw new Error('no IPv4 from guest agent after retries')
        return { ipv4: ip }
      },
      retry: { maxAttempts: 1 }, // getVMIP already retries internally
    },

    // ─── 4. publish A record ───────────────────────────────
    {
      name: 'dns_record',
      run: async (ctx) => {
        const dns = await cloudflare.createARecord(ctx.hostname, ctx.ipv4!)
        return { dnsRecordId: dns.id }
      },
      compensate: async (ctx) => {
        if (!ctx.dnsRecordId) return
        await cloudflare.deleteRecord(ctx.dnsRecordId).catch((e) =>
          logger.warn({ err: e.message }, 'compensate.dns_record: delete failed')
        )
      },
      retry: { maxAttempts: 3, backoffMs: 1000 },
    },

    // ─── 5. mark RUNNING ───────────────────────────────────
    {
      name: 'mark_running',
      run: async (ctx) => {
        await prisma.server.update({
          where: { id: ctx.serverId },
          data: {
            status: 'RUNNING',
            ipv4: ctx.ipv4,
            dnsRecordId: ctx.dnsRecordId,
            nextBillDate: addMonths(new Date(), 1),
          },
        })
        emitServerStatus(ctx.serverId, { status: 'RUNNING', ipv4: ctx.ipv4 })
      },
      retry: { maxAttempts: 5, backoffMs: 200 },
    },

    // ─── 6. account node usage ─────────────────────────────
    {
      name: 'update_node_usage',
      run: async (ctx) => {
        const server = await prisma.server.findUniqueOrThrow({
          where: { id: ctx.serverId },
          include: { plan: true },
        })
        await prisma.node.update({
          where: { id: ctx.nodeId! },
          data: {
            usedCpu: { increment: server.plan.cpu },
            usedRamGB: { increment: server.plan.ramGB },
            usedDiskGB: { increment: server.plan.diskGB },
            currentVMs: { increment: 1 },
          },
        })
      },
      compensate: async (ctx) => {
        if (!ctx.nodeId) return
        const server = await prisma.server.findUnique({
          where: { id: ctx.serverId },
          include: { plan: true },
        })
        if (!server) return
        await prisma.node.update({
          where: { id: ctx.nodeId },
          data: {
            usedCpu: { decrement: server.plan.cpu },
            usedRamGB: { decrement: server.plan.ramGB },
            usedDiskGB: { decrement: server.plan.diskGB },
            currentVMs: { decrement: 1 },
          },
        }).catch(() => {})
      },
    },

    // ─── 7. first-month invoice (idempotent) ───────────────
    {
      name: 'create_first_invoice',
      run: async (ctx) => {
        const server = await prisma.server.findUniqueOrThrow({
          where: { id: ctx.serverId },
          include: { plan: true, region: true },
        })
        const invoiceNumber = `INV-${ctx.serverId.slice(-12)}-init`
        const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } })
        if (existing) return // idempotent

        const tax = server.plan.priceInr * 0.18
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            userId: ctx.userId,
            amount: server.plan.priceInr,
            tax,
            total: server.plan.priceInr + tax,
            currency: 'INR',
            status: 'PENDING',
            items: JSON.stringify([
              {
                description: `${server.plan.name} — ${server.region.city} (first month)`,
                amount: server.plan.priceInr,
                serverId: ctx.serverId,
              },
            ]),
            dueDate: addDays(new Date(), 7),
          },
        })
      },
    },

    // ─── 8. notify (best-effort, never fails the workflow) ─
    {
      name: 'notify',
      run: async (ctx) => {
        const server = await prisma.server.findUniqueOrThrow({
          where: { id: ctx.serverId },
          include: { plan: true, user: true, region: true },
        })

        await prisma.notification
          .create({
            data: {
              userId: ctx.userId,
              type: 'server_ready',
              title: 'Server ready 🚀',
              message: `${server.name} is running. IP: ${ctx.ipv4}`,
              link: `/dashboard/servers/${ctx.serverId}`,
            },
          })
          .catch(() => {})

        await emailService
          .sendServerReady(server.user, {
            name: server.name,
            ipv4: ctx.ipv4!,
            hostname: ctx.hostname,
            plan: server.plan.name,
          })
          .catch((e) => logger.warn({ err: e.message }, 'notify: email failed'))

        if (server.user.phone) {
          await smsService
            .sendServerReady(server.user.phone, server.name, ctx.ipv4!)
            .catch((e) => logger.warn({ err: e.message }, 'notify: sms failed'))
        }

        try {
          const zHostId = await zabbixService.createHost(ctx.ipv4!, ctx.hostname)
          await prisma.server.update({
            where: { id: ctx.serverId },
            data: { zabbixHostId: zHostId },
          })
        } catch (e: any) {
          logger.warn({ err: e.message }, 'notify: zabbix host registration failed')
        }

        if (ctx.startTs) {
          const dur = (Date.now() - ctx.startTs) / 1000
          serverDeploymentDuration.observe(
            { result: 'success', region: server.region?.slug || 'unknown' },
            dur
          )
        }
        serverDeployments.inc({
          result: 'success',
          region: 'unknown',
          plan: server.plan.name,
        })
      },
      retry: { maxAttempts: 1 },
    },
  ],
}

async function loadNode(nodeId: string) {
  const node = await prisma.node.findUnique({ where: { id: nodeId } })
  if (!node) throw new Error(`node ${nodeId} not found`)
  return node
}
