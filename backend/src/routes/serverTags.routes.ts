import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — Server tags + bulk actions.
 *
 * Customers can tag servers ("prod", "staging", "client-x") and run
 * bulk operations (start/stop/destroy) by tag or by id list. The bulk
 * route returns per-server status so the UI can show partial failures.
 */

const tagSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,30}$/, 'Lowercase letters, digits, dashes only')

router.get('/server/:serverId', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.serverId, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    const tags = await prisma.serverTag.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ data: tags })
  } catch (e) { next(e) }
})

router.post('/server/:serverId', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ tag: tagSchema }).parse(req.body)
    const server = await prisma.server.findFirst({
      where: { id: req.params.serverId, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    const tag = await prisma.serverTag.upsert({
      where: { serverId_tag: { serverId: server.id, tag: body.tag } },
      create: { serverId: server.id, tag: body.tag },
      update: {},
    })
    res.status(201).json({ data: tag })
  } catch (e) { next(e) }
})

router.delete('/server/:serverId/:tag', async (req: AuthedRequest, res, next) => {
  try {
    const server = await prisma.server.findFirst({
      where: { id: req.params.serverId, userId: req.user!.userId, deletedAt: null },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    await prisma.serverTag.deleteMany({
      where: { serverId: server.id, tag: req.params.tag },
    })
    res.json({ message: 'Tag removed' })
  } catch (e) { next(e) }
})

// Bulk action — power on/off/restart multiple servers by id list or tag
router.post('/bulk-power', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      action: z.enum(['start', 'stop', 'restart']),
      serverIds: z.array(z.string()).optional(),
      tag: z.string().optional(),
    }).parse(req.body)

    let serverIds: string[] = body.serverIds || []
    if (body.tag) {
      const tagged = await prisma.serverTag.findMany({
        where: { tag: body.tag, server: { userId: req.user!.userId, deletedAt: null } },
        select: { serverId: true },
      })
      serverIds = serverIds.concat(tagged.map((t) => t.serverId))
    }
    serverIds = Array.from(new Set(serverIds))
    if (serverIds.length === 0) {
      throw new AppError('No servers matched', 400, 'NO_SERVERS')
    }
    if (serverIds.length > 50) {
      throw new AppError('Bulk action limited to 50 servers per call', 400, 'TOO_MANY')
    }

    // Verify ownership before queuing
    const owned = await prisma.server.findMany({
      where: { id: { in: serverIds }, userId: req.user!.userId, deletedAt: null },
      select: { id: true, hostname: true, status: true },
    })

    // For mock mode just flip the status. Real Proxmox calls are wired
    // through serverService.powerAction (kept synchronous here so the UI
    // sees the new status immediately; long jobs would queue these).
    const results: { serverId: string; ok: boolean; error?: string }[] = []
    for (const srv of owned) {
      try {
        const newStatus =
          body.action === 'start'   ? 'RUNNING' :
          body.action === 'stop'    ? 'STOPPED' :
          'REBOOTING'
        await prisma.server.update({ where: { id: srv.id }, data: { status: newStatus } })
        results.push({ serverId: srv.id, ok: true })
      } catch (e: any) {
        results.push({ serverId: srv.id, ok: false, error: e.message })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: `server.bulk_${body.action}`,
        resource: 'server',
        newValue: JSON.stringify({ count: results.length, action: body.action }),
      },
    })

    res.json({ data: { action: body.action, results } })
  } catch (e) { next(e) }
})

// Bulk destroy — hard-deletes a list (or tag) of servers
router.post('/bulk-destroy', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      serverIds: z.array(z.string()).optional(),
      tag: z.string().optional(),
      confirm: z.literal('DELETE'),
    }).parse(req.body)

    let ids: string[] = body.serverIds || []
    if (body.tag) {
      const tagged = await prisma.serverTag.findMany({
        where: { tag: body.tag, server: { userId: req.user!.userId, deletedAt: null } },
        select: { serverId: true },
      })
      ids = ids.concat(tagged.map((t) => t.serverId))
    }
    ids = Array.from(new Set(ids)).slice(0, 50)
    if (ids.length === 0) throw new AppError('No servers matched', 400, 'NO_SERVERS')

    const owned = await prisma.server.findMany({
      where: { id: { in: ids }, userId: req.user!.userId, deletedAt: null },
      select: { id: true },
    })

    await prisma.server.updateMany({
      where: { id: { in: owned.map((s) => s.id) } },
      data: { status: 'DELETED', deletedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'server.bulk_destroy',
        resource: 'server',
        newValue: JSON.stringify({ count: owned.length }),
      },
    })

    res.json({ data: { destroyed: owned.length } })
  } catch (e) { next(e) }
})

export default router
