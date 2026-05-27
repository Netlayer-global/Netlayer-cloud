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

// ─── PUBLIC STATUS ───────────────────────────────────────────
export interface StatusSummary {
  overall: 'operational' | 'degraded' | 'major_outage' | 'maintenance'
  services: { name: string; status: string }[]
  regions: { slug: string; status: string }[]
  incidents: any[]
}
export const statusAPI = {
  summary: () => api.get<{ data: StatusSummary }>('/status/summary'),
  incidents: (limit = 50) => api.get<{ data: any[] }>(`/status/incidents?limit=${limit}`),
  subscribe: (email: string) => api.post('/status/subscribe', { email }),
}

// ─── PLATFORM META (public) ──────────────────────────────────
export interface PlatformMeta {
  name?: string
  tagline?: string
  supportEmail?: string
  salesEmail?: string
  legalEmail?: string
  privacyEmail?: string
  twitterUrl?: string
  githubUrl?: string
  discordUrl?: string
  linkedinUrl?: string
  foundedYear?: number
  headquarters?: string
}
export const platformMetaAPI = {
  get: () => api.get<{ data: PlatformMeta }>('/platform/meta'),
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
  /**
   * Upload an ISO from the operator's PC. Backend writes it to data/iso/
   * with a stamped filename. Returns onUploadProgress to drive the UI bar.
   */
  upload: (
    formData: FormData,
    onProgress?: (pct: number) => void,
  ) =>
    api.post('/admin/iso/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
      // Big files can take a while — bump default 30s ceiling.
      timeout: 30 * 60 * 1000,
    }),
}

export const communicationsAPI = {
  sendBulkEmail: (data: { subject: string; html: string; targetType: 'all' | 'active' | 'country' | 'custom'; targetValue?: string; testEmail?: string }) =>
    api.post('/admin/communications/bulk-email', data),
  sendTest: (data: { to: string; subject: string; html: string }) =>
    api.post('/admin/communications/test-email', data),
  history: () => api.get('/admin/communications/history'),
}

// ─── ROUND 20: Credit notes, GSTR-1, admin platform-wide ─────
export interface CreditNote {
  id: string
  creditNoteNumber: string
  invoiceId: string
  amount: number
  tax: number
  total: number
  currency: string
  reason: string
  notes: string | null
  createdAt: string
  invoice: { invoiceNumber: string; total: number }
  user?: { id: string; email: string; firstName: string; lastName: string }
}

export const creditNotesAPI = {
  list: () => api.get<{ data: CreditNote[] }>('/billing/credit-notes'),
  get: (id: string) => api.get<{ data: CreditNote }>(`/billing/credit-notes/${id}`),
  pdfUrl: (id: string) => `/api/billing/credit-notes/${id}/pdf`,
}

export const adminCreditNotesAPI = {
  list: () => api.get<{ data: CreditNote[] }>('/admin/credit-notes'),
  pdfUrl: (id: string) => `/api/admin/credit-notes/${id}/pdf`,
}

export const gstr1API = {
  exportUrl: (yyyymm: string) => `/api/admin/gstr1?month=${yyyymm}`,
}

export const adminPlatformAPI = {
  networks: () => api.get('/admin/platform/networks'),
  releaseFloatingIp: (id: string) => api.post(`/admin/platform/networks/floating-ips/${id}/release`),
  storage: () => api.get('/admin/platform/storage'),
  dns: () => api.get('/admin/platform/dns'),
  marketplace: () => api.get('/admin/platform/marketplace'),
  marketplaceCreate: (data: any) => api.post('/admin/platform/marketplace', data),
  marketplaceUpdate: (id: string, data: any) => api.patch(`/admin/platform/marketplace/${id}`, data),
  marketplaceDelete: (id: string) => api.delete(`/admin/platform/marketplace/${id}`),
}

