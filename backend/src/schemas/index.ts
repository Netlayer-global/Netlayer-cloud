/**
 * Shared validation schemas. Single source of truth for:
 *   - request validation in backend routes
 *   - admin / customer client typed helpers
 *   - the future Terraform provider (codegen target)
 *   - the OpenAPI spec (mirror these shapes)
 *
 * Keep schemas focused on shape only — business rules (quotas, ownership,
 * status transitions) live in services.
 */

import { z } from 'zod'

// ─── primitives ───────────────────────────────────────────
export const Cuid = z.string().min(20).max(40)
export const Email = z.string().email().max(254)
export const Hostname = z.string().regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, 'Invalid hostname')
export const SafeName = z.string().min(1).max(64).regex(/^[\w\- .]+$/, 'Use letters, digits, spaces, dot, dash, underscore')
export const StrongPassword = z
  .string()
  .min(8, 'Min 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Need uppercase')
  .regex(/\d/, 'Need digit')
export const CountryCode = z.string().length(2).regex(/^[A-Z]{2}$/, 'ISO-3166 alpha-2')
export const CurrencyCode = z.string().length(3).regex(/^[A-Z]{3}$/, 'ISO-4217')
export const IpV4 = z.string().regex(
  /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/,
  'Invalid IPv4'
)
export const Cidr = z.string().regex(
  /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}\/([0-9]|[12]\d|3[0-2])$/,
  'Invalid CIDR'
)
export const Port = z.coerce.number().int().min(1).max(65535)

// ─── auth ─────────────────────────────────────────────────
export const RegisterInput = z.object({
  email: Email,
  password: StrongPassword,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
})

export const LoginInput = z.object({
  email: Email,
  password: z.string().min(1).max(128),
})

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: StrongPassword,
})

export const ProfileUpdateInput = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(5).max(20).optional(),
  country: CountryCode.optional(),
  timezone: z.string().min(1).max(64).optional(),
  language: z.string().min(2).max(8).optional(),
})

export const ResetPasswordInput = z.object({
  token: z.string().min(20).max(128),
  newPassword: StrongPassword,
})

export const TwoFactorVerifyInput = z.object({
  token: z.string().regex(/^\d{6}$/, '6-digit code required'),
})

// ─── catalog ──────────────────────────────────────────────
export const PlanSlug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,30}$/)
export const RegionSlug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,30}$/)
export const OsSlug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,30}$/)

// ─── server CRUD ─────────────────────────────────────────
export const ServerCreateInput = z.object({
  name: SafeName,
  planId: Cuid,
  regionId: Cuid,
  osTemplateId: Cuid,
  sshKeyId: Cuid.optional(),
  rootPassword: z.string().min(8).max(64).optional(),
})
export type ServerCreateInput = z.infer<typeof ServerCreateInput>

export const PowerActionInput = z.object({
  action: z.enum(['start', 'stop', 'restart']),
})

export const RebuildServerInput = z.object({
  osTemplateId: Cuid,
  rootPassword: StrongPassword,
})

export const SnapshotCreateInput = z.object({
  name: SafeName,
})

export const FirewallRuleInput = z.object({
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  protocol: z.enum(['TCP', 'UDP', 'ICMP', 'ALL']),
  portFrom: Port.optional(),
  portTo: Port.optional(),
  sourceIp: z.union([IpV4, Cidr]).optional(),
  action: z.enum(['ACCEPT', 'DROP', 'REJECT']).default('ACCEPT'),
  priority: z.number().int().min(1).max(10000).optional(),
})

// ─── billing ──────────────────────────────────────────────
export const CreatePaymentOrderInput = z.object({
  invoiceId: Cuid,
})

export const VerifyRazorpayInput = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  invoiceId: Cuid,
})

// ─── ssh keys ────────────────────────────────────────────
export const SshKeyCreateInput = z.object({
  name: SafeName,
  publicKey: z
    .string()
    .min(50)
    .max(8192)
    .refine((s) => /^(ssh-rsa|ssh-ed25519|ecdsa-sha2)/.test(s.trim()), {
      message: 'Public key must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2',
    }),
})

// ─── api keys ────────────────────────────────────────────
export const ApiKeyCreateInput = z.object({
  name: SafeName,
  permissions: z.array(z.string().min(1).max(64)).max(64).optional(),
  expiresAt: z.string().datetime().optional(),
})

// ─── admin: nodes ────────────────────────────────────────
export const NodeCreateInput = z.object({
  name: z.string().min(1).max(64),
  regionId: Cuid,
  proxmoxHost: z.string().url(),
  proxmoxNode: z.string().min(1).max(64),
  proxmoxTokenId: z.string().min(1).max(128),
  proxmoxTokenSecret: z.string().min(1).max(256),
  totalCpu: z.number().int().min(1).max(2048),
  totalRamGB: z.number().int().min(1).max(65536),
  totalDiskGB: z.number().int().min(1).max(1_000_000),
  maxVMs: z.number().int().min(1).max(10000).optional(),
  networkGbps: z.number().int().min(1).max(400).optional(),
  ipRanges: z.array(Cidr).max(64).optional(),
})

export const NodeUpdateInput = NodeCreateInput.partial().extend({
  isActive: z.boolean().optional(),
  maintenanceNote: z.string().max(500).optional(),
})

export const NodeMaintenanceInput = z.object({
  enabled: z.boolean(),
  note: z.string().max(500).optional(),
})

// ─── admin: users ────────────────────────────────────────
export const AdminUpdateUserInput = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'BILLING']).optional(),
  balance: z.number().optional(),
  creditLimit: z.number().min(0).optional(),
  country: CountryCode.optional(),
  currency: CurrencyCode.optional(),
  notes: z.string().max(2000).optional(),
})

export const AdjustBalanceInput = z.object({
  amount: z.number().positive().max(10_000_000),
  reason: z.string().min(1).max(500),
  type: z.enum(['credit', 'debit']),
})

// ─── admin: tickets ──────────────────────────────────────
export const TicketReplyInput = z.object({
  content: z.string().min(1).max(20_000),
  isInternal: z.boolean().optional(),
})

export const TicketUpdateInput = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  assignedTo: Cuid.nullable().optional(),
  category: z.string().min(1).max(64).optional(),
})

// ─── admin: roles ────────────────────────────────────────
export const RoleCreateInput = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z][a-z_]*$/, 'snake_case identifier'),
  displayName: z.string().min(1).max(64),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1).max(64)).max(256),
})

export const RoleUpdateInput = z.object({
  displayName: z.string().min(1).max(64).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1).max(64)).max(256).optional(),
})

// ─── admin: announcements ────────────────────────────────
export const AnnouncementCreateInput = z.object({
  title: z.string().min(1).max(140),
  message: z.string().min(1).max(2000),
  type: z.enum(['info', 'warning', 'maintenance']).optional(),
  targetAll: z.boolean().optional(),
  targetRoles: z.array(z.string().min(1).max(64)).max(16).optional(),
  expiresAt: z.string().datetime().optional(),
})

// ─── pagination ──────────────────────────────────────────
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
})
export type PaginationQuery = z.infer<typeof PaginationQuery>

// ─── helper ──────────────────────────────────────────────
/**
 * Express helper that throws a structured error from a Zod result.
 * Use:  const data = parse(req.body, ServerCreateInput)
 */
export function parse<T extends z.ZodTypeAny>(input: unknown, schema: T): z.infer<T> {
  return schema.parse(input)
}
