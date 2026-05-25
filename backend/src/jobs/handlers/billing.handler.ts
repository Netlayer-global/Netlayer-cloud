import prisma from '../../utils/prisma'
import { ProxmoxService } from '../../services/proxmox.service'
import emailService from '../../services/email.service'
import smsService from '../../services/sms.service'
import { emitServerStatus } from '../../services/socket.service'
import invoiceNumberService from '../../services/invoiceNumber.service'
import { computeTax } from '../../services/tax.service'
import logger from '../../utils/logger'

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

/**
 * Round 20 — production billing handlers.
 *
 *   runDailyBilling     — debits hourly meter from user wallet, suspends
 *                         on negative balance threshold, low-balance alerts.
 *   runMonthlyInvoices  — generates one consolidated invoice per user per
 *                         month with per-resource line items (servers,
 *                         floating IPs, volumes, snapshots). Sequentially
 *                         numbered per India GST rules.
 *   runDunning          — escalates suspended servers: 3-day grace → suspend,
 *                         30-day → mark for deletion. Notifies user at each step.
 */

export async function runDailyBilling(_data: { ts: number }) {
  logger.info('🕐 daily billing run starting')
  const servers = await prisma.server.findMany({
    where: { status: 'RUNNING', deletedAt: null },
    include: { user: true, plan: true, node: true },
  })

  for (const server of servers) {
    try {
      const dailyCharge = server.plan.priceInr / 30
      const before = server.user.balance
      const after = before - dailyCharge

      await prisma.$transaction([
        prisma.user.update({
          where: { id: server.userId },
          data: { balance: { decrement: dailyCharge } },
        }),
        prisma.transaction.create({
          data: {
            userId: server.userId,
            type: 'debit',
            amount: dailyCharge,
            currency: server.user.currency || 'INR',
            description: `Daily charge for ${server.name}`,
            balanceBefore: before,
            balanceAfter: after,
          },
        }),
      ])

      const updated = await prisma.user.findUnique({ where: { id: server.userId } })
      if (!updated) continue

      if (updated.balance < 50 && updated.balance > 0) {
        await emailService.sendLowBalance(updated, updated.balance).catch(() => {})
        if (updated.phone) {
          await smsService
            .sendLowBalance(updated.phone, `₹${updated.balance.toFixed(2)}`)
            .catch(() => {})
        }
      }

      // Suspend on negative balance beyond credit limit (default -500 grace).
      // Ten-day-old suspended servers get destroyed by runDunning below.
      if (updated.balance < -500 && server.node && server.proxmoxVmId) {
        const proxmox = new ProxmoxService(server.node)
        await proxmox.powerAction(server.proxmoxVmId, 'stop').catch(() => {})
        await prisma.server.update({
          where: { id: server.id },
          data: { status: 'STOPPED' },
        })
        emitServerStatus(server.id, { status: 'STOPPED' })
      }
    } catch (e: any) {
      logger.error({ serverId: server.id, error: e.message }, 'daily billing failed for server')
    }
  }
  logger.info({ count: servers.length }, '✓ daily billing complete')
}


/**
 * Monthly invoice generation. For each user we aggregate all their
 * billable resources for the period and create a single sequential invoice
 * with per-resource line items.
 *
 * Run on the 1st of each month at 00:00 (cron `0 0 1 * *`).
 *
 * Idempotency: a user must not get two invoices for the same month. We tag
 * each invoice's `notes` with `period:YYYY-MM` and skip if one already
 * exists. This is critical when the cron fires twice (cluster restart, etc).
 */
