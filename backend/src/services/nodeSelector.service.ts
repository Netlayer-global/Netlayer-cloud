import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

export class NodeSelectorService {
  async selectBestNode(regionId: string, cpu: number, ram: number, disk: number) {
    const nodes = await prisma.node.findMany({
      where: { regionId, status: 'ONLINE', isActive: true },
    })

    const capable = nodes.filter(
      (n) =>
        n.totalCpu - n.usedCpu >= cpu &&
        n.totalRamGB - n.usedRamGB >= ram &&
        n.totalDiskGB - n.usedDiskGB >= disk &&
        n.currentVMs < n.maxVMs
    )

    if (capable.length === 0) {
      throw new AppError(
        'No capacity available in this region. Try another region.',
        503,
        'NO_CAPACITY'
      )
    }

    const scored = capable.map((n) => {
      const cpuScore = ((n.totalCpu - n.usedCpu) / n.totalCpu) * 100
      const ramScore = ((n.totalRamGB - n.usedRamGB) / n.totalRamGB) * 100
      const diskScore = ((n.totalDiskGB - n.usedDiskGB) / n.totalDiskGB) * 100
      const vmScore = ((n.maxVMs - n.currentVMs) / n.maxVMs) * 100
      return {
        node: n,
        score: cpuScore * 0.3 + ramScore * 0.4 + diskScore * 0.2 + vmScore * 0.1,
      }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0].node
  }
}

export default new NodeSelectorService()
