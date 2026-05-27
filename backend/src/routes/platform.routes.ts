import { Router } from 'express'
import prisma from '../utils/prisma'

const router = Router()

/**
 * Default module visibility. VPS-related modules are ON by default since
 * compute is the platform's primary product. Everything else defaults OFF
 * until the operator enables it from the admin Settings → Modules card.
 *
 * Admin can override per-module via key `platform.modules` in IntegrationConfig.
 * Shape stored: { servers: true, vms: true, gpu: false, ... }
 */
export const MODULE_DEFINITIONS = [
  // Compute
  { key: 'servers',        label: 'Servers',          group: 'Compute',    default: true,  required: true,  desc: 'Cloud VPS — primary product' },
  { key: 'deploy',         label: 'Deploy server',    group: 'Compute',    default: true,  required: true,  desc: 'Deploy wizard' },
  { key: 'vms',            label: 'Virtual machines', group: 'Compute',    default: false, required: false, desc: 'Lightweight VMs' },
  { key: 'gpu',            label: 'GPU instances',    group: 'Compute',    default: false, required: false, desc: 'NVIDIA A100/H100 GPUs' },
  { key: 'kubernetes',     label: 'Kubernetes',       group: 'Compute',    default: false, required: false, desc: 'Managed K8s clusters' },
  { key: 'marketplace',    label: 'Marketplace',      group: 'Compute',    default: true,  required: false, desc: 'One-click apps' },
  // Storage
  { key: 'objectStorage',  label: 'Object storage',   group: 'Storage',    default: true,  required: false, desc: 'S3-compatible buckets' },
  { key: 'blockStorage',   label: 'Block volumes',    group: 'Storage',    default: true,  required: false, desc: 'NVMe persistent volumes' },
  { key: 'managedDb',      label: 'Managed databases', group: 'Storage',   default: true,  required: false, desc: 'PostgreSQL / MySQL / Redis' },
  // Network
  { key: 'loadBalancers',  label: 'Load balancers',   group: 'Network',    default: true,  required: false, desc: 'HTTP/TCP load balancers' },
  { key: 'dns',            label: 'DNS zones',        group: 'Network',    default: true,  required: false, desc: 'DNS hosting' },
  { key: 'firewalls',      label: 'Firewalls',        group: 'Network',    default: true,  required: false, desc: 'Per-server firewall rules' },
  { key: 'vpc',            label: 'VPC & private network', group: 'Network', default: true,  required: false, desc: 'Private isolated networks' },
  { key: 'floatingIps',    label: 'Floating IPs',     group: 'Network',    default: true,  required: false, desc: 'User-owned reserved public IPs' },
  // Monitoring
  { key: 'monitoring',     label: 'Metrics & graphs', group: 'Monitoring', default: true,  required: false, desc: 'Server metrics' },
  { key: 'alerts',         label: 'Alerts',           group: 'Monitoring', default: true,  required: false, desc: 'Threshold-based alert rules' },
  { key: 'logs',           label: 'Logs',             group: 'Monitoring', default: false, required: false, desc: 'Centralized logs' },
  // Storage extras
  { key: 'snapshots',      label: 'Snapshots',        group: 'Storage',    default: true,  required: false, desc: 'Point-in-time server snapshots' },
  // Round 23/24 customer features
  { key: 'customIsos',     label: 'Custom ISOs',      group: 'Storage',    default: false, required: false, desc: 'Customer-uploaded boot images (also surfaced inside Deploy → OS step)' },
  { key: 'deployOrders',   label: 'Deploy orders',    group: 'Account',    default: true,  required: false, desc: 'Pay-per-deploy order history' },
  { key: 'organizations',  label: 'Organizations',    group: 'Account',    default: true,  required: false, desc: 'Teams + multi-user orgs with shared billing' },
  { key: 'kyc',            label: 'KYC verification', group: 'Account',    default: true,  required: false, desc: 'India PAN/Aadhaar/address upload' },
  { key: 'phoneVerify',    label: 'Phone verification', group: 'Account',  default: true,  required: false, desc: 'OTP-based phone confirmation' },
  // Account
  { key: 'projects',       label: 'Projects',         group: 'Account',    default: false, required: false, desc: 'Group resources by project' },
  { key: 'activity',       label: 'Activity log',     group: 'Account',    default: true,  required: false, desc: 'Account audit log' },
  { key: 'team',           label: 'Team',             group: 'Account',    default: false, required: false, desc: 'Multi-user team accounts' },
  { key: 'apiKeys',        label: 'API keys',         group: 'Account',    default: true,  required: false, desc: 'Programmatic access' },
  { key: 'sshKeys',        label: 'SSH keys',         group: 'Account',    default: true,  required: true,  desc: 'SSH key management' },
  { key: 'billing',        label: 'Billing',          group: 'Account',    default: true,  required: true,  desc: 'Invoices & usage' },
  { key: 'referrals',      label: 'Referrals',        group: 'Account',    default: true,  required: false, desc: 'Referral program' },
  { key: 'support',        label: 'Support tickets',  group: 'Account',    default: true,  required: false, desc: 'Help desk' },
] as const

