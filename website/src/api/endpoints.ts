import api from './client'
import type { Plan, Region, OsTemplate } from '../types'

/**
 * Public endpoints used by the marketing site only. Mirrors a subset of
 * the dashboard's `api/endpoints.ts` — kept separate so this app has no
 * dependency on `frontend/`.
 */

export const catalogAPI = {
  getPlans:   () => api.get<{ data: Plan[] }>('/plans'),
  getRegions: () => api.get<{ data: Region[] }>('/regions'),
  getOS:      () => api.get<{ data: OsTemplate[] }>('/os'),
}

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

export const waitlistAPI = {
  join: (email: string, product: string, source?: string) =>
    api.post('/waitlist', { email, product, source }),
}

export const abuseAPI = {
  submit: (data: {
    serverIp?: string
    type: string
    description: string
    reporterEmail?: string
  }) => api.post('/abuse', data),
}

export const marketplaceAPI = {
  list: () => api.get('/marketplace'),
  categories: () => api.get('/marketplace/categories'),
  get: (slug: string) => api.get(`/marketplace/${slug}`),
}
