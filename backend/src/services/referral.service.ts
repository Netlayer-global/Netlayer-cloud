import crypto from 'crypto'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const REWARD_AMOUNT = 250 // INR; MVP — operator can edit later via settings
const TRIGGER_AMOUNT = 100 // referee must spend this before reward kicks in

const generateCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase()

export class ReferralService {
  /**
   * Ensure the user has a referral code, generating + persisting one
   * lazily on first read.
   */
  async getOrCreateCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    if (user.referralCode) return user.referralCode

    // Lock-free retry loop in case of collision
    for (let i = 0; i < 5; i++) {
      const code = generateCode()
      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
        })
        return updated.referralCode!
      } catch (e: any) {
        if (e.code === 'P2002') continue
        throw e
      }
    }
    throw new AppError('Failed to allocate referral code', 500, 'CODE_ALLOC_FAILED')
  }

  async dashboard(userId: string) {
    const code = await this.getOrCreateCode(userId)

    const [referrals, paid, pending] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referee: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.aggregate({
        where: { referrerId: userId, status: 'rewarded' },
        _sum: { reward: true },
      }),
      prisma.referral.aggregate({
        where: { referrerId: userId, status: 'pending' },
        _count: { _all: true },
      }),
    ])

    return {
      code,
      rewardPerReferral: REWARD_AMOUNT,
      triggerAmount: TRIGGER_AMOUNT,
      stats: {
        total: referrals.length,
        rewarded: referrals.filter((r) => r.status === 'rewarded').length,
        pending: pending._count._all,
        totalEarned: paid._sum.reward || 0,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        reward: r.reward,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
        referee: r.referee
          ? {
              id: r.referee.id,
              email: r.referee.email,
              name: `${r.referee.firstName} ${r.referee.lastName}`.trim(),
              joinedAt: r.referee.createdAt,
            }
          : null,
      })),
    }
  }

  /**
   * Called from the registration flow when a new user signs up with a code.
   * Records the referral as `pending`; reward fires when the referee spends
   * `TRIGGER_AMOUNT`.
   */
  async recordReferral(referrerCode: string, refereeId: string) {
    const referrer = await prisma.user.findFirst({
      where: { referralCode: referrerCode.toUpperCase() },
    })
    if (!referrer) {
      logger.info(`Unknown referral code "${referrerCode}", skipping`)
      return null
    }
    if (referrer.id === refereeId) {
      logger.warn(`User ${refereeId} tried to refer themselves, skipping`)
      return null
    }
    const existing = await prisma.referral.findUnique({ where: { refereeId } })
    if (existing) return existing

    await prisma.user.update({
      where: { id: refereeId },
      data: { referredById: referrer.id },
    })

    return prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        code: referrerCode.toUpperCase(),
        status: 'pending',
        reward: REWARD_AMOUNT,
      },
    })
  }

  /**
   * Called from the billing engine after each successful payment. Walks any
   * pending referrals where the referee has crossed the spend threshold and
   * marks them rewarded. Funds are credited to the referrer's balance.
   */
  async settlePending(refereeId: string) {
    const referral = await prisma.referral.findUnique({
      where: { refereeId },
    })
    if (!referral || referral.status !== 'pending') return

    // Sum referee's paid invoices.
    const paid = await prisma.invoice.aggregate({
      where: { userId: refereeId, status: 'PAID' },
      _sum: { total: true },
    })
    const spent = paid._sum.total || 0
    if (spent < TRIGGER_AMOUNT) return

    const referrer = await prisma.user.findUnique({ where: { id: referral.referrerId } })
    if (!referrer) return

    const before = referrer.balance
    const after = before + referral.reward

    await prisma.$transaction([
      prisma.user.update({
        where: { id: referrer.id },
        data: { balance: after },
      }),
      prisma.transaction.create({
        data: {
          userId: referrer.id,
          type: 'credit',
          amount: referral.reward,
          currency: referrer.currency,
          description: `Referral reward (${referral.code})`,
          reference: referral.id,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
      prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'rewarded', paidAt: new Date() },
      }),
      prisma.notification.create({
        data: {
          userId: referrer.id,
          type: 'referral_rewarded',
          title: 'Referral reward credited',
          message: `+₹${referral.reward} added to your balance.`,
          link: `/dashboard/referrals`,
        },
      }),
    ])

    logger.info(`Referral ${referral.id} rewarded: +₹${referral.reward} to ${referrer.id}`)
  }
}

export default new ReferralService()
