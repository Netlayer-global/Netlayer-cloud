import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { adminOnly, AuthedRequest } from '../middleware/auth'
import { emitToAdmin } from '../services/socket.service'
import { getIo } from '../services/socket.service'

const router = Router()
router.use(adminOnly)

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

const serialize = (i: any) => ({
  ...i,
  affectedServices: safeJSON(i.affectedServices, []),
  affectedRegions: safeJSON(i.affectedRegions, []),
  updates: safeJSON(i.updates, []),
})

const broadcast = (incident: any) => {
  emitToAdmin('admin:status_update', incident)
  try {
    getIo().emit('status:update', incident)
  } catch {}
}

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.statusIncident.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ data: items.map(serialize) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(140),
        status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
        impact: z.enum(['minor', 'major', 'critical', 'maintenance']).optional(),
        affectedServices: z.array(z.string()).optional(),
        affectedRegions: z.array(z.string()).optional(),
        firstUpdate: z.string().min(1).max(1000).optional(),
      })
      .parse(req.body)

    const updates = body.firstUpdate
      ? [{ message: body.firstUpdate, status: body.status ?? 'investigating', ts: new Date().toISOString() }]
      : []

    const created = await prisma.statusIncident.create({
      data: {
        title: body.title,
        status: body.status ?? 'investigating',
        impact: body.impact ?? 'minor',
        affectedServices: JSON.stringify(body.affectedServices ?? []),
        affectedRegions: JSON.stringify(body.affectedRegions ?? []),
        updates: JSON.stringify(updates),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'status.incident.created',
        resource: 'status_incident',
        resourceId: created.id,
        newValue: JSON.stringify(body),
      },
    })

    const out = serialize(created)
    broadcast(out)
    res.status(201).json({ data: out })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(140).optional(),
        status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
        impact: z.enum(['minor', 'major', 'critical', 'maintenance']).optional(),
        affectedServices: z.array(z.string()).optional(),
        affectedRegions: z.array(z.string()).optional(),
        update: z.string().min(1).max(1000).optional(),
      })
      .parse(req.body)

    const existing = await prisma.statusIncident.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Incident not found', 404, 'NOT_FOUND')

    const data: any = {}
    if (body.title) data.title = body.title
    if (body.impact) data.impact = body.impact
    if (body.affectedServices) data.affectedServices = JSON.stringify(body.affectedServices)
    if (body.affectedRegions) data.affectedRegions = JSON.stringify(body.affectedRegions)

    // Status transition + auto-resolve
    if (body.status) {
      data.status = body.status
      if (body.status === 'resolved') data.resolvedAt = new Date()
    }

    // Append a new update message
    if (body.update) {
      const existingUpdates = safeJSON(existing.updates, [] as any[])
      existingUpdates.push({
        message: body.update,
        status: body.status ?? existing.status,
        ts: new Date().toISOString(),
      })
      data.updates = JSON.stringify(existingUpdates)
    }

    const updated = await prisma.statusIncident.update({
      where: { id: existing.id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'status.incident.updated',
        resource: 'status_incident',
        resourceId: existing.id,
        newValue: JSON.stringify(body),
      },
    })

    const out = serialize(updated)
    broadcast(out)
    res.json({ data: out })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await prisma.statusIncident.delete({ where: { id: req.params.id } })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'status.incident.deleted',
        resource: 'status_incident',
        resourceId: req.params.id,
      },
    })
    res.json({ message: 'Incident deleted' })
  } catch (e) { next(e) }
})

export default router
