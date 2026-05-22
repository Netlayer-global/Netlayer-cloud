import axios, { AxiosInstance } from 'axios'
import logger from '../utils/logger'

interface ServerMetrics {
  cpu: { t: number; v: number }[]
  ram: { t: number; v: number }[]
  disk: number
  networkIn: { t: number; v: number }[]
  networkOut: { t: number; v: number }[]
}

const pointsForRange = (range: string) =>
  range === '1h' ? 60 : range === '6h' ? 72 : range === '7d' ? 168 : 96

const stepForRange = (range: string) =>
  range === '1h' ? 60_000 :
  range === '6h' ? 5 * 60_000 :
  range === '7d' ? 60 * 60_000 :
  15 * 60_000

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const round = (n: number) => Math.round(n * 100) / 100

export class GrafanaService {
  private client: AxiosInstance | null = null
  private mockMode: boolean

  constructor() {
    this.mockMode = process.env.GRAFANA_MOCK_MODE === 'true' || !process.env.GRAFANA_URL
    if (!this.mockMode) {
      this.client = axios.create({
        baseURL: process.env.GRAFANA_URL!,
        headers: { Authorization: `Bearer ${process.env.GRAFANA_API_KEY}` },
        timeout: 15_000,
      })
    } else {
      logger.debug('Grafana: MOCK MODE')
    }
  }

  async getServerMetrics(serverIp: string, range: string): Promise<ServerMetrics> {
    if (this.mockMode) return this.generateMockMetrics(range)
    try {
      const datasourceId = parseInt(process.env.GRAFANA_DATASOURCE_ID || '1', 10)
      const seconds =
        range === '1h' ? 3600 : range === '6h' ? 21600 : range === '7d' ? 604800 : 86400
      const end = Math.floor(Date.now() / 1000)
      const start = end - seconds
      const step = Math.floor(seconds / pointsForRange(range))

      const queryRange = async (q: string) => {
        const { data } = await this.client!.get(
          `/api/datasources/proxy/${datasourceId}/api/v1/query_range`,
          { params: { query: q, start, end, step } }
        )
        return (data.data?.result?.[0]?.values || []).map((v: any) => ({
          t: v[0] * 1000,
          v: round(parseFloat(v[1])),
        }))
      }

      const [cpu, ram, networkIn, networkOut] = await Promise.all([
        queryRange(`100 - (avg(rate(node_cpu_seconds_total{mode="idle",instance="${serverIp}:9100"}[1m])) * 100)`),
        queryRange(`(1 - (node_memory_MemAvailable_bytes{instance="${serverIp}:9100"} / node_memory_MemTotal_bytes{instance="${serverIp}:9100"})) * 100`),
        queryRange(`rate(node_network_receive_bytes_total{instance="${serverIp}:9100",device!="lo"}[1m])`),
        queryRange(`rate(node_network_transmit_bytes_total{instance="${serverIp}:9100",device!="lo"}[1m])`),
      ])

      const diskRes = await this.client!.get(
        `/api/datasources/proxy/${datasourceId}/api/v1/query`,
        {
          params: {
            query: `100 - ((node_filesystem_avail_bytes{instance="${serverIp}:9100",mountpoint="/"} / node_filesystem_size_bytes{instance="${serverIp}:9100",mountpoint="/"}) * 100)`,
          },
        }
      )
      const disk = round(parseFloat(diskRes.data.data?.result?.[0]?.value?.[1] || '0'))

      return { cpu, ram, networkIn, networkOut, disk }
    } catch (e: any) {
      logger.warn('Grafana metrics query failed, falling back to mock', { error: e.message })
      return this.generateMockMetrics(range)
    }
  }

  async getNodeMetrics(_nodeHost: string): Promise<any> {
    if (this.mockMode) {
      return {
        cpu: round(0.2 + Math.random() * 0.4),
        memUsedPct: round(0.4 + Math.random() * 0.3),
        diskUsedPct: round(0.3 + Math.random() * 0.2),
        loadavg: [round(Math.random() * 2 + 0.5), round(Math.random() * 2.5 + 0.5), round(Math.random() * 3 + 0.5)],
      }
    }
    return null
  }

  async getDashboardList(): Promise<any[]> {
    if (this.mockMode) return []
    try {
      const { data } = await this.client!.get('/api/search?type=dash-db')
      return data || []
    } catch {
      return []
    }
  }

  static async testCredentials(
    url: string,
    apiKey: string
  ): Promise<{ success: boolean; dashboards?: number; error?: string }> {
    try {
      const c = axios.create({
        baseURL: url,
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10_000,
      })
      const { data } = await c.get('/api/search?type=dash-db')
      return { success: true, dashboards: Array.isArray(data) ? data.length : 0 }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.message || e.message }
    }
  }

  private generateMockMetrics(range: string): ServerMetrics {
    const points = pointsForRange(range)
    const step = stepForRange(range)
    const now = Date.now()
    const cpu: { t: number; v: number }[] = []
    const ram: { t: number; v: number }[] = []
    const networkIn: { t: number; v: number }[] = []
    const networkOut: { t: number; v: number }[] = []

    let cBase = 25, rBase = 60
    for (let i = points - 1; i >= 0; i--) {
      const t = now - i * step
      cBase = clamp(cBase + (Math.random() - 0.5) * 10 + Math.sin(i / 6) * 2, 5, 95)
      rBase = clamp(rBase + (Math.random() - 0.5) * 6, 30, 90)
      cpu.push({ t, v: round(cBase) })
      ram.push({ t, v: round(rBase) })
      networkIn.push({ t, v: round(Math.random() * 800_000 + 100_000) })
      networkOut.push({ t, v: round(Math.random() * 400_000 + 50_000) })
    }
    return { cpu, ram, networkIn, networkOut, disk: round(35 + Math.random() * 10) }
  }
}

export default new GrafanaService()
