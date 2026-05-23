import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

const FLOATING_IP_PRICE_PER_MONTH = 50  // INR
const FQDN = /^(?=.{1,253}$)([a-zA-Z0-9][a-zA-Z0-9-]{0,62}\.)+[a-zA-Z]{2,}$/

/**
 * Floating IP API. Each FIP is independent of any server — users can keep
 * a stable IP and re-point it at different VMs (blue-green, failover, etc.)
 *
 * Mock-mode allocation: synthesize a believable IP from the seeded
 * 103.21.200.0/24 range. Real mode: ipPoolService.allocateIp(regionId).
 */
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const fips = await prisma.floatingIp.findMany({
      where: { userId: req.user!.userId },
      include: {
        region: { select: { id: true, name: true, slug: true, flag: true, countryCode: true } },
        server: { select: { id: true, name: true, hostname: true, ipv4: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: fips })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const { regionId } = z.object({ regionId: z.string().min(1) }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const region = await prisma.region.findUnique({ where: { id: regionId } })
    if (!region?.isActive) throw new AppError('Region not available', 400, 'INVALID_REGION')

    const minBalance = FLOATING_IP_PRICE_PER_MONTH
    if (user.balance + (user.creditLimit || 0) < minBalance) {
      throw new AppError(
        `Insufficient balance. Add ₹${(minBalance - user.balance).toFixed(2)} to allocate a floating IP.`,
        402,
        'INSUFFICIENT_BALANCE'
      )
    }

    // Synthesize an IP. In real mode swap for ipPoolService.allocateIp(regionId).
    const ip = `103.21.${Math.floor(Math.random() * 50) + 200}.${Math.floor(Math.random() * 254) + 1}`

    const before = user.balance
    const after = Number((before - FLOATING_IP_PRICE_PER_MONTH).toFixed(2))

    const [, fip] = await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: after } }),
      prisma.floatingIp.create({
        data: { userId: user.id, regionId, ip, status: 'unassigned' },
        include: {
          region: { select: { id: true, name: true, flag: true } },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'debit',
          amount: FLOATING_IP_PRICE_PER_MONTH,
          currency: user.currency || 'INR',
          description: `Floating IP allocation in ${region.city}`,
          balanceBefore: before,
          balanceAfter: after,
        },
      }),
    ])

    res.status(201).json({ data: fip })
  } catch (e) { next(e) }
})

router.post('/:id/assign', async (req: AuthedRequest, res, next) => {
  try {
    const { serverId } = z.object({ serverId: z.string().min(1) }).parse(req.body)
    const fip = await prisma.floatingIp.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!fip) throw new AppError('Floating IP not found', 404, 'NOT_FOUND')

    const server = await prisma.server.findFirst({
      where: { id: serverId, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (server.regionId !== fip.regionId) {
      throw new AppError('Floating IP and server must be in the same region', 400, 'REGION_MISMATCH')
    }

    const updated = await prisma.floatingIp.update({
      where: { id: fip.id },
      data: { serverId: server.id, status: 'assigned' },
    })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

router.post('/:id/unassign', async (req: AuthedRequest, res, next) => {
  try {
    const fip = await prisma.floatingIp.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!fip) throw new AppError('Floating IP not found', 404, 'NOT_FOUND')

    const updated = await prisma.floatingIp.update({
      where: { id: fip.id },
      data: { serverId: null, status: 'unassigned' },
    })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

router.patch('/:id/rdns', async (req: AuthedRequest, res, next) => {
  try {
    const { rdns } = z
      .object({ rdns: z.string().max(253).nullable().optional() })
      .parse(req.body)

    if (rdns && rdns.length > 0 && !FQDN.test(rdns)) {
      throw new AppError('Invalid FQDN', 400, 'INVALID_FQDN')
    }

    const fip = await prisma.floatingIp.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!fip) throw new AppError('Floating IP not found', 404, 'NOT_FOUND')

    const updated = await prisma.floatingIp.update({
      where: { id: fip.id },
      data: { rdns: rdns || null },
    })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const fip = await prisma.floatingIp.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!fip) throw new AppError('Floating IP not found', 404, 'NOT_FOUND')
    if (fip.serverId) {
      throw new AppError('Unassign the IP from the server before releasing it', 400, 'IP_IN_USE')
    }
    await prisma.floatingIp.delete({ where: { id: fip.id } })
    res.json({ message: 'Floating IP released' })
  } catch (e) { next(e) }
})

export default router
