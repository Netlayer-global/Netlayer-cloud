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
  { key: 'marketplace',    label: 'Marketplace',      group: 'Compute',    default: false, required: false, desc: 'One-click apps' },
  // Storage
  { key: 'objectStorage',  label: 'Object storage',   group: 'Storage',    default: true,  required: false, desc: 'S3-compatible buckets' },
  { key: 'blockStorage',   label: 'Block volumes',    group: 'Storage',    default: false, required: false, desc: 'NVMe persistent volumes' },
  { key: 'managedDb',      label: 'Managed databases', group: 'Storage',   default: false, required: false, desc: 'PostgreSQL / MySQL / Redis' },
  // Network
  { key: 'loadBalancers',  label: 'Load balancers',   group: 'Network',    default: false, required: false, desc: 'HTTP/TCP load balancers' },
  { key: 'dns',            label: 'DNS zones',        group: 'Network',    default: false, required: false, desc: 'DNS hosting' },
  { key: 'firewalls',      label: 'Firewalls',        group: 'Network',    default: true,  required: false, desc: 'Per-server firewall rules' },
  { key: 'vpc',            label: 'VPC & private network', group: 'Network', default: false, required: false, desc: 'Private isolated networks' },
  // Monitoring
  { key: 'monitoring',     label: 'Metrics & graphs', group: 'Monitoring', default: true,  required: false, desc: 'Server metrics' },
  { key: 'alerts',         label: 'Alerts',           group: 'Monitoring', default: false, required: false, desc: 'Zabbix alerts' },
  { key: 'logs',           label: 'Logs',             group: 'Monitoring', default: false, required: false, desc: 'Centralized logs' },
  // Account
  { key: 'projects',       label: 'Projects',         group: 'Account',    default: false, required: false, desc: 'Group resources by project' },
  { key: 'activity',       label: 'Activity log',     group: 'Account',    default: true,  required: false, desc: 'Account audit log' },
  { key: 'team',           label: 'Team',             group: 'Account',    default: false, required: false, desc: 'Multi-user team accounts' },
  { key: 'apiKeys',        label: 'API keys',         group: 'Account',    default: true,  required: false, desc: 'Programmatic access' },
  { key: 'sshKeys',        label: 'SSH keys',         group: 'Account',    default: true,  required: true,  desc: 'SSH key management' },
  { key: 'billing',        label: 'Billing',          group: 'Account',    default: true,  required: true,  desc: 'Invoices & usage' },
  { key: 'referrals',      label: 'Referrals',        group: 'Account',    default: false, required: false, desc: 'Referral program' },
  { key: 'support',        label: 'Support tickets',  group: 'Account',    default: true,  required: false, desc: 'Help desk' },
] as const

export type ModuleKey = typeof MODULE_DEFINITIONS[number]['key']

const DEFAULTS: Record<string, boolean> = MODULE_DEFINITIONS.reduce((acc, m) => {
  acc[m.key] = m.default
  return acc
}, {} as Record<string, boolean>)

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

export default router
