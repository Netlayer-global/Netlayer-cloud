import prisma from '../../utils/prisma'
import { ProxmoxService } from '../../services/proxmox.service'
import emailService from '../../services/email.service'
import smsService from '../../services/sms.service'
import { emitServerStatus } from '../../services/socket.service'
import logger from '../../utils/logger'

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

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

      await prisma.user.update({
        where: { id: server.userId },
        data: { balance: { decrement: dailyCharge } },
      })

      await prisma.transaction.create({
        data: {
          userId: server.userId,
          type: 'debit',
          amount: dailyCharge,
          currency: 'INR',
          description: `Daily charge for ${server.name}`,
          balanceBefore: before,
          balanceAfter: after,
        },
      })

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

export async function runMonthlyInvoices(_data: { ts: number }) {
  logger.info('🕐 monthly invoice generation starting')
  const servers = await prisma.server.findMany({
    where: { status: { in: ['RUNNING', 'STOPPED'] }, deletedAt: null },
    include: { user: true, plan: true },
  })

  for (const server of servers) {
    try {
      const invoiceNumber = `INV-${Date.now()}-${server.userId.slice(-4).toUpperCase()}`
      const amount = server.plan.priceInr
      const tax = amount * 0.18
      const total = amount + tax
      const dueDate = addDays(new Date(), 7)

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: server.userId,
          amount,
          tax,
          total,
          currency: 'INR',
          status: 'PENDING',
          items: JSON.stringify([
            { name: server.plan.name, serverId: server.id, qty: 1, price: amount },
          ]),
          dueDate,
        },
      })

      await emailService
        .sendInvoiceCreated(server.user, { id: invoiceNumber, amount, dueDate })
        .catch(() => {})
    } catch (e: any) {
      logger.error({ serverId: server.id, error: e.message }, 'monthly invoice failed')
    }
  }
  logger.info({ count: servers.length }, '✓ monthly invoices created')
}