// ─── ROUND 22: Pay-per-deploy orders ─────────────────────────
export interface DeployOrderResult {
  orderId: string
  serverId: string
  amount: number
  tax: number
  total: number
  currency: string
  provider: 'razorpay' | 'stripe'
  checkout: any
}

export const deployOrdersAPI = {
  create: (data: {
    planId: string
    regionId: string
    osTemplateId: string
    sshKeyId?: string
    hostname?: string
    rootPassword?: string
    preferredProvider?: 'razorpay' | 'stripe'
    // Round 23
    billingCycle?: 'hourly' | 'monthly' | 'yearly'
    raidConfig?: 'raid0' | 'raid1' | 'raid10' | 'raid5' | 'raid6' | 'passthrough'
    customIsoId?: string
  }) => api.post<{ data: DeployOrderResult }>('/deploy-orders', data),

  list: () => api.get('/deploy-orders'),
  get: (id: string) => api.get(`/deploy-orders/${id}`),

  verifyPayment: (id: string, data: {
    razorpay_payment_id?: string
    razorpay_order_id?: string
    razorpay_signature?: string
    stripe_payment_intent_id?: string
  }) => api.post<{ data: { success: boolean; alreadyPaid?: boolean; serverId: string } }>(`/deploy-orders/${id}/verify-payment`, data),

  cancel: (id: string) => api.post(`/deploy-orders/${id}/cancel`),
}

// Round 22 admin: enterprise mode + admin-on-behalf deploy
export const enterpriseAdminAPI = {
  setBillingMode: (userId: string, data: { mode: 'retail' | 'wallet' | 'enterprise'; contractValue?: number; notes?: string }) =>
    api.patch(`/admin/users/${userId}/billing-mode`, data),
  deployForUser: (userId: string, data: { name: string; planId: string; regionId: string; osTemplateId: string; sshKeyId?: string; rootPassword?: string }) =>
    api.post(`/admin/users/${userId}/deploy-server`, data),
}

// ─── ROUND 23: Admin Plans CRUD + Org settings + Customer ISOs ─
export const plansAdminAPI = {
  list: () => api.get('/admin/plans'),
  get: (id: string) => api.get(`/admin/plans/${id}`),
  create: (data: any) => api.post('/admin/plans', data),
  update: (id: string, data: any) => api.patch(`/admin/plans/${id}`, data),
  delete: (id: string) => api.delete(`/admin/plans/${id}`),
  adjustStock: (id: string, data: { delta?: number; total?: number }) =>
    api.post(`/admin/plans/${id}/stock`, data),
}

export interface OrgSettings {
  organization: Record<string, any>
  gst: Record<string, any>
  invoicing: Record<string, any>
  legal: Record<string, any>
}
export const orgSettingsAPI = {
  get: () => api.get<{ data: OrgSettings }>('/admin/org-settings'),
  update: (data: Partial<OrgSettings>) => api.patch('/admin/org-settings', data),
}

export const customerIsoAPI = {
  list: () => api.get('/iso/custom'),
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.post('/iso/custom/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
      timeout: 30 * 60 * 1000,
    }),
  delete: (id: string) => api.delete(`/iso/custom/${id}`),
}

// ─── ROUND 24: Phone OTP, KYC, Orgs, Tags, Templates, Backups, Analytics, Flags, Compliance, Messages, NPS, Push, SSO, 2FA backup ───
export const phoneOtpAPI = {
  send: (phone: string) => api.post<{ data: { sent: boolean; expiresAt: string; devOnlyCode?: string } }>('/phone-otp/send', { phone }),
  verify: (code: string) => api.post<{ data: { verified: boolean; phone: string } }>('/phone-otp/verify', { code }),
}

