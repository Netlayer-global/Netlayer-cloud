import cron from 'node-cron'
import logger from '../utils/logger'
import { createQueue, shutdownQueues } from './queue'
import { runNodeMonitor } from './handlers/nodeMonitor.handler'
import { runDailyBilling, runMonthlyInvoices } from './handlers/billing.handler'
import { runDunning } from './handlers/billing.handler'
import { runBandwidthMeter } from './handlers/bandwidthMeter.handler'
import { runDeployOrderSweep } from './handlers/deployOrderSweep.handler'
import { runZabbixSync } from './handlers/zabbix.handler'
import { runCleanup } from './handlers/cleanup.handler'
import { runReconciler } from './handlers/reconciler.handler'
import { runSlaBreach } from './handlers/slaBreach.handler'
import { runWebhookDelivery } from './handlers/webhookDelivery.handler'
import { runAlertEvaluator } from './handlers/alertEvaluator.handler'
import { runFloatingIpBilling } from './handlers/floatingIpBilling.handler'
import { runAnalyticsSnapshot } from './handlers/analyticsSnapshot.handler'
import { runBackupRunner } from './handlers/backupRunner.handler'

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
  dunning:        { queue: 'dunning',          cron: '0 9 * * *',   handler: runDunning,         description: 'daily 9am — escalate non-payers' },
  bandwidth:      { queue: 'bandwidth',        cron: '*/15 * * * *', handler: runBandwidthMeter, description: 'every 15 min — sample VM netin/netout' },
  deployOrderSweep: { queue: 'deploy-order-sweep', cron: '*/15 * * * *', handler: runDeployOrderSweep, description: 'every 15 min — cancel expired deploy orders' },
  zabbixSync:    { queue: 'zabbix-sync',     cron: '*/5 * * * *', handler: runZabbixSync,      description: 'every 5 min' },
  reconciler:     { queue: 'reconciler',       cron: '*/5 * * * *', handler: runReconciler,      description: 'every 5 min — resume stuck workflows' },
  slaBreach:      { queue: 'sla-breach',       cron: '*/5 * * * *', handler: runSlaBreach,       description: 'every 5 min — mark breached tickets' },
  webhookDelivery:{ queue: 'webhook-delivery', cron: '*/30 * * * * *', handler: runWebhookDelivery, description: 'every 30s — drain pending webhook deliveries' },
  alertEvaluator: { queue: 'alert-evaluator',  cron: '*/5 * * * *',     handler: runAlertEvaluator,  description: 'every 5 min — evaluate user alert rules' },
  floatingIpBill: { queue: 'floating-ip-bill', cron: '5 0 * * *',       handler: runFloatingIpBilling, description: '00:05 daily — bill floating IPs' },
  analytics:      { queue: 'analytics',        cron: '30 0 * * *',      handler: runAnalyticsSnapshot, description: '00:30 daily — revenue/MRR snapshot' },
  backups:        { queue: 'backups',          cron: '*/30 * * * *',    handler: runBackupRunner,      description: 'every 30 min — run due backup schedules' },
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
