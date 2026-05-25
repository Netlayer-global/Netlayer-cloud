export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT' | 'BILLING'
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  balance: number
  emailVerified: boolean
  phone?: string | null
  phoneVerified?: boolean
  country?: string
  timezone?: string
  currency?: string
  language?: string
  creditLimit?: number
  twoFactorEnabled?: boolean
  onboardingDone?: boolean
  billingMode?: 'retail' | 'wallet' | 'enterprise'
  createdAt: string
  lastLoginAt?: string | null
}

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

export type ServerStatus =
  | 'PENDING'
  | 'BUILDING'
  | 'RUNNING'
  | 'STOPPED'
  | 'REBOOTING'
  | 'ERROR'
  | 'DELETING'
  | 'DELETED'

export interface Server {
  id: string
  name: string
  hostname: string
  ipv4: string | null
  ipv6: string | null
  status: ServerStatus
  plan: Plan
  region: Region
  osTemplate: OsTemplate
  specs: { cpu: number; ram: number; disk: number }
  bandwidth: { used: number; limit: number }
  rootPassword?: string
  createdAt: string
  updatedAt: string
  nodeId?: string | null
}

export interface Invoice {
  id: string
  invoiceNumber?: string
  userId: string
  amount: number
  tax?: number
  total?: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  items: any[]
  dueDate: string
  paidAt: string | null
  paymentMethod?: string | null
  createdAt: string
}

export interface SshKey {
  id: string
  name: string
  publicKey: string
  fingerprint: string
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface Metrics {
  cpu: { t: number; v: number }[]
  ram: { t: number; v: number }[]
  networkIn: { t: number; v: number }[]
  networkOut: { t: number; v: number }[]
  disk: number
}

export interface Usage {
  balance: number
  total: number
  items: {
    serverId: string
    serverName: string
    plan: string
    region: string
    days: number
    amount: number
  }[]
  period: { start: string; end: string }
}

export interface AdminStats {
  users: { total: number; active: number; suspended: number; newToday: number; newThisMonth: number }
  servers: { total: number; running: number; stopped: number; building: number; error: number }
  revenue: { today: number; thisMonth: number; lastMonth: number; total: number }
  tickets: { open: number; inProgress: number; resolved: number }
  nodes: { total: number; online: number; offline: number; degraded: number }
}

export interface ProxmoxNode {
  id: string
  name: string
  region: Region
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE'
  totalCpu: number
  usedCpu: number
  totalRamGB: number
  usedRamGB: number
  totalDiskGB: number
  usedDiskGB: number
  maxVMs: number
  currentVMs: number
  networkGbps: number
  ipRanges: string[]
  lastSyncAt: string | null
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