export interface KycStatus {
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  kycPanNumber: string | null
  kycRejectReason: string | null
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
}
export const kycAPI = {
  status: () => api.get<{ data: KycStatus }>('/kyc/status'),
  submit: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.post('/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)) },
      timeout: 5 * 60 * 1000,
    }),
  // admin
  adminList: () => api.get('/kyc/admin/list'),
  adminApprove: (userId: string) => api.post(`/kyc/admin/${userId}/approve`),
  adminReject: (userId: string, reason: string) => api.post(`/kyc/admin/${userId}/reject`, { reason }),
}

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  billingEmail: string | null
  gstNumber: string | null
  panNumber: string | null
  address: string | null
  status: string
  createdAt: string
  role?: string
  myRole?: string
  members?: any[]
  invites?: any[]
}
export const organizationsAPI = {
  list: () => api.get<{ data: Organization[] }>('/organizations'),
  get: (id: string) => api.get<{ data: Organization }>(`/organizations/${id}`),
  create: (data: { name: string; billingEmail?: string; gstNumber?: string; panNumber?: string }) =>
    api.post<{ data: Organization }>('/organizations', data),
  update: (id: string, data: Partial<Organization>) =>
    api.patch<{ data: Organization }>(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  invite: (id: string, email: string, role: 'admin' | 'member' | 'billing' | 'viewer') =>
    api.post(`/organizations/${id}/invites`, { email, role }),
  acceptInvite: (token: string) => api.post(`/organizations/invites/${token}/accept`),
  removeMember: (orgId: string, memberId: string) =>
    api.delete(`/organizations/${orgId}/members/${memberId}`),
  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    api.patch(`/organizations/${orgId}/members/${memberId}`, { role }),
}

export const masqueradeAPI = {
  start: (userId: string, reason: string, durationMinutes = 30) =>
    api.post(`/admin/masquerade/start/${userId}`, { reason, durationMinutes }),
  stop: (masqueradeId: string) => api.post(`/admin/masquerade/stop/${masqueradeId}`),
  history: () => api.get('/admin/masquerade/history'),
  myHistory: () => api.get('/admin/masquerade/my-history'),
}

export const serverTagsAPI = {
  list: (serverId: string) => api.get(`/server-tags/server/${serverId}`),
  add: (serverId: string, tag: string) => api.post(`/server-tags/server/${serverId}`, { tag }),
  remove: (serverId: string, tag: string) => api.delete(`/server-tags/server/${serverId}/${tag}`),
  bulkPower: (data: { action: 'start' | 'stop' | 'restart'; serverIds?: string[]; tag?: string }) =>
    api.post('/server-tags/bulk-power', data),
  bulkDestroy: (data: { serverIds?: string[]; tag?: string; confirm: 'DELETE' }) =>
    api.post('/server-tags/bulk-destroy', data),
}

export interface ServerTemplate {
  id: string
  name: string
  description: string | null
  sourceServerId: string | null
  status: string
  isPublic: boolean
  createdAt: string
}
export const serverTemplatesAPI = {
  list: () => api.get<{ data: ServerTemplate[] }>('/server-templates'),
  create: (data: { name: string; description?: string; sourceServerId?: string }) =>
    api.post<{ data: ServerTemplate }>('/server-templates', data),
  delete: (id: string) => api.delete(`/server-templates/${id}`),
}

export interface BackupSchedule {
  id: string
  serverId: string
  frequency: 'daily' | 'weekly' | 'monthly'
  retentionDays: number
  hour: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string
  createdAt: string
}
export const backupSchedulesAPI = {
  list: () => api.get<{ data: BackupSchedule[] }>('/backup-schedules'),
  create: (data: any) => api.post<{ data: BackupSchedule }>('/backup-schedules', data),
  update: (id: string, data: any) => api.patch<{ data: BackupSchedule }>(`/backup-schedules/${id}`, data),
  delete: (id: string) => api.delete(`/backup-schedules/${id}`),
}

export const analyticsAPI = {
  revenue: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams()
    if (params?.from) q.append('from', params.from)
    if (params?.to) q.append('to', params.to)
    return api.get(`/admin/analytics/revenue${q.toString() ? `?${q}` : ''}`)
  },
  customers: () => api.get('/admin/analytics/customers'),
  cohorts: () => api.get('/admin/analytics/cohorts'),
  profitability: () => api.get('/admin/analytics/profitability'),
}

