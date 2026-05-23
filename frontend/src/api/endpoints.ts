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
}

// ─── CATALOG ─────────────────────────────────────────────────
export const catalogAPI = {
  getPlans: () => api.get<{ data: Plan[] }>('/plans'),
  getRegions: () => api.get<{ data: Region[] }>('/regions'),
  getOS: () => api.get<{ data: OsTemplate[] }>('/os'),
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
