import axios from 'axios'
import prisma from '../../utils/prisma'
import logger from '../../utils/logger'
import emailService from '../../services/email.service'
import smsService from '../../services/sms.service'
import { emitToUser } from '../../services/socket.service'
import { notify } from '../../services/notify.service'

/**
 * Alert evaluator. Runs every 5 minutes (see jobs/index.ts cron).
 *
 * For each active rule:
 *   1. Fetch the metric series for the rule's window (`duration` minutes).
 *   2. If every sample in the window violates the threshold, fire.
 *   3. Cooldown: never fire the same rule more than once every 30 minutes.
 *   4. Channels: email + SMS (if user has phone) + webhook (with HMAC payload).
 *   5. Always create an in-app Notification + emit a Socket.io event.
 *
 * Determinism: the entire evaluation is read-then-write. Two runs over the
 * same window produce identical decisions.
 */

const COOLDOWN_MINUTES = 30

const subMinutes = (d: Date, m: number) => new Date(d.getTime() - m * 60_000)
const diffMinutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

interface MetricRow {
  cpu: number
  ram: number
  disk: number
  networkIn: number
  networkOut: number
  timestamp: Date
}

const valueOf = (row: MetricRow, metric: string): number => {
  switch (metric) {
    case 'cpu_percent':  return row.cpu
    case 'ram_percent':  return row.ram
    case 'disk_percent': return row.disk
    case 'network_in':   return row.networkIn
    case 'network_out':  return row.networkOut
    default: return 0
  }
}

const violates = (value: number, condition: string, threshold: number): boolean => {
  if (condition === 'gt') return value > threshold
  if (condition === 'lt') return value < threshold
  if (condition === 'eq') return Math.abs(value - threshold) < 1
  return false
}

export async function alertEvaluatorHandler(): Promise<void> {
  const rules = await prisma.alertRule.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, email: true, firstName: true, phone: true } },
      server: { select: { id: true, name: true, ipv4: true } },
    },
  })

  if (rules.length === 0) return

  const now = new Date()

  for (const rule of rules) {
    try {
      // Cooldown gate
      if (rule.lastFiredAt && diffMinutes(now, rule.lastFiredAt) < COOLDOWN_MINUTES) continue

      // Resolve target servers (rule may be scoped to a single server or all of user's)
      const targetServers = rule.serverId
        ? rule.server
          ? [rule.server]
          : []
        : await prisma.server.findMany({
            where: { userId: rule.userId, status: 'RUNNING', deletedAt: null },
            select: { id: true, name: true, ipv4: true },
          })

      for (const server of targetServers) {
        const since = subMinutes(now, rule.duration + 1)
        const metrics = await prisma.serverMetric.findMany({
          where: { serverId: server.id, timestamp: { gte: since } },
          orderBy: { timestamp: 'desc' },
          take: rule.duration + 2,
        })
        if (metrics.length < rule.duration) continue

        const recent = metrics.slice(0, rule.duration)
        const values = recent.map((m) => valueOf(m, rule.metric))
        const triggered = values.every((v) => violates(v, rule.condition, rule.threshold))
        if (!triggered) continue

        const channels = safeJSON<string[]>(rule.channels as any, [])
        const direction = rule.condition === 'gt' ? 'above' : rule.condition === 'lt' ? 'below' : 'at'
        const msg = `Alert "${rule.name}": ${rule.metric.replace('_', ' ')} is ${direction} ${rule.threshold} on ${server.name}`

        await prisma.alertRule.update({ where: { id: rule.id }, data: { lastFiredAt: now } })

        // Email
        if (channels.includes('email')) {
          await emailService
            .sendCustomEmail(
              rule.user.email,
              `🔔 Alert: ${rule.name}`,
              `<p>${msg}</p><p>Server: <a href="${process.env.FRONTEND_URL || 'https://netlayer.com'}/dashboard/servers/${server.id}" style="color:#c8f135">${server.name}</a></p>`
            )
            .catch((e) => logger.warn({ err: e.message }, 'alert email failed'))
        }

        // SMS
        if (channels.includes('sms') && rule.user.phone) {
          await smsService
            .send(rule.user.phone, msg.slice(0, 160))
            .catch((e) => logger.warn({ err: e.message }, 'alert sms failed'))
        }

        // Webhook
        if (channels.includes('webhook') && rule.webhookUrl) {
          await axios
            .post(
              rule.webhookUrl,
              {
                rule: { id: rule.id, name: rule.name },
                server: { id: server.id, name: server.name, ip: server.ipv4 },
                metric: rule.metric,
                value: values[0],
                threshold: rule.threshold,
                condition: rule.condition,
                timestamp: now.toISOString(),
              },
              { timeout: 5_000 }
            )
            .catch((e) => logger.warn({ url: rule.webhookUrl, err: e.message }, 'alert webhook failed'))
        }

        // Always create in-app notification + socket event
        await notify({
          userId: rule.userId,
          type: 'alert_fired',
          title: `Alert: ${rule.name}`,
          message: msg,
          link: `/dashboard/servers/${server.id}`,
        })

        emitToUser(rule.userId, 'server:alert', {
          serverId: server.id,
          ruleId: rule.id,
          ruleName: rule.name,
          message: msg,
          severity: 'warning',
        })
      }
    } catch (err: any) {
      logger.warn({ err: err.message, ruleId: rule.id }, 'alert evaluation failed for rule')
    }
  }
}


export async function runAlertEvaluator(_data?: any) {
  await alertEvaluatorHandler()
}
