import prisma from '../../utils/prisma'
import logger from '../../utils/logger'
import { resumeRunning } from '../../workflows/engine'
import { DeployServerWorkflow } from '../../workflows/deployServer.workflow'

/**
 * Reconciler — every 5 minutes, looks for workflow runs that are still in
 * `running` state but haven't been touched recently. These are workflows
 * whose worker process crashed mid-execution. We hand them back to the engine
 * which resumes from the last completed step.
 *
 * Workflows are idempotent by design (every step keys on resourceId or an
 * external provider ID), so re-running is safe.
 */
const STALE_AFTER_MS = 10 * 60 * 1000 // 10 min

export async function runReconciler(_data: { ts: number }) {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS)

  // Mark stale "running" workflows we'll attempt to resume
  const stale = await prisma.workflowRun.findMany({
    where: {
      status: 'running',
      OR: [{ finishedAt: null, startedAt: { lt: cutoff } }],
    },
    select: { id: true, type: true },
    take: 200,
  })

  if (stale.length === 0) {
    logger.debug('reconciler: nothing stale')
    return
  }

  logger.info({ count: stale.length }, 'reconciler: resuming stale workflows')

  // Today only one workflow type exists. As more are added, dispatch by `type`.
  const resumed = await resumeRunning(DeployServerWorkflow)
  logger.info({ resumed }, '✓ reconciler complete')
}
