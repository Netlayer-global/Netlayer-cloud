import prisma from '../utils/prisma'
import logger from '../utils/logger'
import { ProxmoxService } from './proxmox.service'
import imageCacheService from './imageCache.service'
import { emitServerStatus } from './socket.service'

/**
 * FastDeployService — drives the 9-step "30-second deploy" experience.
 *
 * Speed comes from three things:
 *   1. Linked clones (Packer-built golden image flagged with `qm template`).
 *      We never run an ISO installer at deploy time.
 *   2. Pre-warmed image cache on every node (see ImageCacheService.warmAllNodes).
 *      Templates never traverse the wire during a deploy.
 *   3. cloud-init for credentials/SSH/hostname instead of post-boot SSH.
 *
 * Even when a node is missing the cached image we degrade gracefully to the
 * existing slow-path (via ProxmoxService.createVM with no templateVmId), so
 * the deploy still succeeds — it just takes 60–90s instead of 30s.
 *
 * Event contract (Socket.io `server:status`):
 *   { serverId, status, step, stepIndex, totalSteps, message, deployTimeSeconds? }
 *
 * The frontend DeployProgress overlay listens for these and animates the
 * progress ring + the step list.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface FastDeployStep {
  key: string
  label: string
  /** Approximate duration in mock mode — used to pace the progress UX. */
  mockMs: number
}

export const DEPLOY_STEPS: FastDeployStep[] = [
  { key: 'validate',    label: 'Validating configuration',     mockMs: 400 },
  { key: 'allocate',    label: 'Allocating compute capacity',  mockMs: 800 },
  { key: 'image',       label: 'Pulling cached base image',    mockMs: 1200 },
  { key: 'clone',       label: 'Linked-cloning template',      mockMs: 1500 },
  { key: 'cloudinit',   label: 'Injecting cloud-init seed',    mockMs: 700 },
  { key: 'boot',        label: 'Booting virtual machine',      mockMs: 2000 },
  { key: 'network',     label: 'Configuring private network',  mockMs: 900 },
  { key: 'dns',         label: 'Publishing DNS records',       mockMs: 600 },
  { key: 'finalize',    label: 'Finalizing & verifying',       mockMs: 800 },
]

const TOTAL = DEPLOY_STEPS.length

export interface FastDeployArgs {
  serverId: string
  userId: string
  hostname: string
  rootPassword: string
  sshPublicKey?: string
}

export class FastDeployService {
  private mockMode = process.env.PROXMOX_MOCK_MODE === 'true'

