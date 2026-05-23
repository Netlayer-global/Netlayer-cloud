import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { promoAdminAPI } from '../../api/endpoints'
import { cn, formatCurrency } from '../../lib/utils'

const randomCode = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join('')
}

export default function PromoAdmin() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['admin', 'promos'],
    queryFn: () => promoAdminAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => promoAdminAPI.update(id, { isActive }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => promoAdminAPI.delete(id),
    onSuccess: () => {
      toast.success('Promo deleted')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  const totalCredit = promos.reduce((s: number, p: any) => s + (p.creditGiven || 0), 0)
  const monthRedemptions = promos.reduce((s: number, p: any) => s + (p.redemptionCount || 0), 0)
  const active = promos.filter((p: any) => p.isActive).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Promo codes</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Credit codes customers redeem at <code className="text-[#e0fe56]">/dashboard/billing</code>.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Create code
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total codes" value={promos.length} />
        <Stat label="Active" value={active} accent="#4ade80" />
        <Stat label="Redemptions" value={monthRedemptions} />
        <Stat label="Credit given" value={formatCurrency(totalCredit)} mono />
      </div>

      {isLoading ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">Loading…</div>
      ) : promos.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#a0a09e]">
          No promo codes yet.
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Code', 'Amount', 'Used / Limit', 'Min topup', 'Expires', 'Active', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map((p: any) => {
                const expired = p.expiresAt && new Date(p.expiresAt) < new Date()
                return (
                  <tr key={p.id} className="border-t border-[#2a2b2a]">
                    <td className="px-4 py-3 font-mono text-[13px] text-[#e0fe56]">{p.code}</td>
                    <td className="px-4 py-3 text-[#e8e8e6] font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#a0a09e]">
                      {p.usageCount} / {p.usageLimit}
                    </td>
                    <td className="px-4 py-3 text-[#a0a09e]">
                      {p.minTopup > 0 ? formatCurrency(p.minTopup) : '—'}
                    </td>
                    <td className={cn('px-4 py-3 text-xs', expired ? 'text-red-400' : 'text-[#a0a09e]')}>
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle.mutate({ id: p.id, isActive: !p.isActive })}
                        className={cn(
                          'relative h-5 w-9 rounded-full transition-colors cursor-pointer',
                          p.isActive ? 'bg-[#e0fe56]' : 'bg-[#252625]'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-4 w-4 rounded-full bg-[#0d0e0d] transition-transform',
                            p.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={p.usageCount > 0}
                        onClick={() => remove.mutate(p.id)}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          p.usageCount > 0
                            ? 'text-[#3a3c3a] cursor-not-allowed'
                            : 'text-red-400 hover:bg-red-950/40 cursor-pointer'
                        )}
                        title={p.usageCount > 0 ? 'Disable instead — already redeemed' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={refresh} />
    </div>
  )
}

function Stat({ label, value, accent, mono }: { label: string; value: string | number; accent?: string; mono?: boolean }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className={cn('text-2xl font-medium mt-1 tabular-nums', mono && 'font-mono')} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

function CreateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState(500)
  const [usageLimit, setUsageLimit] = useState(100)
  const [minTopup, setMinTopup] = useState(0)
  const [expiresAt, setExpiresAt] = useState('')

  const create = useMutation({
    mutationFn: () =>
      promoAdminAPI.create({
        code: code || undefined,
        amount,
        usageLimit,
        minTopup,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Promo code created')
      onSuccess()
      onClose()
      setCode('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Create failed'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Create promo code</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Code</label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME500 (or generate)"
                className="font-mono"
              />
              <Button variant="secondary" type="button" onClick={() => setCode(randomCode())}>
                <RefreshCw size={13} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <Input label="Usage limit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min topup (₹)" type="number" value={minTopup} onChange={(e) => setMinTopup(Number(e.target.value))} />
            <Input label="Expires at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={amount <= 0}>
            Create
          </Button>
        </div>
      </div>
    </div>
  )
}