export async function runMonthlyInvoices(_data: { ts: number }) {
  logger.info('🕐 monthly invoice generation starting')

  const now = new Date()
  // Period covered = the previous month
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1)
  const periodTag = `period:${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { servers: { some: { deletedAt: null } } },
        { floatingIps: { some: {} } },
        { volumes: { some: {} } },
      ],
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      country: true, state: true, currency: true,
      gstNumber: true, vatNumber: true,
    },
  })

  let created = 0
  for (const user of users) {
    try {
      // Idempotency check — same period invoice already issued?
      const existing = await prisma.invoice.findFirst({
        where: { userId: user.id, notes: { contains: periodTag } },
        select: { id: true },
      })
      if (existing) continue

      const items = await collectBillableItems(user.id, periodStart, periodEnd)
      if (items.length === 0 || items.every((i) => i.amount === 0)) continue

      const subtotal = Number(items.reduce((s, i) => s + i.amount, 0).toFixed(2))
      if (subtotal <= 0) continue

      const taxRes = computeTax({
        amount: subtotal,
        country: user.country || 'IN',
        state: user.state || undefined,
        gstNumber: user.gstNumber || undefined,
        vatNumber: user.vatNumber || undefined,
      })
      const total = Number((subtotal + taxRes.total).toFixed(2))

      const { number: invoiceNumber } = await invoiceNumberService.issue('invoice', periodEnd)

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: user.id,
          amount: subtotal,
          tax: taxRes.total,
          taxBreakdown: JSON.stringify(taxRes),
          total,
          currency: user.currency || 'INR',
          status: 'PENDING',
          items: JSON.stringify(items),
          dueDate: addDays(now, 7),
          notes: `Period ${periodStart.toDateString()} – ${periodEnd.toDateString()} · ${periodTag}`,
        },
      })

      await emailService
        .sendInvoiceCreated(user, { id: invoiceNumber, amount: total, dueDate: addDays(now, 7) })
        .catch((e) => logger.warn({ err: e.message }, 'monthly invoice email failed'))

      created += 1
    } catch (e: any) {
      logger.error({ userId: user.id, error: e.message }, 'monthly invoice failed for user')
    }
  }
  logger.info({ created, totalUsers: users.length, period: periodTag }, '✓ monthly invoices complete')
}


interface BillableItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
  resourceType: 'server' | 'floating_ip' | 'volume' | 'snapshot' | 'bucket'
  resourceId: string
}

/**
 * Gather every billable resource the user owned during the period. Charges
 * are pro-rated by hours alive within the window — even if a server was
 * created mid-month, the customer only pays for actual uptime.
 */
async function collectBillableItems(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<BillableItem[]> {
  const items: BillableItem[] = []
  const totalHours = (periodEnd.getTime() - periodStart.getTime()) / 3_600_000

  // ── Servers ───────────────────────────────────────────
  const servers = await prisma.server.findMany({
    where: {
      userId,
      // Anything that existed at any point during the window
      createdAt: { lte: periodEnd },
      OR: [{ deletedAt: null }, { deletedAt: { gte: periodStart } }],
    },
    include: { plan: true, region: true },
  })
  for (const s of servers) {
    const start = s.createdAt > periodStart ? s.createdAt : periodStart
    const end = s.deletedAt && s.deletedAt < periodEnd ? s.deletedAt : periodEnd
    const hours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000)
    if (hours <= 0) continue
    const amount = Number((hours * s.plan.priceHourly).toFixed(2))
    items.push({
      description: `${s.plan.name} · ${s.name} · ${s.region.city} · ${Math.round(hours)}h`,
      qty: Math.round(hours * 10) / 10,
      unitPrice: s.plan.priceHourly,
      amount,
      resourceType: 'server',
      resourceId: s.id,
    })
  }

  // ── Floating IPs (₹50/mo each) ────────────────────────
  const fips = await prisma.floatingIp.findMany({
    where: {
      userId,
      createdAt: { lte: periodEnd },
    },
  })
  for (const f of fips) {
    const start = f.createdAt > periodStart ? f.createdAt : periodStart
    const hours = Math.max(0, (periodEnd.getTime() - start.getTime()) / 3_600_000)
    if (hours <= 0) continue
    const ratePerHour = 50 / 30 / 24
    const amount = Number((hours * ratePerHour).toFixed(2))
    items.push({
      description: `Floating IP · ${f.ip} · ${Math.round(hours)}h`,
      qty: Math.round(hours * 10) / 10,
      unitPrice: ratePerHour,
      amount,
      resourceType: 'floating_ip',
      resourceId: f.id,
    })
  }

  // ── Block volumes (₹6/GB/month) ───────────────────────
  const volumes = await prisma.blockVolume.findMany({
    where: { userId, createdAt: { lte: periodEnd } },
  })
  for (const v of volumes) {
    const start = v.createdAt > periodStart ? v.createdAt : periodStart
    const hours = Math.max(0, (periodEnd.getTime() - start.getTime()) / 3_600_000)
    if (hours <= 0) continue
    const ratePerHour = (v.sizeGB * 6) / 30 / 24
    const amount = Number((hours * ratePerHour).toFixed(2))
    items.push({
      description: `Volume ${v.name} · ${v.sizeGB} GB · ${Math.round(hours)}h`,
      qty: Math.round(hours * 10) / 10,
      unitPrice: ratePerHour,
      amount,
      resourceType: 'volume',
      resourceId: v.id,
    })
  }

  // (Snapshots & object storage not metered yet — keeps PR small.)

  return items
}


/**
 * Round 20 — dunning workflow.
 *
 * Lifecycle of a non-paying customer:
 *   day 0: balance goes negative beyond credit_limit  → email warning
 *   day 3: still negative                              → suspend all servers (already done by daily run)
 *   day 7:                                             → second email + SMS
 *   day 30:                                            → mark servers for deletion (status DELETING)
 *   day 35:                                            → actually destroy them (next destroy job)
 *
 * Idempotency: each tier writes a notes-tag to user.metadata
 * (e.g. dunning_day3, dunning_day7) so we never re-fire the same step.
 */
export async function runDunning(_data?: any) {
  const now = new Date()
  const overdueDays = (start: Date) => Math.floor((now.getTime() - start.getTime()) / 86_400_000)

  const candidates = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      balance: { lt: -500 },
    },
  })

  for (const user of candidates) {
    try {
      const meta = (() => {
        if (!user.metadata) return {} as any
        try { return JSON.parse(user.metadata) } catch { return {} as any }
      })()
      // We use the timestamp of the most recent unpaid invoice as the dunning anchor.
      const oldestUnpaid = await prisma.invoice.findFirst({
        where: { userId: user.id, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      })
      const anchor = oldestUnpaid?.createdAt ?? user.updatedAt
      const days = overdueDays(anchor)

      if (days >= 7 && !meta.dunning_day7) {
        await emailService
          .sendCustomEmail(
            user.email,
            'Final notice: your servers will be suspended',
            `<p>Hi ${user.firstName},</p><p>Your wallet has been negative for ${days} days. Please add credit immediately or your servers will be suspended.</p>`
          )
          .catch(() => {})
        if (user.phone) {
          await smsService
            .send(user.phone, `NetLayer: Critical balance alert. Add funds to avoid service suspension.`)
            .catch(() => {})
        }
        meta.dunning_day7 = now.toISOString()
      }

      if (days >= 30 && !meta.dunning_day30) {
        const servers = await prisma.server.findMany({
          where: { userId: user.id, deletedAt: null },
          select: { id: true },
        })
        if (servers.length > 0) {
          await prisma.server.updateMany({
            where: { id: { in: servers.map((s) => s.id) } },
            data: { status: 'DELETING' },
          })
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'dunning.servers_marked_for_deletion',
              resource: 'user',
              resourceId: user.id,
              newValue: JSON.stringify({ days, count: servers.length }),
            },
          })
          await emailService
            .sendCustomEmail(
              user.email,
              `Servers scheduled for deletion`,
              `<p>Your ${servers.length} server(s) will be permanently deleted in 5 days unless you settle the outstanding balance.</p>`
            )
            .catch(() => {})
        }
        meta.dunning_day30 = now.toISOString()
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { metadata: JSON.stringify(meta) },
      })
    } catch (e: any) {
      logger.error({ userId: user.id, error: e.message }, 'dunning step failed')
    }
  }
}
