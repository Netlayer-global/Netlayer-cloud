import api from './client'
import type {
  Plan,
  Region,
  OsTemplate,
  Server,
  Invoice,
  SshKey,
  User,
  Metrics,
  Usage,
  AdminStats,
  ProxmoxNode,
} from '../types'

// ─── AUTH ────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ data: { user: User; accessToken: string } }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<{ data: { user: User; accessToken: string } }>('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ data: User }>('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  updateProfile: (data: { firstName: string; lastName: string }) =>
    api.patch<{ data: User }>('/auth/profile', data),
}

// ─── SERVERS ─────────────────────────────────────────────────
export const serverAPI = {
  list: () => api.get<{ data: Server[] }>('/servers'),

  get: (id: string) => api.get<{ data: Server }>(`/servers/${id}`),

  create: (data: {
    name: string
    planId: string
    regionId: string
    osTemplateId: string
    sshKeyId?: string
    rootPassword?: string
  }) => api.post<{ data: Server }>('/servers', data),

  delete: (id: string) => api.delete(`/servers/${id}`),

  power: (id: string, action: 'start' | 'stop' | 'restart') =>
    api.post(`/servers/${id}/power`, { action }),

  getMetrics: (id: string, range: '1h' | '6h' | '24h' | '7d' = '24h') =>
    api.get<{ data: Metrics }>(`/servers/${id}/metrics?range=${range}`),

  rebuild: (id: string, osTemplateId: string, rootPassword: string) =>
    api.post(`/servers/${id}/rebuild`, { osTemplateId, rootPassword }),

  // Round 18 extensions (inlined Round 19)
  resize: (id: string, newPlanId: string) =>
    api.post<{ data: Server }>(`/servers/${id}/resize`, { newPlanId }),
  clone: (id: string, name?: string) =>
    api.post<{ data: Server }>(`/servers/${id}/clone`, { name }),
  rescue: (id: string, isoId: string) =>
    api.post(`/servers/${id}/rescue`, { isoId }),
  rescueExit: (id: string) => api.post(`/servers/${id}/rescue-exit`),
}

// ─── CATALOG ─────────────────────────────────────────────────
export const catalogAPI = {
  getPlans: () => api.get<{ data: Plan[] }>('/plans'),
  getRegions: () => api.get<{ data: Region[] }>('/regions'),
  getOS: () => api.get<{ data: OsTemplate[] }>('/os'),
}

// ─── BLOG (public) ───────────────────────────────────────────
export interface BlogPostSummary {
  id: string
  slug: string
  title: string
  excerpt: string
  cover: string | null
  category: string
  authorName: string
  authorRole: string
  readMinutes: number
  tags: string[]
  publishedAt: string
}
export interface BlogPostDetail extends BlogPostSummary {
  content: string
}

