import prisma from '../../utils/prisma'
import zabbixService from '../../services/zabbix.service'
import { emitToUser } from '../../services/socket.service'
import logger from '../../utils/logger'

export async function runZabbixSync(_data: { ts: number }) {
  try {
    await zabbixService.authenticate()
    const alerts = await zabbixService.getAlerts()

    for (const alert of alerts) {
      const server = await prisma.server.findFirst({
        where: { zabbixHostId: alert.hostId },
      })
      if (!server) continue

      const existing = await prisma.notification.findFirst({
        where: {
          userId: server.userId,
          type: 'zabbix_alert',
          message: { contains: alert.id },
          isRead: false,
        },
      })
      if (existing) continue

      await prisma.notification.create({
        data: {
          userId: server.userId,
          type: 'zabbix_alert',
          title: `Alert: ${server.name}`,
          message: `${alert.name} (${alert.id})`,
          link: `/dashboard/servers/${server.id}`,
        },
      })

      emitToUser(server.userId, 'server:alert', {
        serverId: server.id,
        severity: alert.severity,
        message: alert.name,
      })
    }
  } catch (e: any) {
    logger.warn({ error: e.message }, 'Zabbix sync failed')
  }
}
