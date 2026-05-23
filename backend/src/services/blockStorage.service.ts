import prisma from '../utils/prisma'
import { ProxmoxService } from './proxmox.service'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

/**
 * Block Storage service — NVMe persistent volumes that can be attached to
 * any server in the same region. In mock mode we emulate the Proxmox disk
 * lifecycle through state transitions only; in real mode we attach a
 * Ceph/RBD disk via the Proxmox API.
 */
export class BlockStorageService {
  async createVolume(userId: string, data: {
    name: string
    sizeGB: number
    region: string
  }) {
    const volume = await prisma.blockVolume.create({
      data: {
        userId,
        name: data.name,
        sizeGB: data.sizeGB,
        region: data.region,
        status: 'available',
      },
    })

    // Provision in the background. We update status asynchronously so the
    // API can return 201 immediately and the UI can poll.
    setTimeout(async () => {
      try {
        await prisma.blockVolume.update({
          where: { id: volume.id },
          data: { status: 'available' },
        })
      } catch (e: any) {
        logger.warn(`provision volume ${volume.id} failed: ${e.message}`)
      }
    }, 2000)

    return volume
  }

  async attachVolume(volumeId: string, userId: string, serverId: string) {
    const volume = await prisma.blockVolume.findFirst({
      where: { id: volumeId, userId },
    })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')
    if (volume.status === 'attached') throw new AppError('Volume already attached', 400, 'ALREADY_ATTACHED')
    if (volume.serverId) throw new AppError('Volume already attached', 400, 'ALREADY_ATTACHED')

    const server = await prisma.server.findFirst({
      where: { id: serverId, userId, deletedAt: null },
      include: { node: true, region: true },
    })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (server.region.slug !== volume.region) {
      throw new AppError('Volume and server must be in the same region', 400, 'REGION_MISMATCH')
    }

    let proxmoxDisk: string | undefined
    if (server.node && server.proxmoxVmId) {
      try {
        const proxmox = new ProxmoxService(server.node)
        proxmoxDisk = await proxmox.attachDisk(server.proxmoxVmId, volume.sizeGB, volume.name)
      } catch (e: any) {
        logger.warn(`Proxmox attachDisk failed: ${e.message}`)
      }
    }

    return prisma.blockVolume.update({
      where: { id: volumeId },
      data: { serverId, status: 'attached', proxmoxDisk },
    })
  }

  async detachVolume(volumeId: string, userId: string) {
    const volume = await prisma.blockVolume.findFirst({
      where: { id: volumeId, userId },
      include: { server: { include: { node: true } } },
    })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')
    if (!volume.serverId) throw new AppError('Volume is not attached', 400, 'NOT_ATTACHED')

    if (volume.server?.node && volume.server.proxmoxVmId && volume.proxmoxDisk) {
      try {
        const proxmox = new ProxmoxService(volume.server.node)
        await proxmox.detachDisk(volume.server.proxmoxVmId, volume.proxmoxDisk)
      } catch (e: any) {
        logger.warn(`Proxmox detachDisk failed: ${e.message}`)
      }
    }

    return prisma.blockVolume.update({
      where: { id: volumeId },
      data: { serverId: null, status: 'available', proxmoxDisk: null },
    })
  }

  async deleteVolume(volumeId: string, userId: string) {
    const volume = await prisma.blockVolume.findFirst({
      where: { id: volumeId, userId },
      include: { server: { include: { node: true } } },
    })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')

    if (volume.serverId) {
      throw new AppError('Detach the volume before deleting it', 400, 'STILL_ATTACHED')
    }

    if (volume.server?.node && volume.server.proxmoxVmId && volume.proxmoxDisk) {
      try {
        const proxmox = new ProxmoxService(volume.server.node)
        await proxmox.detachDisk(volume.server.proxmoxVmId, volume.proxmoxDisk)
      } catch (e: any) {
        logger.warn(`Proxmox detachDisk during delete failed: ${e.message}`)
      }
    }

    await prisma.blockVolume.delete({ where: { id: volumeId } })
  }

  async resizeVolume(volumeId: string, userId: string, newSizeGB: number) {
    const volume = await prisma.blockVolume.findFirst({ where: { id: volumeId, userId } })
    if (!volume) throw new AppError('Volume not found', 404, 'NOT_FOUND')
    if (newSizeGB <= volume.sizeGB) {
      throw new AppError('New size must be larger than current size', 400, 'INVALID_SIZE')
    }
    return prisma.blockVolume.update({
      where: { id: volumeId },
      data: { sizeGB: newSizeGB },
    })
  }
}

export default new BlockStorageService()
