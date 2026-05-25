import { Router } from 'express'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import { generateCreditNotePDF } from '../services/creditNote.service'

const router = Router()

const serialize = (cn: any) => ({
  ...cn,
  taxBreakdown: (() => {
    if (!cn.taxBreakdown) return null
    try { return JSON.parse(cn.taxBreakdown) } catch { return null }
  })(),
})

/** Customer-facing list of own credit notes. */
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const cns = await prisma.creditNote.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { invoice: { select: { invoiceNumber: true, total: true } } },
    })
    res.json({ data: cns.map(serialize) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const cn = await prisma.creditNote.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { invoice: true },
    })
    if (!cn) throw new AppError('Credit note not found', 404, 'NOT_FOUND')
    res.json({ data: serialize(cn) })
  } catch (e) { next(e) }
})

router.get('/:id/pdf', async (req: AuthedRequest, res, next) => {
  try {
    const cn = await prisma.creditNote.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!cn) throw new AppError('Credit note not found', 404, 'NOT_FOUND')
    const pdf = await generateCreditNotePDF(cn.id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${cn.creditNoteNumber.replace(/\//g, '-')}.pdf"`)
    res.send(pdf)
  } catch (e) { next(e) }
})

/** Admin: list ALL credit notes with full user info. */
export const adminCreditNotesRouter = Router()
adminCreditNotesRouter.get('/', async (_req, res, next) => {
  try {
    const cns = await prisma.creditNote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        invoice: { select: { invoiceNumber: true, total: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })
    res.json({ data: cns.map(serialize) })
  } catch (e) { next(e) }
})

adminCreditNotesRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const cn = await prisma.creditNote.findUnique({ where: { id: req.params.id } })
    if (!cn) throw new AppError('Credit note not found', 404, 'NOT_FOUND')
    const pdf = await generateCreditNotePDF(cn.id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${cn.creditNoteNumber.replace(/\//g, '-')}.pdf"`)
    res.send(pdf)
  } catch (e) { next(e) }
})

export default router
