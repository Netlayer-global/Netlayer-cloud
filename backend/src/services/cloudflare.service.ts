import axios, { AxiosInstance } from 'axios'
import logger from '../utils/logger'

export class CloudflareService {
  private client: AxiosInstance | null = null
  private zoneId: string
  private domain: string
  private mockMode: boolean

  constructor() {
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || ''
    this.domain = process.env.CLOUDFLARE_DOMAIN || 'netlayer.com'
    this.mockMode = process.env.CLOUDFLARE_MOCK_MODE === 'true' || !process.env.CLOUDFLARE_API_TOKEN

    if (!this.mockMode) {
      this.client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      })
    } else {
      logger.debug('Cloudflare: MOCK MODE')
    }
  }

  async testConnection(): Promise<{ success: boolean; zoneName?: string; error?: string }> {
    if (this.mockMode) return { success: true, zoneName: this.domain }
    try {
      const { data } = await this.client!.get(`/zones/${this.zoneId}`)
      return { success: true, zoneName: data.result.name }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.errors?.[0]?.message || e.message }
    }
  }

  async createARecord(hostname: string, ip: string): Promise<{ id: string; fqdn: string }> {
    if (this.mockMode) {
      const id = `mock-${Date.now()}`
      logger.info(`[Cloudflare MOCK] createARecord ${hostname} → ${ip} (${id})`)
      return { id, fqdn: hostname }
    }
    const { data } = await this.client!.post(`/zones/${this.zoneId}/dns_records`, {
      type: 'A',
      name: hostname,
      content: ip,
      ttl: 1,
      proxied: false,
    })
    return { id: data.result.id, fqdn: data.result.name }
  }

  async deleteRecord(recordId: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Cloudflare MOCK] deleteRecord ${recordId}`)
      return
    }
    await this.client!.delete(`/zones/${this.zoneId}/dns_records/${recordId}`)
  }

  async updateRecord(recordId: string, ip: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[Cloudflare MOCK] updateRecord ${recordId} → ${ip}`)
      return
    }
    await this.client!.patch(`/zones/${this.zoneId}/dns_records/${recordId}`, { content: ip })
  }

  async listRecords(): Promise<any[]> {
    if (this.mockMode) return []
    const { data } = await this.client!.get(`/zones/${this.zoneId}/dns_records?type=A&per_page=100`)
    return data.result || []
  }

  static async testCredentials(
    apiToken: string,
    zoneId: string
  ): Promise<{ success: boolean; zoneName?: string; recordCount?: number; error?: string }> {
    try {
      const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: { Authorization: `Bearer ${apiToken}` },
        timeout: 10_000,
      })
      const { data: zoneData } = await client.get(`/zones/${zoneId}`)
      const { data: recs } = await client.get(`/zones/${zoneId}/dns_records?per_page=1`)
      return {
        success: true,
        zoneName: zoneData.result.name,
        recordCount: recs.result_info?.total_count || 0,
      }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.errors?.[0]?.message || e.message }
    }
  }
}

export default new CloudflareService()