export const featureFlagsAPI = {
  list: () => api.get('/feature-flags'),
  create: (data: { key: string; description?: string; defaultEnabled: boolean; rolloutPercent: number }) =>
    api.post('/feature-flags', data),
  update: (id: string, data: any) => api.patch(`/feature-flags/${id}`, data),
  delete: (id: string) => api.delete(`/feature-flags/${id}`),
  setOverride: (flagId: string, userId: string, enabled: boolean) =>
    api.post(`/feature-flags/${flagId}/overrides`, { userId, enabled }),
  removeOverride: (flagId: string, userId: string) =>
    api.delete(`/feature-flags/${flagId}/overrides/${userId}`),
  resolved: () => api.get<{ data: Record<string, boolean> }>('/feature-flags/resolved'),
}

export interface ComplianceIncident {
  id: string
  type: string
  severity: string
  description: string
  detectedAt: string
  reportedAt: string | null
  certInRef: string | null
  status: string
  remediation: string | null
  createdAt: string
}
export const complianceAPI = {
  incidents: () => api.get<{ data: ComplianceIncident[] }>('/admin/compliance/incidents'),
  getIncident: (id: string) => api.get(`/admin/compliance/incidents/${id}`),
  createIncident: (data: any) => api.post<{ data: ComplianceIncident }>('/admin/compliance/incidents', data),
  updateIncident: (id: string, data: any) => api.patch(`/admin/compliance/incidents/${id}`, data),
  sla: () => api.get('/admin/compliance/sla'),
}

export interface InAppMessage {
  id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'error' | 'success'
  cta: string | null
  ctaUrl: string | null
  startsAt: string
  endsAt: string | null
  isActive: boolean
  createdAt: string
}
export const inAppMessagesAPI = {
  active: () => api.get<{ data: InAppMessage[] }>('/in-app-messages/active'),
  list: () => api.get<{ data: InAppMessage[] }>('/in-app-messages'),
  create: (data: any) => api.post<{ data: InAppMessage }>('/in-app-messages', data),
  update: (id: string, data: any) => api.patch(`/in-app-messages/${id}`, data),
  delete: (id: string) => api.delete(`/in-app-messages/${id}`),
}

export const npsAPI = {
  eligibility: () => api.get<{ data: { eligible: boolean } }>('/nps/eligibility'),
  submit: (score: number, comment?: string) => api.post('/nps/submit', { score, comment }),
  adminSummary: () => api.get('/nps/admin/summary'),
}

export const pushAPI = {
  vapidKey: () => api.get<{ data: { key: string } }>('/push/vapid-public-key'),
  subscribe: (endpoint: string, keys: { p256dh: string; auth: string }, platform = 'web') =>
    api.post('/push/subscribe', { endpoint, keys, platform }),
  unsubscribe: (endpoint: string) => api.delete('/push/subscribe', { data: { endpoint } } as any),
  list: () => api.get('/push/subscriptions'),
}

export const ssoAPI = {
  google: (profile: { email: string; firstName?: string; lastName?: string; subject: string }) =>
    api.post('/auth/sso/google', { profile }),
  github: (profile: { email: string; firstName?: string; lastName?: string; subject: string }) =>
    api.post('/auth/sso/github', { profile }),
  microsoft: (profile: { email: string; firstName?: string; lastName?: string; subject: string }) =>
    api.post('/auth/sso/microsoft', { profile }),
}

export const twoFactorBackupAPI = {
  status: () => api.get<{ data: { twoFactorEnabled: boolean; backupCodesRemaining: number } }>('/2fa/backup/status'),
  regenerate: () => api.post<{ data: { codes: string[] } }>('/2fa/backup/regenerate'),
  consume: (code: string) => api.post<{ data: { ok: boolean; remaining: number } }>('/2fa/backup/consume', { code }),
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
