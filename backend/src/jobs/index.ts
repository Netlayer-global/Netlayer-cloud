import cron from 'node-cron'
import logger from '../utils/logger'
import { createQueue, shutdownQueues } from './queue'
import { runNodeMonitor } from './handlers/nodeMonitor.handler'
import { runDailyBilling, runMonthlyInvoices } from './handlers/billing.handler'
import { runZabbixSync } from './handlers/zabbix.handler'
import { runCleanup } from './handlers/cleanup.handler'
import { runReconciler } from './handlers/reconciler.handler'

/**
 * Job system architecture:
 *
 *   cron schedules → enqueue jobs into BullMQ (or in-memory fallback)
 *                  → workers consume and execute the handler
 *
 * Why this split: schedulers and workers can run in different processes
 * for horizontal scaling. Today they live in the same process; the API can
 * be split out later without changing the handlers.
 */

const SCHEDULES = {
  nodeMonitor:    { queue: 'node-monitor',    cron: '* * * * *',   handler: runNodeMonitor,     description: 'every minute' },
  billingDaily:   { queue: 'billing-daily',   cron: '0 0 * * *',   handler: runDailyBilling,    description: 'midnight daily' },
  billingMonthly: { queue: 'billing-monthly', cron: '0 0 1 * *',   handler: runMonthlyInvoices, description: '1st of month' },
  zabbixSync:    { queue: 'zabbix-sync',     cron: '*/5 * * * *', handler: runZabbixSync,      description: 'every 5 min' },
  reconciler:     { queue: 'reconciler',       cron: '*/5 * * * *', handler: runReconciler,      description: 'every 5 min — resume stuck workflows' },
  cleanup:        { queue: 'cleanup',          cron: '0 */6 * * *', handler: runCleanup,         description: 'every 6 hours' },
}

export function registerAllJobs() {
  for (const [name, { queue: queueName, cron: cronExpr, handler, description }] of Object.entries(SCHEDULES)) {
    const q = createQueue<{ ts: number }>(queueName)
    q.process(async (data) => handler(data), 1)

    cron.schedule(cronExpr, async () => {
      try {
        await q.add(name, { ts: Date.now() }, { jobId: `${name}-${Date.now()}` })
      } catch (err: any) {
        logger.error({ err, name }, 'failed to enqueue scheduled job')
      }
    })

    logger.info({ name, cron: cronExpr, description }, '✓ schedule registered')
  }
}

export { shutdownQueues }