export type ModuleKey = typeof MODULE_DEFINITIONS[number]['key']

const DEFAULTS: Record<string, boolean> = MODULE_DEFINITIONS.reduce((acc, m) => {
  acc[m.key] = m.default
  return acc
}, {} as Record<string, boolean>)

/**
 * Admin-side sidebar modules. Same shape as MODULE_DEFINITIONS but applied
 * to operator/admin nav rather than customer dashboard. Lets the
 * SUPER_ADMIN hide non-essential admin sections (e.g. don't show GSTR-1
 * if the team doesn't deal with India taxes).
 */
export const ADMIN_MODULE_DEFINITIONS = [
  // Core
  { key: 'dashboard',       label: 'Overview',          group: 'Core',       default: true,  required: true,  desc: 'Admin home dashboard' },
  { key: 'users',           label: 'Users',             group: 'Core',       default: true,  required: true,  desc: 'Customer accounts list' },
  { key: 'enterprise',      label: 'Enterprise',        group: 'Core',       default: true,  required: false, desc: 'Switch users to enterprise/wallet billing' },
  // Compute
  { key: 'servers',         label: 'Servers',           group: 'Compute',    default: true,  required: true,  desc: 'All servers across the platform' },
  { key: 'nodes',           label: 'Nodes',             group: 'Compute',    default: true,  required: false, desc: 'Proxmox host nodes' },
  { key: 'capacity',        label: 'Capacity',          group: 'Compute',    default: true,  required: false, desc: 'Capacity forecast per region' },
  { key: 'health',          label: 'Global health',     group: 'Compute',    default: true,  required: false, desc: 'Live node stats heatmap' },
  { key: 'workflows',       label: 'Workflows',         group: 'Compute',    default: true,  required: false, desc: 'Durable workflow runs' },
  // Networking
  { key: 'ipPools',         label: 'IP pools',          group: 'Network',    default: true,  required: false, desc: 'Public/private IP allocations' },
  { key: 'iso',             label: 'ISO library',       group: 'Network',    default: true,  required: false, desc: 'Operator-managed boot images' },
  { key: 'networks',        label: 'Networks',          group: 'Network',    default: true,  required: false, desc: 'Platform-wide floating IPs view' },
  { key: 'dns',             label: 'DNS zones',         group: 'Network',    default: true,  required: false, desc: 'Customer DNS zones overview' },
  // Billing & Compliance
  { key: 'billing',         label: 'Billing',           group: 'Billing',    default: true,  required: false, desc: 'Invoices + transactions' },
  { key: 'plans',           label: 'Plans',             group: 'Billing',    default: true,  required: false, desc: 'Plans CRUD + bare-metal stock' },
  { key: 'creditNotes',     label: 'Credit notes',      group: 'Billing',    default: true,  required: false, desc: 'Refunds & adjustments' },
  { key: 'gstr1',           label: 'GSTR-1 export',     group: 'Billing',    default: true,  required: false, desc: 'India tax filing CSV' },
  { key: 'promos',          label: 'Promo codes',       group: 'Billing',    default: true,  required: false, desc: 'Promo + discount management' },
  { key: 'analytics',       label: 'Analytics',         group: 'Billing',    default: true,  required: false, desc: 'Revenue, MRR, churn, cohorts' },
  { key: 'orgSettings',     label: 'Org settings',      group: 'Billing',    default: true,  required: false, desc: 'Company GST, prefixes, footer' },
  { key: 'kycReview',       label: 'KYC review',        group: 'Billing',    default: true,  required: false, desc: 'Approve/reject customer KYC' },
  { key: 'compliance',      label: 'Compliance',        group: 'Billing',    default: true,  required: false, desc: 'CERT-In incident SLA tracker' },
  // Storage & Marketplace
  { key: 'storage',         label: 'Storage admin',     group: 'Platform',   default: true,  required: false, desc: 'Buckets/volumes overview' },
  { key: 'marketplace',     label: 'Marketplace',       group: 'Platform',   default: true,  required: false, desc: 'One-click app catalogue' },
  // Support
  { key: 'tickets',         label: 'Tickets',           group: 'Support',    default: true,  required: false, desc: 'Customer support inbox' },
  { key: 'abuse',           label: 'Abuse',             group: 'Support',    default: true,  required: false, desc: 'Abuse reports' },
  { key: 'communications',  label: 'Communications',    group: 'Support',    default: true,  required: false, desc: 'Bulk email broadcasts' },
  { key: 'inAppMessages',   label: 'In-app banners',    group: 'Support',    default: true,  required: false, desc: 'Top-bar message scheduler' },
  // Platform
  { key: 'status',          label: 'Status page',       group: 'Platform',   default: true,  required: false, desc: 'Status incident management' },
  { key: 'integrations',    label: 'Integrations',      group: 'Platform',   default: true,  required: false, desc: 'Razorpay/Stripe/Resend/etc.' },
  { key: 'announcements',   label: 'Announcements',     group: 'Platform',   default: true,  required: false, desc: 'Customer-targeted notices' },
  { key: 'auditLogs',       label: 'Audit logs',        group: 'Platform',   default: true,  required: false, desc: 'Admin action audit trail' },
  { key: 'masquerade',      label: 'Masquerade log',    group: 'Platform',   default: true,  required: false, desc: 'Login-as-user audit history' },
  { key: 'featureFlags',    label: 'Feature flags',     group: 'Platform',   default: true,  required: false, desc: 'Kill-switches + canary rollouts' },
  // Security
  { key: 'roles',           label: 'Roles',             group: 'Security',   default: true,  required: false, desc: 'Custom role + permissions editor' },
  { key: 'settings',        label: 'Settings',          group: 'Security',   default: true,  required: true,  desc: 'Platform-wide settings (this page)' },
] as const

