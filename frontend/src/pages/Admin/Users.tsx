import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MoreHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatCurrency, formatDate, initials, relativeTime } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

type Status = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'
const STATUS_TABS: Status[] = ['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED']

export default function AdminUsers() {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status>('ALL')
  const [country, setCountry] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, status, country, role],
    queryFn: () =>
      adminAPI.listUsers({
        search,
        status: status === 'ALL' ? undefined : status,
        country: country || undefined,
        role: role || undefined,
      }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-user', drawerUserId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const impersonate = useMutation({
    mutationFn: (id: string) => adminAPI.impersonateUser(id),
    onSuccess: (data) => {
      toast.success(`Impersonation token issued (5 min) — copy from console`)
      console.info('Impersonation token:', data)
      navigator.clipboard?.writeText(data.token).catch(() => {})
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const users = data?.data || []
  const countries = Array.from(new Set(users.map((u: any) => u.country))).sort()

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Users</h1>
        <p className="text-sm text-[#a0a09e] mt-1">{data?.pagination?.total ?? 0} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setStatus(t)}
              className={cn(
                'h-7 px-3 text-xs rounded cursor-pointer transition-colors capitalize',
                status === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
              )}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={country} onChange={(e) => setCountry(e.target.value)} className="w-32">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c as string} value={c as string}>{c as string}</option>)}
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPPORT">Support</option>
          <option value="BILLING">Billing</option>
          <option value="USER">Client</option>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : users.length === 0 ? (
        <EmptyTable message="No users match your filters." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>User</TH>
              <TH>Country</TH>
              <TH>Role</TH>
              <TH className="text-right">Servers</TH>
              <TH className="text-right">Balance</TH>
              <TH>Status</TH>
              <TH>Joined</TH>
              <TH className="w-20 text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {users.map((u: any) => (
              <TR key={u.id} className="cursor-pointer" onClick={() => setDrawerUserId(u.id)}>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-[11px] font-medium shrink-0">
                      {initials(u.firstName, u.lastName)}
                    </div>
                    <div>
                      <div className="text-[#e8e8e6] font-medium">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-[#6a6a68]">{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD>{u.country}</TD>
                <TD><Badge variant={u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'preview' : 'default'}>{u.role.toLowerCase().replace('_', ' ')}</Badge></TD>
                <TD className="text-right">{u._count?.servers ?? 0}</TD>
                <TD className="text-right">{formatCurrency(u.balance, u.currency)}</TD>
                <TD>
                  <Badge variant={u.status === 'ACTIVE' ? 'running' : u.status === 'SUSPENDED' ? 'building' : 'error'}>
                    {u.status.toLowerCase()}
                  </Badge>
                </TD>
                <TD>{formatDate(u.createdAt)}</TD>
                <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex gap-1">
                    {u.id !== me?.id && (
                      <>
                        {u.status === 'ACTIVE' ? (
                          <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: u.id, data: { status: 'SUSPENDED' } })}>
                            Suspend
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => update.mutate({ id: u.id, data: { status: 'ACTIVE' } })}>
                            Activate
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <UserDrawer userId={drawerUserId} onClose={() => setDrawerUserId(null)} />
    </div>
  )
}

function UserDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'profile' | 'servers' | 'billing' | 'activity' | 'notes'>('profile')
  const [adjustOpen, setAdjustOpen] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminAPI.getUser(userId!),
    enabled: !!userId,
  })

  if (!userId) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-[520px] max-w-full bg-[#161716] border-l border-[#2a2b2a] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2a]">
          <h2 className="font-medium">User detail</h2>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {isLoading || !user ? (
          <div className="p-4">
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[#2a2b2a]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-base font-medium">
                  {initials(user.firstName, user.lastName)}
                </div>
                <div>
                  <div className="font-medium text-[#e8e8e6]">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-[#a0a09e]">{user.email}</div>
                  <div className="text-xs text-[#6a6a68]">{user.country} · {user.timezone}</div>
                </div>
              </div>
            </div>

            <div className="border-b border-[#2a2b2a] flex items-center px-3">
              {(['profile', 'servers', 'billing', 'activity', 'notes'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 h-9 text-xs cursor-pointer transition-colors relative capitalize',
                    tab === t ? 'text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
                  )}
                >
                  {t}
                  {tab === t && <span className="absolute left-0 right-0 -bottom-px h-px bg-[#e0fe56]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'profile' && (
                <div className="space-y-3 text-sm">
                  <Row label="Status">
                    <Badge variant={user.status === 'ACTIVE' ? 'running' : user.status === 'SUSPENDED' ? 'building' : 'error'}>
                      {user.status.toLowerCase()}
                    </Badge>
                  </Row>
                  <Row label="Role">{user.role}</Row>
                  <Row label="Phone">{user.phone || '—'}</Row>
                  <Row label="Country / Currency">{user.country} / {user.currency}</Row>
                  <Row label="Email verified">{user.emailVerified ? '✓' : '—'}</Row>
                  <Row label="Balance">{formatCurrency(user.balance, user.currency)}</Row>
                  <Row label="Credit limit">{formatCurrency(user.creditLimit, user.currency)}</Row>
                  <Row label="Joined">{formatDate(user.createdAt)}</Row>
                  <Row label="Last login">{user.lastLoginAt ? relativeTime(user.lastLoginAt) : 'never'}</Row>

                  <div className="pt-3 mt-3 border-t border-[#2a2b2a]">
                    <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Roles</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.roleAssignments || []).map((a: any) => (
                        <Badge key={a.id} variant="preview">{a.role.displayName}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'servers' && (
                user.servers?.length === 0 ? (
                  <p className="text-sm text-[#6a6a68]">No servers.</p>
                ) : (
                  <div className="space-y-2">
                    {user.servers.map((s: any) => (
                      <div key={s.id} className="border border-[#2a2b2a] rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-[#e8e8e6]">{s.name}</div>
                          <Badge variant={s.status === 'RUNNING' ? 'running' : 'stopped'} showDot>{s.status.toLowerCase()}</Badge>
                        </div>
                        <div className="text-xs text-[#6a6a68] mt-0.5 font-mono">{s.ipv4 || s.hostname}</div>
                        <div className="text-xs text-[#a0a09e] mt-1">{s.plan?.name} · {s.region?.flag} {s.region?.city}</div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'billing' && (
                <div className="space-y-4">
                  <div className="border border-[#2a2b2a] rounded-md p-4">
                    <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-1">Balance</div>
                    <div className="text-2xl font-medium text-[#e8e8e6] mb-3">{formatCurrency(user.balance, user.currency)}</div>
                    <Button size="sm" onClick={() => setAdjustOpen(true)}>Adjust balance</Button>
                  </div>

                  <div>
                    <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Recent invoices</div>
                    {user.invoices?.length === 0 ? (
                      <p className="text-sm text-[#6a6a68]">No invoices.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {user.invoices.map((i: any) => (
                          <div key={i.id} className="flex items-center justify-between text-sm border border-[#2a2b2a] rounded-md p-2.5">
                            <div>
                              <div className="font-mono text-xs">{i.invoiceNumber.slice(-10)}</div>
                              <div className="text-[11px] text-[#6a6a68]">{formatDate(i.createdAt)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[#e8e8e6]">{formatCurrency(i.total > 0 ? i.total : i.amount, i.currency)}</div>
                              <Badge variant={i.status === 'PAID' ? 'running' : i.status === 'PENDING' ? 'pending' : 'error'}>
                                {i.status.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Active sessions</div>
                    {user.sessions?.length === 0 ? (
                      <p className="text-sm text-[#6a6a68]">No sessions.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {user.sessions.map((s: any) => (
                          <div key={s.id} className="border border-[#2a2b2a] rounded-md p-2.5 text-xs">
                            <div className="font-mono">{s.ipAddress || 'unknown IP'}</div>
                            <div className="text-[10px] text-[#6a6a68] truncate">{s.userAgent}</div>
                            <div className="text-[10px] text-[#6a6a68] mt-1">last used {relativeTime(s.lastUsedAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'notes' && <NotesEditor user={user} onSave={() => qc.invalidateQueries({ queryKey: ['admin-user', userId] })} />}
            </div>
          </>
        )}

        <AdjustBalanceModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          userId={userId}
          currency={user?.currency || 'INR'}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin-user', userId] })
            qc.invalidateQueries({ queryKey: ['admin-users'] })
          }}
        />
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#6a6a68] uppercase tracking-wide">{label}</span>
      <span className="text-[#e8e8e6]">{children}</span>
    </div>
  )
}

function NotesEditor({ user, onSave }: { user: any; onSave: () => void }) {
  const [notes, setNotes] = useState(user.notes || '')
  const update = useMutation({
    mutationFn: () => adminAPI.updateUser(user.id, { notes }),
    onSuccess: () => {
      toast.success('Notes saved')
      onSave()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })
  return (
    <div className="space-y-3">
      <textarea
        className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] placeholder-[#6a6a68] rounded-md px-3 py-2 text-sm h-40 focus:border-[#e0fe56] focus:outline-none transition-colors resize-none"
        placeholder="Internal notes (admin only)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button onClick={() => update.mutate()} loading={update.isPending}>Save notes</Button>
    </div>
  )
}

function AdjustBalanceModal({
  open, onClose, userId, currency, onSuccess,
}: {
  open: boolean; onClose: () => void; userId: string; currency: string; onSuccess: () => void
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState<'credit' | 'debit'>('credit')

  const submit = useMutation({
    mutationFn: () => adminAPI.adjustBalance(userId, parseFloat(amount), reason, type),
    onSuccess: () => {
      toast.success('Balance adjusted')
      onSuccess()
      onClose()
      setAmount('')
      setReason('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust balance"
      description={`Currency: ${currency}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!amount || !reason || parseFloat(amount) <= 0}
            loading={submit.isPending}
            onClick={() => submit.mutate()}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5">
          <button onClick={() => setType('credit')} className={cn('flex-1 h-8 text-xs rounded transition-colors', type === 'credit' ? 'bg-[#252625] text-[#4ade80]' : 'text-[#a0a09e]')}>+ Credit</button>
          <button onClick={() => setType('debit')} className={cn('flex-1 h-8 text-xs rounded transition-colors', type === 'debit' ? 'bg-[#252625] text-[#f87171]' : 'text-[#a0a09e]')}>− Debit</button>
        </div>
        <Input label="Amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Reason</label>
          <textarea
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] placeholder-[#6a6a68] rounded-md px-3 py-2 text-sm h-20 focus:border-[#e0fe56] focus:outline-none resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you adjusting this balance?"
          />
        </div>
      </div>
    </Modal>
  )
}
