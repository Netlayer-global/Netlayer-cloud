import axios, { AxiosInstance } from 'axios'
import https from 'https'
import logger from '../utils/logger'

interface NodeCreds {
  proxmoxHost: string
  proxmoxNode: string
  proxmoxTokenId: string
  proxmoxTokenSecret: string
}

interface CreateVMOpts {
  vmId: number
  name: string
  cpu: number
  ramMB: number
  diskGB: number
  osTemplateId: string
  password: string
  sshKey?: string
}

interface VMStatus {
  status: string
  cpu: number
  mem: number
  maxmem: number
  uptime: number
  netin: number
  netout: number
  disk: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class ProxmoxService {
  private client: AxiosInstance | null = null
  private nodeName: string = 'pve'
  private mockMode: boolean

  constructor(node?: NodeCreds) {
    this.mockMode = process.env.PROXMOX_MOCK_MODE === 'true' || !node
    if (node && !this.mockMode) {
      this.nodeName = node.proxmoxNode
      this.client = axios.create({
        baseURL: `${node.proxmoxHost}/api2/json`,
        headers: {
          Authorization: `PVEAPIToken=${node.proxmoxTokenId}=${node.proxmoxTokenSecret}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 30_000,
      })
    } else if (this.mockMode) {
      logger.debug('Proxmox: MOCK MODE')
    }
  }

  async testConnection(): Promise<{ success: boolean; nodeInfo?: any; error?: string }> {
    if (this.mockMode) {
      return {
        success: true,
        nodeInfo: { cpu: 0.32, memory: 0.55, uptime: 86400 * 14, version: '8.1.4 (mock)' },
      }
    }
    try {
      const { data } = await this.client!.get(`/nodes/${this.nodeName}/status`)
      return {
        success: true,
        nodeInfo: {
          cpu: data.data.cpu,
          memory: data.data.memory,
          uptime: data.data.uptime,
          version: data.data.pveversion || 'unknown',
        },
      }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.errors || e.message }
    }
  }

  async getNextVmId(): Promise<number> {
    if (this.mockMode) return Math.floor(Math.random() * 800) + 100
    const { data } = await this.client!.get('/cluster/nextid')
    return parseInt(data.data, 10)
  }

  async createVM(opts: CreateVMOpts): Promise<{ vmId: number; taskId: string }> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] createVM ${opts.vmId} (${opts.name})`)
      await sleep(2000)
      return { vmId: opts.vmId, taskId: `UPID:mock:${Date.now().toString(16)}` }
    }

    const params = new URLSearchParams({
      vmid: String(opts.vmId),
      name: opts.name,
      cores: String(opts.cpu),
      memory: String(opts.ramMB),
      ostype: opts.osTemplateId.includes('win') ? 'win11' : 'l26',
      ide2: `${opts.osTemplateId},media=cdrom`,
      scsihw: 'virtio-scsi-pci',
      scsi0: `local-lvm:${opts.diskGB}`,
      net0: 'virtio,bridge=vmbr0',
      cipassword: opts.password,
      ciuser: 'root',
      agent: '1',
    })
    if (opts.sshKey) params.append('sshkeys', encodeURIComponent(opts.sshKey))

    const { data } = await this.client!.post(
      `/nodes/${this.nodeName}/qemu`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    await this.client!.post(`/nodes/${this.nodeName}/qemu/${opts.vmId}/status/start`).catch(() => {})
    return { vmId: opts.vmId, taskId: data.data }
  }

  async deleteVM(vmId: number): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] deleteVM ${vmId}`)
      await sleep(1500)
      return
    }
    try {
      const status = await this.getVMStatus(vmId)
      if (status.status === 'running') {
        await this.powerAction(vmId, 'stop')
        await sleep(10_000)
      }
    } catch {}
    await this.client!.delete(
      `/nodes/${this.nodeName}/qemu/${vmId}?purge=1&destroy-unreferenced-disks=1`
    )
  }

  async powerAction(vmId: number, action: 'start' | 'stop' | 'reset' | 'shutdown'): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] powerAction ${vmId}: ${action}`)
      await sleep(1000)
      return
    }
    await this.client!.post(`/nodes/${this.nodeName}/qemu/${vmId}/status/${action}`)
  }

  async getVMStatus(vmId: number): Promise<VMStatus> {
    if (this.mockMode) {
      return {
        status: 'running',
        cpu: Math.random() * 0.4 + 0.05,
        mem: 2048 * 1024 * 1024,
        maxmem: 4096 * 1024 * 1024,
        uptime: 86400,
        netin: Math.random() * 1_000_000,
        netout: Math.random() * 500_000,
        disk: 0,
      }
    }
    const { data } = await this.client!.get(`/nodes/${this.nodeName}/qemu/${vmId}/status/current`)
    return {
      status: data.data.status,
      cpu: data.data.cpu || 0,
      mem: data.data.mem || 0,
      maxmem: data.data.maxmem || 0,
      uptime: data.data.uptime || 0,
      netin: data.data.netin || 0,
      netout: data.data.netout || 0,
      disk: data.data.disk || 0,
    }
  }

  async getVMIP(vmId: number, retries = 15, delay = 8000): Promise<string | null> {
    if (this.mockMode) {
      await sleep(5000)
      const ip = `103.21.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`
      logger.info(`[Proxmox MOCK] getVMIP ${vmId} → ${ip}`)
      return ip
    }
    for (let i = 0; i < retries; i++) {
      try {
        const { data } = await this.client!.get(
          `/nodes/${this.nodeName}/qemu/${vmId}/agent/network-get-interfaces`
        )
        const interfaces = data.data?.result || []
        for (const iface of interfaces) {
          if (iface.name === 'lo') continue
          for (const ip of iface['ip-addresses'] || []) {
            if (
              ip['ip-address-type'] === 'ipv4' &&
              ip['ip-address'] !== '127.0.0.1' &&
              !ip['ip-address'].startsWith('169.254')
            ) {
              return ip['ip-address']
            }
          }
        }
      } catch {}
      await sleep(delay)
    }
    return null
  }

