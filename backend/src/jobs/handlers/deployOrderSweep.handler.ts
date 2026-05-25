import deployOrderService from '../../services/deployOrder.service'
import logger from '../../utils/logger'

/**
 * Round 22 — sweep expired deploy orders.
 *
 * A deploy order has 24h to be paid. After that the pre-allocated server
 * row is freed. Without this sweep, capacity stays "reserved" forever and
 * `nodeSelector` thinks the node is fuller than it is.
 *
 * Cron: every 15 minutes — see jobs/index.ts.
 */
export async function runDeployOrderSweep(_data?: any) {
  try {
    const cancelled = await deployOrderService.sweepExpired()
    if (cancelled > 0) {
      logger.info({ cancelled }, 'expired deploy orders cleaned up')
    }
  } catch (e: any) {
    logger.error({ err: e.message }, 'deploy order sweep failed')
  }
}