export const blogAPI = {
  list: (opts: { category?: string; tag?: string; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (opts.category) q.append('category', opts.category)
    if (opts.tag) q.append('tag', opts.tag)
    if (opts.limit) q.append('limit', String(opts.limit))
    return api.get<{ data: BlogPostSummary[] }>(`/blog${q.toString() ? `?${q}` : ''}`)
  },
  get: (slug: string) => api.get<{ data: BlogPostDetail }>(`/blog/${slug}`),
}

// ─── PLATFORM (public stats / modules) ───────────────────────
export interface PlatformStats {
  serversDeployedToday: number
  activeServers: number
  regionsOnline: number
  lastDeploySeconds: number | null
  totalUsers: number
  uptimePercent: number
}
export const platformAPI = {
  getStats: () => api.get<{ data: PlatformStats }>('/platform/stats'),
}

// ─── ROUND 18: FLOATING IPS, ALERTS, SNAPSHOTS, PROMO ──────
export interface FloatingIp {
  id: string
  ip: string
  rdns: string | null
  status: 'unassigned' | 'assigned' | 'releasing'
  region: { id: string; name: string; flag: string; slug: string; countryCode: string }
  server: { id: string; name: string; hostname: string; ipv4: string | null } | null
  createdAt: string
  updatedAt: string
}
export interface AlertRule {
  id: string
  name: string
  metric: string
  condition: 'gt' | 'lt' | 'eq'
  threshold: number
  duration: number
  channels: string[]
  webhookUrl: string | null
  isActive: boolean
  lastFiredAt: string | null
  server: { id: string; name: string; hostname: string; status: string } | null
  createdAt: string
}
export interface SnapshotSummary {
  id: string
  serverId: string
  name: string
  size: number
  status: string
  createdAt: string
  server: {
    id: string
    name: string
    hostname: string
    ipv4: string | null
    status: string
    region: { name: string; flag: string; slug: string }
  }
}
export interface PromoSummary {
  creditAdded: number
  newBalance: number
  message: string
}

export const floatingIpAPI = {
  list: () => api.get<{ data: FloatingIp[] }>('/floating-ips'),
  create: (regionId: string) => api.post<{ data: FloatingIp }>('/floating-ips', { regionId }),
  assign: (id: string, serverId: string) =>
    api.post<{ data: FloatingIp }>(`/floating-ips/${id}/assign`, { serverId }),
  unassign: (id: string) => api.post<{ data: FloatingIp }>(`/floating-ips/${id}/unassign`),
  updateRdns: (id: string, rdns: string) =>
    api.patch<{ data: FloatingIp }>(`/floating-ips/${id}/rdns`, { rdns }),
  delete: (id: string) => api.delete(`/floating-ips/${id}`),
}

export const alertAPI = {
  list: () => api.get<{ data: AlertRule[] }>('/alert-rules'),
  create: (data: Partial<AlertRule> & { metric: string; condition: string; threshold: number; channels: string[] }) =>
    api.post<{ data: AlertRule }>('/alert-rules', data),
  update: (id: string, data: Partial<AlertRule>) =>
    api.patch<{ data: AlertRule }>(`/alert-rules/${id}`, data),
  delete: (id: string) => api.delete(`/alert-rules/${id}`),
}

export const snapshotAPI = {
  listAll: () => api.get<{ data: SnapshotSummary[] }>('/snapshots'),
  createForServer: (serverId: string, name: string) =>
    api.post(`/servers/${serverId}/snapshots`, { name }),
  delete: (serverId: string, snapshotId: string) =>
    api.delete(`/servers/${serverId}/snapshots/${snapshotId}`),
}

export const promoAPI = {
  redeem: (code: string) => api.post<{ data: PromoSummary }>('/billing/promo/redeem', { code }),
}

export const waitlistAPI = {
  join: (email: string, product: string, source?: string) =>
    api.post('/waitlist', { email, product, source }),
}

export const onboardingAPI = {
  complete: () => api.patch('/auth/onboarding-complete'),
  requestDataExport: () => api.post('/auth/request-data-export'),
}

// Round 18 admin ISO availability for customer-side rescue mode
export const isoPublicAPI = {
  list: () => api.get<{ data: { id: string; name: string; filename: string; createdAt: string }[] }>('/iso/public'),
}

// ─── ADMIN ROUND 18 ──────────────────────────────────────────
export const ipPoolAPI = {
  list: () => api.get('/admin/ip-pools'),
  create: (data: { regionId: string; cidr: string; gateway: string; dns1?: string; dns2?: string }) =>
    api.post('/admin/ip-pools', data),
  getIps: (id: string, page = 1) => api.get(`/admin/ip-pools/${id}/ips?page=${page}`),
  delete: (id: string) => api.delete(`/admin/ip-pools/${id}`),
  releaseIp: (ipId: string) => api.post(`/admin/ip-pools/ips/${ipId}/release`),
}

export const promoAdminAPI = {
  list: () => api.get('/admin/promos'),
  create: (data: { code?: string; amount: number; usageLimit?: number; minTopup?: number; expiresAt?: string }) =>
    api.post('/admin/promos', data),
  update: (id: string, data: { isActive?: boolean; usageLimit?: number; expiresAt?: string | null }) =>
    api.patch(`/admin/promos/${id}`, data),
  delete: (id: string) => api.delete(`/admin/promos/${id}`),
}

export const capacityAPI = {
  getReport: () => api.get('/admin/capacity'),
  getSummary: () => api.get('/admin/capacity/summary'),
}

export const adminHealthAPI = {
  getGlobal: () => api.get('/admin/health/global'),
  getNodeLive: (id: string) => api.get(`/admin/health/nodes/${id}/live`),
}

export const isoAdminAPI = {
  list: () => api.get('/admin/iso'),
  create: (data: { name: string; nodeId?: string | null; downloadUrl: string; isPublic?: boolean }) =>
    api.post('/admin/iso', data),
  status: (id: string) => api.get(`/admin/iso/${id}/status`),
  delete: (id: string) => api.delete(`/admin/iso/${id}`),
  attach: (id: string, serverId: string) => api.post(`/admin/iso/${id}/attach`, { serverId }),
  detach: (id: string, serverId: string) => api.post(`/admin/iso/${id}/detach`, { serverId }),
}

export const communicationsAPI = {
  sendBulkEmail: (data: { subject: string; html: string; targetType: 'all' | 'active' | 'country' | 'custom'; targetValue?: string; testEmail?: string }) =>
    api.post('/admin/communications/bulk-email', data),
  sendTest: (data: { to: string; subject: string; html: string }) =>
    api.post('/admin/communications/test-email', data),
  history: () => api.get('/admin/communications/history'),
}

// ─── BILLING ─────────────────────────────────────────────────
export const billingAPI = {
  getInvoices: () => api.get<{ data: Invoice[] }>('/billing/invoices'),
  getUsage: () => api.get<{ data: Usage }>('/billing/usage'),
  payInvoice: (id: string) => api.post(`/billing/pay/${id}`),
}

// ─── SSH KEYS ────────────────────────────────────────────────
export const sshAPI = {
  list: () => api.get<{ data: SshKey[] }>('/ssh-keys'),
  create: (name: string, publicKey: string) =>
    api.post<{ data: SshKey }>('/ssh-keys', { name, publicKey }),
  delete: (id: string) => api.delete(`/ssh-keys/${id}`),
}

// ─── ADMIN ───────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get<{ data: AdminStats }>('/admin/stats'),
  getUsers: (page = 1, search = '') =>
    api.get<{ data: User[]; pagination: { page: number; pageSize: number; total: number } }>(
      `/admin/users?page=${page}&search=${encodeURIComponent(search)}`
    ),
  updateUser: (id: string, data: { status?: string; role?: string; balance?: number }) =>
    api.patch<{ data: User }>(`/admin/users/${id}`, data),
  getServers: (page = 1) =>
    api.get<{ data: any[]; pagination: { page: number; pageSize: number; total: number } }>(
      `/admin/servers?page=${page}`
    ),
  getNodes: () => api.get<{ data: ProxmoxNode[] }>('/admin/nodes'),
}