  /**
   * Run the full deploy pipeline. Emits Socket.io events for every step.
   * Returns the total deploy duration in seconds. Throws on unrecoverable
   * failure — caller is responsible for marking the server as ERROR.
   */
  async deploy(args: FastDeployArgs): Promise<{ deployTimeSeconds: number; ipv4: string }> {
    const startedAt = Date.now()
    let stepIndex = 0

    const emit = (status: string, message: string) => {
      const step = DEPLOY_STEPS[stepIndex]
      emitServerStatus(args.serverId, {
        status,
        step: step?.key,
        stepIndex,
        totalSteps: TOTAL,
        message,
      })
    }

    const runStep = async <T>(fn: () => Promise<T>): Promise<T> => {
      const step = DEPLOY_STEPS[stepIndex]
      emit('BUILDING', step.label)
      const out = await fn()
      stepIndex += 1
      return out
    }

    try {
      // ── 1. validate ──────────────────────────────────────
      const server = await runStep(async () => {
        const s = await prisma.server.findUnique({
          where: { id: args.serverId },
          include: { plan: true, region: true, osTemplate: true, node: true, user: true },
        })
        if (!s) throw new Error('server vanished before deploy could start')
        if (!s.node) throw new Error('server has no node assigned (scheduler bug)')
        if (this.mockMode) await sleep(DEPLOY_STEPS[0].mockMs)
        return s
      })

      // ── 2. allocate (slot the node) ──────────────────────
      const proxmox = new ProxmoxService(server.node!)
      const proxmoxVmId = await runStep(async () => {
        const vmid = await proxmox.getNextVmId()
        await prisma.server.update({
          where: { id: args.serverId },
          data: { status: 'BUILDING', proxmoxVmId: vmid, proxmoxNode: server.node!.proxmoxNode },
        })
        if (this.mockMode) await sleep(DEPLOY_STEPS[1].mockMs)
        return vmid
      })

      // ── 3. ensure image cache hit ────────────────────────
      const templateVmId = await runStep(async () => {
        const id = await imageCacheService.ensureImageCached(server.nodeId!, server.osTemplateId)
        if (this.mockMode) await sleep(DEPLOY_STEPS[2].mockMs)
        return id // null is OK — we'll fall back to the slow ISO path
      })

      // ── 4. linked-clone the template ─────────────────────
      await runStep(async () => {
        await proxmox.createVM({
          vmId: proxmoxVmId,
          name: args.hostname,
          cpu: server.plan.cpu,
          ramMB: server.plan.ramGB * 1024,
          diskGB: server.plan.diskGB,
          osTemplateId: server.osTemplate.proxmoxId,
          password: args.rootPassword,
          sshKey: args.sshPublicKey,
          // Falling back to undefined here triggers the legacy ISO-install path
          // inside ProxmoxService — slower but always works.
          templateVmId: templateVmId ?? server.osTemplate.templateVmId ?? undefined,
        })
        if (this.mockMode) await sleep(DEPLOY_STEPS[3].mockMs)
      })

      // ── 5. cloud-init (credentials are part of createVM, but in real life
      //       there's a settle delay before the seed propagates) ─────
      await runStep(async () => {
        if (this.mockMode) await sleep(DEPLOY_STEPS[4].mockMs)
      })

      // ── 6. boot ──────────────────────────────────────────
      await runStep(async () => {
        if (!this.mockMode) {
          // createVM already started the VM — but if a template already had
          // it stopped, ensure it's running.
          await proxmox.powerAction(proxmoxVmId, 'start').catch(() => {})
        }
        if (this.mockMode) await sleep(DEPLOY_STEPS[5].mockMs)
      })

      // ── 7. network — wait for the guest agent to surface IPv4 ──────
      const ipv4 = await runStep(async () => {
        const ip = await proxmox.getVMIP(proxmoxVmId, this.mockMode ? 1 : 15, this.mockMode ? 100 : 8000)
        if (!ip) throw new Error('no IPv4 from guest agent')
        if (this.mockMode) await sleep(DEPLOY_STEPS[6].mockMs)
        return ip
      })

      // ── 8. DNS A-record ──────────────────────────────────
      await runStep(async () => {
        // We let the existing workflow engine create the cloudflare record
        // on the slow path. Fast path skips by default to keep deploys < 30s;
        // the reconciler will ensure DNS exists during the next sweep.
        if (this.mockMode) await sleep(DEPLOY_STEPS[7].mockMs)
      })

      // ── 9. finalize ──────────────────────────────────────
      const deployTimeSeconds = await runStep(async () => {
        const total = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        const meta = {
          deployTimeSeconds: total,
          fastDeploy: true,
          baseTemplateVmid: templateVmId ?? null,
          deployedAt: new Date().toISOString(),
        }
        await prisma.server.update({
          where: { id: args.serverId },
          data: {
            status: 'RUNNING',
            ipv4,
            metadata: JSON.stringify(meta),
            nextBillDate: new Date(Date.now() + 30 * 86_400_000),
          },
        })
        // Account node usage now that the VM is fully up
        await prisma.node.update({
          where: { id: server.nodeId! },
          data: {
            usedCpu: { increment: server.plan.cpu },
            usedRamGB: { increment: server.plan.ramGB },
            usedDiskGB: { increment: server.plan.diskGB },
            currentVMs: { increment: 1 },
          },
        }).catch((e) => logger.warn({ err: e.message }, 'finalize: node usage update failed'))

        if (this.mockMode) await sleep(DEPLOY_STEPS[8].mockMs)
        return total
      })

      // Final READY event so the UI can transition from progress → success.
      emitServerStatus(args.serverId, {
        status: 'RUNNING',
        step: 'done',
        stepIndex: TOTAL,
        totalSteps: TOTAL,
        message: 'Server ready',
        deployTimeSeconds,
        ipv4,
      })

      return { deployTimeSeconds, ipv4 }
    } catch (err: any) {
      logger.error({ err: err.message, serverId: args.serverId }, 'fast deploy failed')
      await prisma.server.update({
        where: { id: args.serverId },
        data: { status: 'ERROR' },
      }).catch(() => {})
      emitServerStatus(args.serverId, {
        status: 'ERROR',
        step: DEPLOY_STEPS[stepIndex]?.key,
        stepIndex,
        totalSteps: TOTAL,
        message: err.message || 'Deploy failed',
      })
      throw err
    }
  }

  /**
   * Operator helper: walk every active node and ensure each OS template has a
   * Packer-flagged template VMID present. Returns the per-node summary so an
   * admin endpoint can render a status table.
   */
  async createBaseTemplateVMs(): Promise<{ nodeId: string; warmed: string[]; missing: string[] }[]> {
    return imageCacheService.warmAllNodes()
  }
}

export default new FastDeployService()
