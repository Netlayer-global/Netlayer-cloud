/**
 * Public-site types — only the bits the marketing site renders.
 * Auth/server types live in the dashboard at frontend/src/types.
 */

export interface Plan {
  id: string
  name: string
  slug: string
  category?: 'compute' | 'bare-metal' | 'storage' | 'gpu'
  cpu: number
  ramGB: number
  diskGB: number
  bandwidthTB: number
  priceMonthly: number
  priceHourly: number
  priceInr: number
  priceYearly?: number
  hourlyEnabled?: boolean
  monthlyEnabled?: boolean
  yearlyEnabled?: boolean
  cpuModel?: string | null
  cpuCores?: number | null
  cpuThreads?: number | null
  diskType?: 'nvme' | 'ssd' | 'hdd'
  diskCount?: number
  raidSupported?: string | string[]
  ipv4Included?: number
  ipv6Included?: number
  stockTotal?: number
  stockReserved?: number
  stockAvailable?: number
  isPopular: boolean
  isActive: boolean
  sortOrder: number
}

export interface Region {
  id: string
  name: string
  slug: string
  country: string
  countryCode: string
  city: string
  flag: string
  isActive: boolean
  latencyMs?: number
}

export interface OsTemplate {
  id: string
  name: string
  slug: string
  version: string
  family: 'LINUX' | 'WINDOWS' | 'BSD'
  logo: string
  isActive: boolean
}