  async getVMConsole(vmId: number): Promise<{ ticket: string; port: number; upid: string }> {
    if (this.mockMode) {
      return { ticket: `mock-ticket-${vmId}`, port: 5900, upid: 'UPID:mock:console' }
    }
    const { data } = await this.client!.post(`/nodes/${this.nodeName}/qemu/${vmId}/vncproxy`)
    return {
      ticket: data.data.ticket,
      port: parseInt(data.data.port, 10),
      upid: data.data.upid,
    }
  }

  async getNodeStatus(): Promise<{
    cpu: number
    memory: { used: number; total: number }
    rootfs: { used: number; total: number }
    uptime: number
    loadavg: number[]
  }> {
    if (this.mockMode) {
      const totalRam = 128 * 1024 * 1024 * 1024
      const totalDisk = 3840 * 1024 * 1024 * 1024
      return {
        cpu: Math.random() * 0.4 + 0.2,
        memory: { used: totalRam * (0.4 + Math.random() * 0.3), total: totalRam },
        rootfs: { used: totalDisk * (0.3 + Math.random() * 0.2), total: totalDisk },
        uptime: 86400 * 30,
        loadavg: [1.2, 1.5, 1.8],
      }
    }
    const { data } = await this.client!.get(`/nodes/${this.nodeName}/status`)
    return {
      cpu: data.data.cpu,
      memory: { used: data.data.memory.used, total: data.data.memory.total },
      rootfs: { used: data.data.rootfs.used, total: data.data.rootfs.total },
      uptime: data.data.uptime,
      loadavg: data.data.loadavg || [],
    }
  }

  async getVMList(): Promise<any[]> {
    if (this.mockMode) return []
    const { data } = await this.client!.get(`/nodes/${this.nodeName}/qemu`)
    return data.data || []
  }

  async createSnapshot(vmId: number, name: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] createSnapshot ${vmId} ${name}`)
      await sleep(2000)
      return
    }
    const params = new URLSearchParams({ snapname: name })
    await this.client!.post(`/nodes/${this.nodeName}/qemu/${vmId}/snapshot`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteSnapshot(vmId: number, snapname: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] deleteSnapshot ${vmId} ${snapname}`)
      await sleep(1000)
      return
    }
    await this.client!.delete(`/nodes/${this.nodeName}/qemu/${vmId}/snapshot/${snapname}`)
  }

  async listSnapshots(vmId: number): Promise<any[]> {
    if (this.mockMode) return []
    const { data } = await this.client!.get(`/nodes/${this.nodeName}/qemu/${vmId}/snapshot`)
    return data.data || []
  }

  async migrateVM(vmId: number, targetNode: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] migrateVM ${vmId} → ${targetNode}`)
      await sleep(3000)
      return
    }
    const params = new URLSearchParams({ target: targetNode, online: '1' })
    await this.client!.post(`/nodes/${this.nodeName}/qemu/${vmId}/migrate`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  /**
   * Attach a freshly-created Ceph/RBD disk to an existing VM. Returns the
   * Proxmox config key (e.g. "scsi5") so subsequent detaches can reference
   * the exact slot we used. In mock mode we just allocate the next available
   * slot virtually.
   */
  async attachDisk(vmId: number, sizeGB: number, _name: string): Promise<string> {
    if (this.mockMode) {
      const slot = `scsi${Math.floor(Math.random() * 10) + 1}`
      logger.info(`[Proxmox MOCK] attachDisk ${vmId} ${slot} ${sizeGB}G`)
      await sleep(1000)
      return slot
    }
    // Find next free scsi slot.
    let slot = 'scsi1'
    try {
      const { data } = await this.client!.get(`/nodes/${this.nodeName}/qemu/${vmId}/config`)
      const cfg: Record<string, string> = data.data || {}
      for (let i = 1; i <= 30; i++) {
        if (!cfg[`scsi${i}`]) { slot = `scsi${i}`; break }
      }
    } catch (e: any) {
      logger.warn(`Could not read VM config for slot lookup: ${e.message}`)
    }
    const params = new URLSearchParams({ [slot]: `local-lvm:${sizeGB}` })
    await this.client!.put(`/nodes/${this.nodeName}/qemu/${vmId}/config`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return slot
  }

  async detachDisk(vmId: number, diskKey: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Proxmox MOCK] detachDisk ${vmId} ${diskKey}`)
      await sleep(800)
      return
    }
    const params = new URLSearchParams({ delete: diskKey })
    await this.client!.put(`/nodes/${this.nodeName}/qemu/${vmId}/config`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  static async testCredentials(
    host: string,
    nodeId: string,
    tokenId: string,
    tokenSecret: string
  ): Promise<{ success: boolean; nodeInfo?: any; error?: string }> {
    try {
      const client = axios.create({
        baseURL: `${host}/api2/json`,
        headers: { Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 10_000,
      })
      const { data } = await client.get(`/nodes/${nodeId}/status`)
      return {
        success: true,
        nodeInfo: {
          cpu: data.data.cpu,
          memory: data.data.memory,
          uptime: data.data.uptime,
          version: data.data.pveversion,
        },
      }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.errors || e.message }
    }
  }
}

export default new ProxmoxService()
