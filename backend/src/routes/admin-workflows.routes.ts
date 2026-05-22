import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { adminOnly, AuthedRequest } from '../middleware/auth'
import { resumeRunning, loadWorkflow } from '../workflows/engine'
import { DeployServerWorkflow } from '../workflows/deployServer.workflow'

const router = Router()
router.use(adminOnly)

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

const serializeWorkflow = (w: any) => ({
  ...w,
  context: safeJSON(w.context, {}),
  steps: safeJSON(w.steps, []),
})

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10))
    const status = req.query.status as string | undefined
    const type = req.query.type as string | undefined

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [rows, total] = await Promise.all([
      prisma.workflowRun.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.workflowRun.count({ where }),
    ])

    res.json({ data: rows.map(serializeWorkflow), pagination: { page, limit, total } })
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const wf = await loadWorkflow(req.params.id)
    if (!wf) throw new AppError('Workflow not found', 404, 'NOT_FOUND')
    res.json({ data: wf })
  } catch (e) { next(e) }
})

router.post('/:id/retry', async (req: AuthedRequest, res, next) => {
  try {
    const wf = await prisma.workflowRun.findUnique({ where: { id: req.params.id } })
    if (!wf) throw new AppError('Workflow not found', 404, 'NOT_FOUND')

    // Reset failed steps to pending and re-run
    const steps = safeJSON(wf.steps, [] as any[])
    const reset = steps.map((s) => (s.status === 'failed' ? { ...s, status: 'pending', error: undefined } : s))
    await prisma.workflowRun.update({
      where: { id: wf.id },
      data: { status: 'running', steps: JSON.stringify(reset), error: null },
    })

    if (wf.type === 'deploy_server') {
      await resumeRunning(DeployServerWorkflow)
    } else {
      throw new AppError(`Unknown workflow type: ${wf.type}`, 400, 'UNKNOWN_TYPE')
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'workflow.retried',
        resource: 'workflow',
        resourceId: wf.id,
      },
    })

    res.json({ message: 'Workflow retry started' })
  } catch (e) { next(e) }
})

router.post('/:id/cancel', async (req: AuthedRequest, res, next) => {
  try {
    const wf = await prisma.workflowRun.findUnique({ where: { id: req.params.id } })
    if (!wf) throw new AppError('Workflow not found', 404, 'NOT_FOUND')
    if (wf.status === 'succeeded' || wf.status === 'failed' || wf.status === 'compensated') {
      throw new AppError(`Workflow already in terminal state: ${wf.status}`, 400, 'TERMINAL')
    }

    await prisma.workflowRun.update({
      where: { id: wf.id },
      data: { status: 'compensating', error: 'cancelled by admin' },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'workflow.cancelled',
        resource: 'workflow',
        resourceId: wf.id,
      },
    })

    res.json({ message: 'Workflow cancellation requested (compensation will run on next reconcile)' })
  } catch (e) { next(e) }
})

export default router
