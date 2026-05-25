import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Search, Server as ServerIcon, Wallet, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { adminAPI, catalogAPI, enterpriseAdminAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

/**
 * Round 22 — Enterprise customers admin console.
 *
 * From here an operator can:
 *   1. Search any user
 *   2. Switch billing mode: retail | wallet | enterprise
 *   3. Deploy a server on behalf of an enterprise/wallet user (no payment)
 *
 * Retail users are intentionally disallowed from admin-side deploy because
 * billing for them is per-checkout — admin deploying free servers for
 * retail users would short-circuit the revenue model.
 */

const MODES = [
  {
    value: 'retail',
    label: 'Retail',
    desc: 'Pay full month upfront via Razorpay/Stripe before each deploy',
    icon: Wallet,
    color: 'text-[#a0a09e]',
  },
  {
    value: 'wallet',
    label: 'Wallet',
    desc: 'Hourly debit from prepaid balance (legacy power users)',
    icon: Wallet,
    color: 'text-[#3d8bff]',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    desc: 'No per-deploy payment. Monthly invoice. Admin can deploy on behalf.',
    icon: Building2,
    color: 'text-[#e0fe56]',
  },
] as const

export default function EnterpriseAdmin() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [deployOpen, setDeployOpen] = useState(false)

  const { data: usersResp, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminAPI.getUsers(1, search).then((r) => r.data),
  })
  const users = usersResp?.data ?? []
  const selectedUser = users.find((u: any) => u.id === selectedUserId) ?? null

  const setMode = useMutation({
    mutationFn: (data: { mode: 'retail' | 'wallet' | 'enterprise'; contractValue?: number; notes?: string }) =>
      enterpriseAdminAPI.setBillingMode(selectedUserId!, data),
    onSuccess: () => {
      toast.success('Billing mode updated')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Enterprise customers</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Switch any user between retail / wallet / enterprise billing, and deploy servers on their behalf without payment.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Left: user search list */}
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-[#2a2b2a]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#6a6a68]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name…"
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-xs text-[#6a6a68] text-center">Loading…</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-xs text-[#6a6a68] text-center">No users found</div>
            ) : (
              users.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  className={cn(
                    'w-full text-left p-3 border-b border-[#2a2b2a] cursor-pointer transition-colors',
                    selectedUserId === u.id
                      ? 'bg-[#252625]'
                      : 'hover:bg-[#161716]'
                  )}
                >
                  <div className="text-sm text-[#e8e8e6]">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-xs text-[#a0a09e]">{u.email}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <ModeBadge mode={u.billingMode} />
                    {u.role !== 'USER' && (
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-[#3d8bff]/20 text-[#3d8bff] border border-[#3d8bff]/40">
                        {u.role}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: actions for selected user */}
        <div>
          {!selectedUser ? (
            <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-12 text-center">
              <Building2 size={28} className="mx-auto mb-3 text-[#6a6a68]" />
              <p className="text-sm text-[#a0a09e]">
                Select a user from the left to manage their billing mode or deploy a server on their behalf.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User card */}
              <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-medium text-[#e8e8e6]">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div className="text-sm text-[#a0a09e] mt-0.5">{selectedUser.email}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#6a6a68]">
                      <span>Country: {selectedUser.country}</span>
                      <span>·</span>
                      <span>Currency: {selectedUser.currency || 'INR'}</span>
                      <span>·</span>
                      <span>Balance: ₹{(selectedUser.balance ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <ModeBadge mode={selectedUser.billingMode || 'retail'} />
                </div>
              </div>

              {/* Mode picker */}
              <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Billing mode</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MODES.map((m) => {
                    const Icon = m.icon
                    const active = selectedUser.billingMode === m.value
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMode.mutate({ mode: m.value as any })}
                        disabled={active || setMode.isPending}
                        className={cn(
                          'text-left p-4 rounded-lg border transition-colors',
                          active
                            ? 'border-[#e0fe56]/40 bg-[#e0fe56]/5'
                            : 'border-[#2a2b2a] bg-[#161716] hover:border-[#e0fe56]/30 cursor-pointer'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className={m.color} />
                          <span className="text-sm font-medium text-[#e8e8e6]">{m.label}</span>
                          {active && (
                            <span className="ml-auto text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#e0fe56] text-[#0d0e0d]">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a0a09e] leading-relaxed">{m.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Deploy on behalf */}
              <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-[#e8e8e6]">Deploy server</h3>
                    <p className="text-xs text-[#a0a09e] mt-0.5">
                      Deploy a server on this user's behalf — no payment required.
                      Available only for wallet / enterprise mode.
                    </p>
                  </div>
                  <Button
                    onClick={() => setDeployOpen(true)}
                    disabled={selectedUser.billingMode === 'retail'}
                    title={selectedUser.billingMode === 'retail' ? 'Switch to wallet/enterprise first' : undefined}
                  >
                    <ServerIcon size={14} className="mr-1.5" /> Deploy server
                  </Button>
                </div>
              </div>

              <DeployForUserModal
                open={deployOpen}
                onClose={() => setDeployOpen(false)}
                userId={selectedUser.id}
                userEmail={selectedUser.email}
                onDeployed={(serverId) => {
                  setDeployOpen(false)
                  qc.invalidateQueries({ queryKey: ['admin', 'users'] })
                  toast.success(`Server deployed for ${selectedUser.email}`)
                  // Optional: navigate to /admin/servers/:id
                  void serverId
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  const cfg = MODES.find((m) => m.value === mode) || MODES[0]
  return (
    <span className={cn(
      'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase tracking-wide',
      mode === 'enterprise'
        ? 'text-[#e0fe56] bg-[#e0fe56]/10 border-[#e0fe56]/40'
        : mode === 'wallet'
        ? 'text-[#3d8bff] bg-[#3d8bff]/10 border-[#3d8bff]/40'
        : 'text-[#a0a09e] bg-[#252625] border-[#2a2b2a]'
    )}>
      {cfg.label}
    </span>
  )
}

function DeployForUserModal({
  open, onClose, userId, userEmail, onDeployed,
}: {
  open: boolean
  onClose: () => void
  userId: string
  userEmail: string
  onDeployed: (serverId: string) => void
}) {
  const [name, setName] = useState('')
  const [planId, setPlanId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [osTemplateId, setOsTemplateId] = useState('')

  const { data: plans = [] }   = useQuery({ queryKey: ['plans'],   queryFn: () => catalogAPI.getPlans().then((r) => r.data.data),   enabled: open })
  const { data: regions = [] } = useQuery({ queryKey: ['regions'], queryFn: () => catalogAPI.getRegions().then((r) => r.data.data), enabled: open })
  const { data: osList = [] }  = useQuery({ queryKey: ['os'],      queryFn: () => catalogAPI.getOS().then((r) => r.data.data),      enabled: open })

  const deploy = useMutation({
    mutationFn: () =>
      enterpriseAdminAPI.deployForUser(userId, {
        name,
        planId,
        regionId,
        osTemplateId,
      }),
    onSuccess: (r: any) => {
      onDeployed(r.data.data.id)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Deploy failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">
            <Shield size={14} className="inline mr-1.5 text-[#e0fe56]" />
            Deploy for {userEmail}
          </h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <Input label="Server name" value={name} onChange={(e) => setName(e.target.value)} placeholder="prod-web-01" />
          <Select label="Region" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            <option value="">Choose region…</option>
            {regions.map((r: any) => (
              <option key={r.id} value={r.id}>{r.flag} {r.city}</option>
            ))}
          </Select>
          <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">Choose plan…</option>
            {plans.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.cpu} CPU · {p.ramGB} GB · {p.diskGB} GB · ₹{p.priceInr}/mo
              </option>
            ))}
          </Select>
          <Select label="OS" value={osTemplateId} onChange={(e) => setOsTemplateId(e.target.value)}>
            <option value="">Choose OS…</option>
            {osList.map((o: any) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>

          <div className="px-3 py-2 rounded-md bg-[#161716] border border-[#2a2b2a] text-xs text-[#a0a09e]">
            <strong className="text-[#e0fe56]">No payment required.</strong> An invoice will be issued in PENDING status and aggregated into the user's monthly bill.
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => deploy.mutate()}
            loading={deploy.isPending}
            disabled={!name || !planId || !regionId || !osTemplateId}
          >
            Deploy
          </Button>
        </div>
      </div>
    </div>
  )
}