export type AdminModuleKey = typeof ADMIN_MODULE_DEFINITIONS[number]['key']

const ADMIN_DEFAULTS: Record<string, boolean> = ADMIN_MODULE_DEFINITIONS.reduce((acc, m) => {
  acc[m.key] = m.default
  return acc
}, {} as Record<string, boolean>)

export async function getEffectiveAdminModules(): Promise<Record<string, boolean>> {
  const cfg = await prisma.integrationConfig.findUnique({ where: { key: 'platform.adminModules' } })
  let stored: Record<string, boolean> = {}
  if (cfg?.value) {
    try { stored = JSON.parse(cfg.value) } catch { stored = {} }
  }
  const out: Record<string, boolean> = { ...ADMIN_DEFAULTS, ...stored }
  for (const m of ADMIN_MODULE_DEFINITIONS) {
    if (m.required) out[m.key] = true
  }
  return out
}

export async function getEffectiveModules(): Promise<Record<string, boolean>> {
  const cfg = await prisma.integrationConfig.findUnique({ where: { key: 'platform.modules' } })
  let stored: Record<string, boolean> = {}
  if (cfg?.value) {
    try {
      stored = JSON.parse(cfg.value)
    } catch {
      stored = {}
    }
  }
  // Required modules can never be disabled even if a stale config says so.
  const out: Record<string, boolean> = { ...DEFAULTS, ...stored }
  for (const m of MODULE_DEFINITIONS) {
    if (m.required) out[m.key] = true
  }
  return out
}

// Public endpoint — used by the customer dashboard sidebar to know what to render.
router.get('/modules', async (_req, res, next) => {
  try {
    const modules = await getEffectiveModules()
    res.json({ data: { modules, definitions: MODULE_DEFINITIONS } })
  } catch (e) { next(e) }
})

// Admin sidebar visibility config — only admins call this.
router.get('/admin-modules', async (req, res, next) => {
  try {
    // Lightweight guard: this endpoint is mounted on the public router so
    // we manually verify the JWT here. Customers don't need this data, and
    // anonymous calls would expose our internal sidebar map.
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    }
    const jwt = await import('jsonwebtoken')
    let payload: any
    try {
      payload = jwt.default.verify(auth.slice(7), process.env.JWT_SECRET || 'dev-secret-change-me')
    } catch {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    }
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'BILLING'].includes(payload.role)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' })
    }

    const modules = await getEffectiveAdminModules()
    res.json({ data: { modules, definitions: ADMIN_MODULE_DEFINITIONS } })
  } catch (e) { next(e) }
})

/**
 * Public platform metadata: brand name, support email, social URLs etc.
 * Used by the landing page footer + legal pages so we don't hardcode addresses.
 */
router.get('/meta', async (_req, res, next) => {
  try {
    const cfg = await prisma.integrationConfig.findUnique({ where: { key: 'platform.meta' } })
    let meta: any = {}
    if (cfg?.value) {
      try { meta = JSON.parse(cfg.value) } catch {}
    }
    res.setHeader('Cache-Control', 'public, max-age=120')
    res.json({ data: meta })
  } catch (e) { next(e) }
})

export default router
