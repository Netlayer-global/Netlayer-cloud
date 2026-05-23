import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import { slaTargetFor, slaState } from '../services/sla.service'
import { emitToUser, emitToAdmin } from '../services/socket.service'

const router = Router()

const PRIORITY = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
const CATEGORY = z.enum(['general', 'billing', 'technical', 'abuse', 'sales'])

const serializeTicket = (t: any) => ({
  ...t,
  sla: slaState(t),
})

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.userId },
      include: { _count: { select: { messages: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ data: tickets.map(serializeTicket) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      subject: z.string().min(3).max(200),
      category: CATEGORY.optional(),
      priority: PRIORITY.optional(),
      message: z.string().min(1).max(10_000),
    })
    const body = schema.parse(req.body)

    const priority = body.priority || 'MEDIUM'
    const slaTargetAt = slaTargetFor(priority)

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.userId,
        subject: body.subject,
        category: body.category || 'general',
        priority,
        status: 'OPEN',
        slaTargetAt,
        messages: {
          create: {
            authorId: req.user!.userId,
            authorRole: 'user',
            content: body.message,
          },
        },
      },
      include: { messages: true, _count: { select: { messages: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ticket.create',
        resource: 'ticket',
        resourceId: ticket.id,
        newValue: JSON.stringify({ subject: body.subject, priority, category: body.category }),
      },
    })

    emitToAdmin('admin:ticket_created', { ticketId: ticket.id, priority, subject: body.subject })
    emitToUser(req.user!.userId, 'ticket:created', serializeTicket(ticket))

    res.status(201).json({ data: serializeTicket(ticket) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, where: { isInternal: false } },
      },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')
    res.json({ data: serializeTicket(ticket) })
  } catch (e) { next(e) }
})

router.post('/:id/reply', async (req: AuthedRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(10_000) }).parse(req.body)
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')
    if (ticket.status === 'CLOSED') {
      throw new AppError('Ticket is closed', 400, 'CLOSED')
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: req.user!.userId,
        authorRole: 'user',
        content,
      },
    })

    // Re-open the ticket if user replies on a resolved one
    const update: any = { updatedAt: new Date() }
    if (ticket.status === 'RESOLVED') update.status = 'OPEN'
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: update })

    emitToAdmin('admin:ticket_reply', { ticketId: ticket.id, fromUser: true })
    res.status(201).json({ data: message })
  } catch (e) { next(e) }
})

router.post('/:id/rate', async (req: AuthedRequest, res, next) => {
  try {
    const { rating } = z.object({ rating: z.number().int().min(1).max(5) }).parse(req.body)
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new AppError('Only resolved tickets can be rated', 400, 'NOT_RESOLVED')
    }
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { rating, ratedAt: new Date() },
    })
    res.json({ message: 'Thanks for the feedback!' })
  } catch (e) { next(e) }
})

router.post('/:id/close', async (req: AuthedRequest, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!ticket) throw new AppError('Ticket not found', 404, 'NOT_FOUND')
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    })
    res.json({ message: 'Ticket closed' })
  } catch (e) { next(e) }
})

export default router
