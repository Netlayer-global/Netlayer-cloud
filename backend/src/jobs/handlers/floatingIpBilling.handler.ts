import prisma from '../../utils/prisma'
import logger from '../../utils/logger'

const FLOATING_IP_PRICE_PER_MONTH = 50  // INR

/**
 * Daily floating-IP billing. Charges each user (₹50/30) per floating IP
 * they hold, regardless of whether the IP is currently assigned. This
 * matches AWS EIP / DO Reserved IP pricing where you pay for the address
 * itself, not the attachment.
 *
 * Idempotency: if the cron fires twice on the same day the user gets
 * double-charged. To prevent that we tag each transaction with a date-keyed
 * reference and skip if a row already exists for today.
 */
export async function floatingIpBillingHandler(): Promise<void> {
  const today = new Date()
  const dateKey = today.toISOString().slice(0, 10)
  const dailyCharge = Number((FLOATING_IP_PRICE_PER_MONTH / 30).toFixed(2))

  // Group floating IPs by user
  const fips = await prisma.floatingIp.findMany({
    where: { status: { in: ['unassigned', 'assigned'] } },
    select: { userId: true },
  })
  if (fips.length === 0) return

  const counts = new Map<string, number>()
  for (const f of fips) counts.set(f.userId, (counts.get(f.userId) || 0) + 1)

  for (const [userId, ipCount] of counts) {
    try {
      const reference = `fip-billing-${dateKey}`
      const already = await prisma.transaction.findFirst({
        where: { userId, reference, type: 'debit' },
        select: { id: true },
      })
      if (already) continue

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) continue

      const charge = Number((ipCount * dailyCharge).toFixed(2))
      const before = user.balance
      const after = Number((before - charge).toFixed(2))

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { balance: after } }),
        prisma.transaction.create({
          data: {
            userId,
            type: 'debit',
            amount: charge,
            currency: user.currency || 'INR',
            description: `Daily charge: ${ipCount} floating IP${ipCount === 1 ? '' : 's'}`,
            reference,
            balanceBefore: before,
            balanceAfter: after,
          },
        }),
      ])

      logger.debug({ userId, ipCount, charge }, 'floating-IP billing processed')
    } catch (err: any) {
      logger.warn({ err: err.message, userId }, 'floating-IP billing failed for user')
    }
  }
}


export async function runFloatingIpBilling(_data?: any) {
  await floatingIpBillingHandler()
}
