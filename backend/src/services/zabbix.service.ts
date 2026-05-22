import axios from 'axios'
import logger from '../utils/logger'

interface ZabbixAlert {
  id: string
  hostId: string
  name: string
  severity: string
  time: Date
}

export class ZabbixService {
  private url: string
  private user: string
  private password: string
  private authToken: string = ''
  private mockMode: boolean

  constructor() {
    this.url = process.env.ZABBIX_URL || ''
    this.user = process.env.ZABBIX_USER || 'Admin'
    this.password = process.env.ZABBIX_PASSWORD || ''
    this.mockMode = process.env.ZABBIX_MOCK_MODE === 'true' || !this.url
    if (this.mockMode) logger.debug('Zabbix: MOCK MODE')
  }

  private async call(method: string, params: any, isAuth = false): Promise<any> {
    const body: any = {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }
    if (!isAuth) body.auth = this.authToken
    const { data } = await axios.post(`${this.url}/api_jsonrpc.php`, body, {
      headers: { 'Content-Type': 'application/json-rpc' },
      timeout: 15_000,
    })
    if (data.error) {
      // Re-auth on auth errors
      if (data.error.message?.toLowerCase().includes('authoriz') && !isAuth) {
        await this.authenticate()
        return this.call(method, params)
      }
      throw new Error(data.error.data || data.error.message)
    }
    return data.result
  }

  async authenticate(): Promise<void> {
    if (this.mockMode) {
      this.authToken = 'mock-zabbix-token'
      return
    }
    this.authToken = await this.call('user.login', { user: this.user, password: this.password }, true)
  }

  private async ensureAuth(): Promise<void> {
    if (!this.authToken) await this.authenticate()
  }

  async createHost(ip: string, hostname: string): Promise<string> {
    if (this.mockMode) {
      const id = `mock-host-${Date.now()}`
      logger.info(`[Zabbix MOCK] createHost ${hostname} (${ip}) → ${id}`)
      return id
    }
    await this.ensureAuth()
    const result = await this.call('host.create', {
      host: hostname,
      interfaces: [{ type: 1, main: 1, useip: 1, ip, dns: '', port: '10050' }],
      groups: [{ groupid: '2' }],
      templates: [{ templateid: '10001' }],
    })
    return result.hostids[0]
  }

  async deleteHost(hostId: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Zabbix MOCK] deleteHost ${hostId}`)
      return
    }
    await this.ensureAuth()
    await this.call('host.delete', [hostId])
  }

  async getAlerts(): Promise<ZabbixAlert[]> {
    if (this.mockMode) return []
    await this.ensureAuth()
    const result = await this.call('problem.get', {
      output: 'extend',
      selectHosts: 'extend',
      recent: true,
      sortfield: ['eventid'],
      sortorder: 'DESC',
    })
    return (result || []).map((p: any) => ({
      id: p.eventid,
      hostId: p.hosts?.[0]?.hostid || '',
      name: p.name,
      severity: ['unknown', 'info', 'warning', 'average', 'high', 'disaster'][Number(p.severity)] || 'unknown',
      time: new Date(parseInt(p.clock, 10) * 1000),
    }))
  }

  async acknowledgeAlert(alertId: string, message: string): Promise<void> {
    if (this.mockMode) return
    await this.ensureAuth()
    await this.call('event.acknowledge', { eventids: alertId, action: 6, message })
  }

  async getHostStatus(hostId: string): Promise<'available' | 'unavailable' | 'unknown'> {
    if (this.mockMode) return 'available'
    await this.ensureAuth()
    const result = await this.call('host.get', { hostids: [hostId], output: ['available'] })
    const code = result?.[0]?.available
    if (code === '1') return 'available'
    if (code === '2') return 'unavailable'
    return 'unknown'
  }

  static async testCredentials(
    url: string,
    user: string,
    password: string
  ): Promise<{ success: boolean; version?: string; hostCount?: number; error?: string }> {
    try {
      const versionRes = await axios.post(
        `${url}/api_jsonrpc.php`,
        { jsonrpc: '2.0', method: 'apiinfo.version', params: {}, id: 1 },
        { headers: { 'Content-Type': 'application/json-rpc' }, timeout: 10_000 }
      )
      if (versionRes.data.error) return { success: false, error: versionRes.data.error.data }

      const loginRes = await axios.post(
        `${url}/api_jsonrpc.php`,
        { jsonrpc: '2.0', method: 'user.login', params: { user, password }, id: 2 },
        { headers: { 'Content-Type': 'application/json-rpc' }, timeout: 10_000 }
      )
      if (loginRes.data.error) return { success: false, error: loginRes.data.error.data }

      const hostsRes = await axios.post(
        `${url}/api_jsonrpc.php`,
        {
          jsonrpc: '2.0',
          method: 'host.get',
          params: { countOutput: true },
          auth: loginRes.data.result,
          id: 3,
        },
        { headers: { 'Content-Type': 'application/json-rpc' }, timeout: 10_000 }
      )

      return { success: true, version: versionRes.data.result, hostCount: parseInt(hostsRes.data.result, 10) }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}

export default new ZabbixService()
