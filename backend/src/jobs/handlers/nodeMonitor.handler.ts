import prisma from '../../utils/prisma'
import { ProxmoxService } from '../../services/proxmox.service'
import emailService from '../../services/email.service'
import { emitToAdmin } from '../../services/socket.service'
import logger from '../../utils/logger'

const failureCounts = new Map<string, number>()

export async function runNodeMonitor(_data: { ts: number }) {
  const nodes = await prisma.node.findMany({
    where: { isActive: true },
    include: { region: true },
  })

  for (const node of nodes) {
    try {
      const proxmox = new ProxmoxService(node)
      const stats = await proxmox.getNodeStatus()

      const usedCpu = Math.round(stats.cpu * node.totalCpu)
      const usedRamGB = Math.round(stats.memory.used / 1024 / 1024 / 1024)
      const usedDiskGB = Math.round(stats.rootfs.used / 1024 / 1024 / 1024)
      const ramRatio = stats.memory.total > 0 ? stats.memory.used / stats.memory.total : 0
      const newStatus =
        ramRatio > 0.9 ? 'DEGRADED' :
        node.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'ONLINE'

      await prisma.node.update({
        where: { id: node.id },
        data: { usedCpu, usedRamGB, usedDiskGB, status: newStatus, lastSyncAt: new Date() },
      })

      failureCounts.delete(node.id)

      if (ramRatio > 0.9) {
        emitToAdmin('admin:alert', {
          severity: 'critical',
          message: `Node ${node.name} RAM critical: ${Math.round(ramRatio * 100)}%`,
          nodeId: node.id,
        })
      }
    } catch (error: any) {
      const fails = (failureCounts.get(node.id) || 0) + 1
      failureCounts.set(node.id, fails)

      if (fails >= 3 && node.status !== 'OFFLINE') {
        await prisma.node.update({
          where: { id: node.id },
          data: { status: 'OFFLINE' },
        })
        emitToAdmin('node:offline', { nodeId: node.id, name: node.name, region: node.region.name })

        const admins = await prisma.user.findMany({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        })
        for (const admin of admins) {
          await emailService
            .sendCustomEmail(
              admin.email,
              `🔴 Node ${node.name} is OFFLINE`,
              `<p>Node <strong>${node.name}</strong> in ${node.region.name} is not responding.</p><p>Error: ${error.message}</p>`
            )
            .catch(() => {})
        }
        logger.error({ nodeId: node.id, error: error.message }, 'node went offline')
      }
    }
  }
}
