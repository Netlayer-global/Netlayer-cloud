import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

/**
 * Round 24 — Compliance incident reporting (India CERT-In).
 *
 * CERT-In's 2022 directive requires reporting of "cyber incidents" within
 * 6 hours of discovery. This module gives operators a structured place
 * to log incidents, track who reported them, and store CERT-In's reply.
 *
 * Future: auto-export an incident as a PDF in CERT-In's required format.
 */

router.get('/incidents', async (_req, res, next) => {
  try {
    const list = await prisma.complianceIncident.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 200,
    })
    res.json({ data: list })
  } catch (e) { next(e) }
})

router.get('/incidents/:id', async (req, res, next) => {
  try {
    const inc = await prisma.complianceIncident.findUnique({ where: { id: req.params.id } })
    if (!inc) throw new AppError('Incident not found', 404, 'NOT_FOUND')
    res.json({
      data: {
        ...inc,
        affectedUsers: (() => {
          try { return JSON.parse(inc.affectedUsers) } catch { return [] }
        })(),
      },
    })
  } catch (e) { next(e) }
})

router.post('/incidents', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      type: z.enum(['breach', 'ddos', 'malware', 'unauthorized', 'data-loss', 'other']),
      severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      description: z.string().min(10).max(5000),
      detectedAt: z.string().datetime().optional(),
      affectedUsers: z.array(z.string()).default([]),
    }).parse(req.body)

    const inc = await prisma.complianceIncident.create({
      data: {
        type: body.type,
        severity: body.severity,
        description: body.description,
        detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
        affectedUsers: JSON.stringify(body.affectedUsers),
        createdBy: req.user!.userId,
      },
    })
    logger.warn({ incidentId: inc.id, type: body.type }, 'compliance incident recorded')
    res.status(201).json({ data: inc })
  } catch (e) { next(e) }
})

router.patch('/incidents/:id', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      status: z.enum(['open', 'reported', 'resolved', 'closed']).optional(),
      certInRef: z.string().optional(),
      reportedAt: z.string().datetime().optional(),
      remediation: z.string().optional(),
    }).parse(req.body)

    const data: any = { ...body }
    if (body.reportedAt) data.reportedAt = new Date(body.reportedAt)
    if (body.status === 'reported' && !data.reportedAt) data.reportedAt = new Date()
    if (body.status === 'reported' && !data.reportedBy) data.reportedBy = req.user!.userId
    if (body.status === 'closed') data.closedAt = new Date()

    const inc = await prisma.complianceIncident.update({
      where: { id: req.params.id },
      data,
    })
    res.json({ data: inc })
  } catch (e) { next(e) }
})

// Operator dashboard: SLA stats — incidents over 6 hours not yet reported
router.get('/sla', async (_req, res, next) => {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60_000)
    const overdue = await prisma.complianceIncident.findMany({
      where: {
        status: 'open',
        detectedAt: { lt: sixHoursAgo },
      },
      orderBy: { detectedAt: 'asc' },
    })
    const open = await prisma.complianceIncident.count({ where: { status: 'open' } })
    const reportedThisMonth = await prisma.complianceIncident.count({
      where: {
        status: { in: ['reported', 'resolved', 'closed'] },
        reportedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    })
    res.json({
      data: {
        open,
        reportedThisMonth,
        overdue: overdue.length,
        overdueDetails: overdue,
      },
    })
  } catch (e) { next(e) }
})

export default router
