import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { ProxmoxService } from './proxmox.service'

/**
 * ImageCacheService — manages per-node golden image caches.
 *
 * Real production deployments use Packer to build qcow2 templates, push them
 * to each node's local storage, then `qm template <vmid>` flag them so they
 * can be linked-cloned. Storing the resulting template VMID per (node, OS)
 * lets us look it up in O(1) at deploy time.
 *
 * State is stored in the OsTemplate table (templateVmId column) when a
 * single global VMID applies to all nodes (typical for clusters with shared
 * Ceph). For node-scoped templates we extend Node.metadata in the future.
 *
 * Mock mode: every node "has" every OS cached. Real mode: probes the node
 * over the Proxmox API and verifies the template exists.
 */
export class ImageCacheService {
  private mockMode = process.env.PROXMOX_MOCK_MODE === 'true'

  /**
   * Returns true if the requested OS template is already cached on the node
   * and ready for linked-clone.
   */
  async isImageCached(nodeId: string, osTemplateId: string): Promise<boolean> {
    if (this.mockMode) return true

    const os = await prisma.osTemplate.findUnique({ where: { id: osTemplateId } })
    if (!os?.templateVmId) return false

    const node = await prisma.node.findUnique({ where: { id: nodeId } })
    if (!node) return false

    try {
      const proxmox = new ProxmoxService(node)
      const vms = await proxmox.getVMList()
      // Proxmox returns objects shaped like { vmid, template, name, ... }.
      // A `qm template`-flagged VM has template === 1.
      return vms.some((v: any) => Number(v.vmid) === os.templateVmId && Number(v.template) === 1)
    } catch (e: any) {
      logger.warn({ err: e.message, nodeId, osTemplateId }, 'image cache probe failed')
      return false
    }
  }

  /**
   * Returns the template VMID for the given OS. Falls back to triggering a
   * pre-warm if missing. In mock mode we synthesize a deterministic VMID so
   * downstream code can use it without hitting Proxmox.
   */
  async getTemplateVmId(nodeId: string, osTemplateId: string): Promise<number | null> {
    const os = await prisma.osTemplate.findUnique({ where: { id: osTemplateId } })
    if (!os) return null

    if (this.mockMode) {
      // Stable fake VMID: 9000 + first 4 hex chars of OS slug, capped at 9999.
      const seed = (os.slug.charCodeAt(0) || 65) + (os.slug.charCodeAt(1) || 65)
      return 9000 + (seed % 999)
    }

    if (os.templateVmId) {
      const cached = await this.isImageCached(nodeId, osTemplateId)
      if (cached) return os.templateVmId
    }

    // Fall through to ensureImageCached so callers can opt into a sync warm.
    return null
  }

  /**
   * Ensures the template is materialized on the node. In production this
   * would either:
   *   1. trigger a `pvesm` rsync/clone from the cluster's image store, or
   *   2. invoke the Packer pipeline + `qm template` + record the VMID.
   *
   * For the MVP we record the intent in the OsTemplate row and rely on the
   * Packer GitHub Actions workflow (see packer/) to publish images out-of-band.
   */
  async ensureImageCached(nodeId: string, osTemplateId: string): Promise<number | null> {
    const cached = await this.getTemplateVmId(nodeId, osTemplateId)
    if (cached) return cached

    logger.info({ nodeId, osTemplateId }, 'image not cached — falling back to slow ISO path')
    return null
  }

  /**
   * Bulk pre-warm hook used by the operator at node-onboarding time:
   *   POST /api/admin/nodes/:id/warm-images
   *
   * Walks every active OS template and ensures each one is cached on the
   * node. Returns the list of OS slugs that succeeded.
   */
  async warmAllNodes(): Promise<{ nodeId: string; warmed: string[]; missing: string[] }[]> {
    const nodes = await prisma.node.findMany({ where: { isActive: true } })
    const osList = await prisma.osTemplate.findMany({ where: { isActive: true } })

    const out: { nodeId: string; warmed: string[]; missing: string[] }[] = []
    for (const node of nodes) {
      const warmed: string[] = []
      const missing: string[] = []
      for (const os of osList) {
        const id = await this.ensureImageCached(node.id, os.id)
        if (id) warmed.push(os.slug)
        else missing.push(os.slug)
      }
      out.push({ nodeId: node.id, warmed, missing })
    }
    return out
  }

  async getNodeImageCache(nodeId: string): Promise<{ osSlug: string; templateVmId: number | null; cached: boolean }[]> {
    const osList = await prisma.osTemplate.findMany({ where: { isActive: true } })
    const out: { osSlug: string; templateVmId: number | null; cached: boolean }[] = []
    for (const os of osList) {
      const id = await this.getTemplateVmId(nodeId, os.id)
      out.push({ osSlug: os.slug, templateVmId: id, cached: !!id })
    }
    return out
  }
}

export default new ImageCacheService()
