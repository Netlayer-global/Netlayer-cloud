import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { adminOnly, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(adminOnly)

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10))
    const status = req.query.status as string | undefined
    const type = req.query.type as string | undefined

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [reports, total] = await Promise.all([
      prisma.abuseReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.abuseReport.count({ where }),
    ])

    // Hydrate server + user info inline (read-only)
    const out = await Promise.all(
      reports.map(async (r) => {
        let server: any = null
        let user: any = null
        if (r.serverId) {
          server = await prisma.server.findUnique({
            where: { id: r.serverId },
            select: { id: true, name: true, ipv4: true, userId: true },
          })
          if (server?.userId) {
            user = await prisma.user.findUnique({
              where: { id: server.userId },
              select: { id: true, email: true, firstName: true, lastName: true, status: true },
            })
          }
        }
        return { ...r, server, user }
      })
    )

    res.json({ data: out, pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const r = await prisma.abuseReport.findUnique({ where: { id: req.params.id } })
    if (!r) throw new AppError('Report not found', 404, 'NOT_FOUND')
    res.json({ data: r })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        status: z.enum(['open', 'investigating', 'resolved', 'dismissed']).optional(),
      })
      .parse(req.body)

    const data: any = { ...body }
    if (body.status === 'resolved' || body.status === 'dismissed') {
      data.resolvedAt = new Date()
      data.resolvedBy = req.user!.userId
    }

    const updated = await prisma.abuseReport.update({
      where: { id: req.params.id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'abuse.update',
        resource: 'abuse_report',
        resourceId: updated.id,
        newValue: JSON.stringify(body),
      },
    })

    res.json({ data: updated })
  } catch (e) { next(e) }
})

router.post('/:id/suspend-server', async (req: AuthedRequest, res, next) => {
  try {
    const report = await prisma.abuseReport.findUnique({ where: { id: req.params.id } })
    if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND')
    if (!report.serverId) throw new AppError('No server linked to this report', 400, 'NO_SERVER')

    const server = await prisma.server.findUnique({ where: { id: report.serverId } })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    await prisma.server.update({
      where: { id: server.id },
      data: { status: 'STOPPED', notes: `Suspended for abuse report ${report.id}` },
    })

    await prisma.abuseReport.update({
      where: { id: report.id },
      data: { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user!.userId },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'abuse.server_suspended',
        resource: 'server',
        resourceId: server.id,
        metadata: JSON.stringify({ reportId: report.id }),
      },
    })

    res.json({ message: 'Server suspended and report resolved' })
  } catch (e) { next(e) }
})

export default router