// ─── OBJECT STORAGE ──────────────────────────────────────────
export interface StorageBucket {
  id: string
  name: string
  region: string
  sizeBytes: number
  objects: number
  isPublic: boolean
  endpoint: string | null
  createdAt: string
}
export interface StorageObjectMeta {
  key: string
  size: number
  lastModified: string
  contentType?: string
  etag?: string
}
export interface StorageAccessKey {
  id: string
  name: string
  accessKey: string
  secretKey?: string
  createdAt: string
}

export const storageAPI = {
  listBuckets: () => api.get<{ data: StorageBucket[] }>('/storage/buckets'),
  getBucket: (id: string) => api.get<{ data: StorageBucket & { liveStats?: { objects: number; sizeBytes: number } } }>(`/storage/buckets/${id}`),
  createBucket: (name: string, region: string, isPublic: boolean) =>
    api.post<{ data: StorageBucket }>('/storage/buckets', { name, region, isPublic }),
  updateBucket: (id: string, data: { isPublic?: boolean }) =>
    api.patch<{ data: StorageBucket }>(`/storage/buckets/${id}`, data),
  deleteBucket: (id: string) => api.delete(`/storage/buckets/${id}`),
  listObjects: (bucketId: string, prefix = '') =>
    api.get<{ data: StorageObjectMeta[] }>(
      `/storage/buckets/${bucketId}/objects?prefix=${encodeURIComponent(prefix)}`
    ),
  deleteObject: (bucketId: string, key: string) =>
    api.delete(`/storage/buckets/${bucketId}/objects`, { data: { key } }),
  presignPut: (bucketId: string, key: string, contentType?: string) =>
    api.post<{
      data: { url: string; method: 'PUT'; headers: Record<string, string>; key: string; expiresIn: number; mock: boolean }
    }>(`/storage/buckets/${bucketId}/presign`, {
      key, contentType, operation: 'put',
    }),
  presignGet: (bucketId: string, key: string) =>
    api.post<{ data: { url: string; method: 'GET'; key: string; expiresIn: number; mock: boolean } }>(
      `/storage/buckets/${bucketId}/presign`,
      { key, operation: 'get' }
    ),
  listAccessKeys: () => api.get<{ data: StorageAccessKey[] }>('/storage/access-keys'),
  createAccessKey: (name: string) =>
    api.post<{ data: StorageAccessKey & { secretKey: string } }>('/storage/access-keys', { name }),
  deleteAccessKey: (keyId: string) => api.delete(`/storage/access-keys/${keyId}`),
}
