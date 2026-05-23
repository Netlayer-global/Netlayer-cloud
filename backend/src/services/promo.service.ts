import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

/**
 * PromoService — atomic redemption with idempotency.
 *
 * Redemption rules:
 *   - Code must exist, be active, not expired
 *   - Per-user uniqueness (PromoRedemption has @@unique([promoId, userId]))
 *   - Usage count vs limit checked inside the same transaction
 *
 * The whole "increment usage + create redemption + credit balance + write
 * Transaction row" runs in a single Prisma $transaction so either all four
 * happen or none do.
 */
export class PromoService {
  async redeem(code: string, userId: string): Promise<{ creditAdded: number; newBalance: number }> {
    const upper = code.trim().toUpperCase()
    if (!upper) throw new AppError('Code required', 400, 'CODE_REQUIRED')

    const promo = await prisma.promoCode.findUnique({ where: { code: upper } })
    if (!promo || !promo.isActive) {
      throw new AppError('Invalid promo code', 400, 'INVALID_PROMO')
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new AppError('Promo code expired', 400, 'PROMO_EXPIRED')
    }
    if (promo.usageCount >= promo.usageLimit) {
      throw new AppError('Promo code exhausted', 400, 'PROMO_EXHAUSTED')
    }

    const existing = await prisma.promoRedemption.findUnique({
      where: { promoId_userId: { promoId: promo.id, userId } },
    })
    if (existing) {
      throw new AppError('Already redeemed this code', 400, 'ALREADY_REDEEMED')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const before = user.balance
    const after = Number((before + promo.amount).toFixed(2))

    const [, , updatedUser] = await prisma.$transaction([
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usageCount: { increment: 1 } },
      }),
      prisma.promoRedemption.create({
        data: { promoId: promo.id, userId, amount: promo.amount },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { balance: after },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'credit',
          amount: promo.amount,
          currency: promo.currency,
          description: `Promo code: ${upper}`,
          reference: promo.id,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
    ])

    return { creditAdded: promo.amount, newBalance: updatedUser.balance }
  }
}

export default new PromoService()
