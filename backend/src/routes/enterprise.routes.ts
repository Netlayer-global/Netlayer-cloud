import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import serverService from '../services/server.service'

const router = Router()

/**
 * Round 22 — admin enterprise / wallet management.
 *
 * Three billing modes:
 *   - retail (default):  pay full month upfront via Razorpay/Stripe checkout
 *   - wallet:            legacy hourly-debit model (mostly admins/power users)
 *   - enterprise:        no per-deploy payment; monthly invoice with PENDING
 *                        status; admin can deploy on user's behalf
 *
 * Endpoints:
 *   PATCH /api/admin/users/:id/billing-mode    set retail/wallet/enterprise
 *   POST  /api/admin/users/:id/deploy-server   admin deploys on behalf of user
 */

router.patch('/users/:id/billing-mode', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        mode: z.enum(['retail', 'wallet', 'enterprise']),
        contractValue: z.number().nonnegative().optional(),  // monthly committed spend (info only)
        notes: z.string().max(500).optional(),
      })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    const oldMode = user.billingMode

    // Stash the contract details inside metadata JSON. Avoids a schema
    // change just for advisory info — the actual gate is `billingMode`.
    const meta = (() => {
      try { return user.metadata ? JSON.parse(user.metadata) : {} } catch { return {} }
    })()
    if (body.mode === 'enterprise') {
      meta.enterprise = {
        ...(meta.enterprise || {}),
        contractValue: body.contractValue ?? meta.enterprise?.contractValue ?? 0,
        notes: body.notes ?? meta.enterprise?.notes,
        grantedAt: new Date().toISOString(),
        grantedBy: req.user!.userId,
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        billingMode: body.mode,
        metadata: JSON.stringify(meta),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.user.billing_mode_changed',
        resource: 'user',
        resourceId: user.id,
        oldValue: JSON.stringify({ mode: oldMode }),
        newValue: JSON.stringify({ mode: body.mode, contractValue: body.contractValue }),
      },
    })

    res.json({ data: { id: user.id, billingMode: body.mode } })
  } catch (e) { next(e) }
})

/**
 * Admin deploys a server directly on a user's behalf. Useful for:
 *   - enterprise customers without a self-service checkout
 *   - support agents replacing a destroyed VM under SLA
 *   - giving a comp server to a partner
 *
 * The user must be in `enterprise` or `wallet` billingMode. For retail
 * customers we refuse — they need to pay through the regular checkout.
 */
router.post('/users/:id/deploy-server', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(64),
        planId: z.string().min(1),
        regionId: z.string().min(1),
        osTemplateId: z.string().min(1),
        sshKeyId: z.string().optional(),
        rootPassword: z.string().min(8).optional(),
      })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')

    if (user.billingMode === 'retail') {
      throw new AppError(
        'User is in retail mode. Switch to enterprise/wallet first or have them pay via checkout.',
        400,
        'RETAIL_USER'
      )
    }

    const server = await serverService.deployServer(user.id, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.deploy_for_user',
        resource: 'server',
        resourceId: server.id,
        newValue: JSON.stringify({
          deployedBy: req.user!.userId,
          onBehalfOf: user.id,
          plan: body.planId,
          billingMode: user.billingMode,
        }),
      },
    })

    res.status(201).json({ data: { id: server.id, hostname: server.hostname } })
  } catch (e) { next(e) }
})

export default router
