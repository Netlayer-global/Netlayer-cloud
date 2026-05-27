import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Organizations / teams.
 *
 * Each user can:
 *   - own multiple organizations
 *   - be a member of organizations they don't own
 * Org has its own GST/PAN/billing email (used for invoices when configured)
 * Members have one of: owner, admin, member, billing, viewer
 *
 * Invites are 7-day token links emailed by the server.
 */

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const memberships = await prisma.orgMember.findMany({
      where: { userId: req.user!.userId },
      include: { org: true },
      orderBy: { joinedAt: 'desc' },
    })
    res.json({
      data: memberships.map((m) => ({
        ...m.org,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const member = await prisma.orgMember.findFirst({
      where: { orgId: req.params.id, userId: req.user!.userId },
    })
    if (!member) throw new AppError('Org not found', 404, 'NOT_FOUND')

    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        invites: { where: { acceptedAt: null, expiresAt: { gt: new Date() } } },
      },
    })
    res.json({ data: { ...org, myRole: member.role } })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).max(80),
      billingEmail: z.string().email().optional(),
      gstNumber: z.string().optional(),
      panNumber: z.string().optional(),
    }).parse(req.body)

    const baseSlug = slugify(body.name) || `org-${Date.now().toString(36)}`
    let slug = baseSlug
    let n = 1
    while (await prisma.organization.findUnique({ where: { slug } })) {
      n += 1
      slug = `${baseSlug}-${n}`
    }

    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug,
        ownerId: req.user!.userId,
        billingEmail: body.billingEmail || null,
        gstNumber: body.gstNumber || null,
        panNumber: body.panNumber || null,
        members: {
          create: { userId: req.user!.userId, role: 'owner' },
        },
      },
    })
    res.status(201).json({ data: org })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const member = await prisma.orgMember.findFirst({
      where: { orgId: req.params.id, userId: req.user!.userId, role: { in: ['owner', 'admin'] } },
    })
    if (!member) throw new AppError('Insufficient permissions', 403, 'FORBIDDEN')

    const body = z.object({
      name: z.string().min(2).optional(),
      billingEmail: z.string().email().nullable().optional(),
      gstNumber: z.string().nullable().optional(),
      panNumber: z.string().nullable().optional(),
      address: z.record(z.any()).optional(),
    }).parse(req.body)

    const data: any = { ...body }
    if (body.address) data.address = JSON.stringify(body.address)

    const org = await prisma.organization.update({ where: { id: req.params.id }, data })
    res.json({ data: org })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } })
    if (!org || org.ownerId !== req.user!.userId) {
      throw new AppError('Only the owner can delete', 403, 'FORBIDDEN')
    }
    await prisma.$transaction([
      prisma.orgInvite.deleteMany({ where: { orgId: org.id } }),
      prisma.orgMember.deleteMany({ where: { orgId: org.id } }),
      prisma.organization.delete({ where: { id: org.id } }),
    ])
    res.json({ message: 'Organization deleted' })
  } catch (e) { next(e) }
})

// ── Member management ───────────────────────────────────
router.post('/:id/invites', async (req: AuthedRequest, res, next) => {
  try {
    const member = await prisma.orgMember.findFirst({
      where: { orgId: req.params.id, userId: req.user!.userId, role: { in: ['owner', 'admin'] } },
    })
    if (!member) throw new AppError('Insufficient permissions', 403, 'FORBIDDEN')

    const body = z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'member', 'billing', 'viewer']).default('member'),
    }).parse(req.body)

    const token = crypto.randomBytes(24).toString('hex')
    const invite = await prisma.orgInvite.create({
      data: {
        orgId: req.params.id,
        email: body.email,
        role: body.role,
        token,
        invitedBy: req.user!.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    })

    // Production: trigger email with invite link → emailService.sendOrgInvite
    res.status(201).json({ data: invite })
  } catch (e) { next(e) }
})

router.post('/invites/:token/accept', async (req: AuthedRequest, res, next) => {
  try {
    const invite = await prisma.orgInvite.findUnique({ where: { token: req.params.token } })
    if (!invite) throw new AppError('Invite not found', 404, 'NOT_FOUND')
    if (invite.acceptedAt) throw new AppError('Invite already accepted', 400, 'ALREADY_ACCEPTED')
    if (invite.expiresAt < new Date()) throw new AppError('Invite expired', 400, 'EXPIRED')

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (user?.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new AppError('Invite is for a different email', 403, 'WRONG_USER')
    }

    await prisma.$transaction([
      prisma.orgMember.upsert({
        where: { orgId_userId: { orgId: invite.orgId, userId: req.user!.userId } },
        create: { orgId: invite.orgId, userId: req.user!.userId, role: invite.role },
        update: { role: invite.role },
      }),
      prisma.orgInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ])

    res.json({ data: { joined: true, orgId: invite.orgId } })
  } catch (e) { next(e) }
})

router.delete('/:id/members/:memberId', async (req: AuthedRequest, res, next) => {
  try {
    const myMember = await prisma.orgMember.findFirst({
      where: { orgId: req.params.id, userId: req.user!.userId, role: { in: ['owner', 'admin'] } },
    })
    if (!myMember) throw new AppError('Insufficient permissions', 403, 'FORBIDDEN')

    const target = await prisma.orgMember.findUnique({ where: { id: req.params.memberId } })
    if (!target || target.orgId !== req.params.id) {
      throw new AppError('Member not found', 404, 'NOT_FOUND')
    }
    if (target.role === 'owner') {
      throw new AppError('Cannot remove org owner', 400, 'CANNOT_REMOVE_OWNER')
    }

    await prisma.orgMember.delete({ where: { id: target.id } })
    res.json({ message: 'Member removed' })
  } catch (e) { next(e) }
})

router.patch('/:id/members/:memberId', async (req: AuthedRequest, res, next) => {
  try {
    const myMember = await prisma.orgMember.findFirst({
      where: { orgId: req.params.id, userId: req.user!.userId, role: 'owner' },
    })
    if (!myMember) throw new AppError('Only owner can change roles', 403, 'FORBIDDEN')

    const body = z.object({
      role: z.enum(['admin', 'member', 'billing', 'viewer']),
    }).parse(req.body)

    const updated = await prisma.orgMember.update({
      where: { id: req.params.memberId },
      data: { role: body.role },
    })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

export default router
