import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2, Tag, Cpu, Zap, HardDrive } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { plansAdminAPI } from '../../api/endpoints'
import { cn, formatCurrency } from '../../lib/utils'

const CATEGORIES = ['compute', 'bare-metal', 'gpu', 'storage'] as const

const CATEGORY_META: Record<string, { color: string; label: string; icon: any }> = {
  compute:      { color: 'text-[#3d8bff] bg-[#3d8bff]/10 border-[#3d8bff]/40', label: 'Compute',    icon: Cpu },
  'bare-metal': { color: 'text-[#e0fe56] bg-[#e0fe56]/10 border-[#e0fe56]/40', label: 'Bare Metal', icon: HardDrive },
  gpu:          { color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'GPU',     icon: Zap },
  storage:      { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',    label: 'Storage', icon: HardDrive },
}

export default function PlansAdmin() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => plansAdminAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] })

  const remove = useMutation({
    mutationFn: (id: string) => plansAdminAPI.delete(id),
    onSuccess: () => { toast.success('Plan deleted'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  const filtered = filter === 'all' ? plans : plans.filter((p: any) => p.category === filter)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Plans</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Compute, bare-metal, and GPU plans your customers can deploy. Stock fields control bare-metal availability.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true) }} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Create plan
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 mb-4">
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={cn(
              'h-8 px-3 rounded-md text-xs cursor-pointer transition-colors capitalize',
              filter === c ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
            )}
          >
            {c === 'all' ? 'All' : CATEGORY_META[c]?.label || c} ({c === 'all' ? plans.length : plans.filter((p: any) => p.category === c).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Tag size={20} className="mx-auto mb-2 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No plans in this category.</p>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Plan', 'Category', 'Specs', 'Pricing', 'Stock', 'Active', 'Servers', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const cat = CATEGORY_META[p.category] || CATEGORY_META.compute
                const Icon = cat.icon
                return (
                  <tr key={p.id} className="border-t border-[#2a2b2a]">
                    <td className="px-4 py-3">
                      <div className="text-[#e8e8e6] font-medium">{p.name}</div>
                      <div className="font-mono text-[10px] text-[#6a6a68]">{p.slug}</div>
                      {p.isPopular && (
                        <span className="text-[9px] uppercase px-1 py-0.5 mt-1 inline-block rounded bg-[#e0fe56] text-[#0d0e0d]">
                          Popular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 h-5 px-1.5 rounded border text-[10.5px] font-medium uppercase', cat.color)}>
                        <Icon size={10} /> {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a0a09e]">
                      <div>{p.cpu} CPU · {p.ramGB} GB RAM</div>
                      <div>{p.diskGB} GB {p.diskType?.toUpperCase()} · {p.bandwidthTB} TB BW</div>
                      {p.cpuModel && (
                        <div className="text-[10px] text-[#6a6a68] mt-0.5">{p.cpuModel}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.hourlyEnabled && p.priceHourly > 0 && (
                        <div className="text-[#a0a09e]">{formatCurrency(p.priceHourly)}/hr</div>
                      )}
                      {p.monthlyEnabled && (
                        <div className="text-[#e8e8e6] font-medium">{formatCurrency(p.priceMonthly)}/mo</div>
                      )}
                      {p.yearlyEnabled && p.priceYearly > 0 && (
                        <div className="text-[#e0fe56]">{formatCurrency(p.priceYearly)}/yr</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.stockTotal === 0 ? (
                        <span className="text-[10.5px] text-[#a0a09e]">Unlimited</span>
                      ) : (
                        <span className={cn(
                          'tabular-nums text-xs font-medium',
                          p.stockAvailable === 0 ? 'text-red-400' :
                          p.stockAvailable <= 2 ? 'text-amber-400' :
                          'text-[#4ade80]'
                        )}>
                          {p.stockAvailable} / {p.stockTotal}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase',
                        p.isActive
                          ? 'text-[#4ade80] bg-green-950/40 border-green-900/60'
                          : 'text-[#6a6a68] bg-[#252625] border-[#2a2b2a]'
                      )}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#a0a09e]">{p._count?.servers ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditing(p); setOpen(true) }}
                          className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete ${p.name}? This cannot be undone.`)) remove.mutate(p.id) }}
                          className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                          title="Delete"
                          disabled={(p._count?.servers ?? 0) > 0}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <PlanEditor
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSuccess={() => { refresh(); setOpen(false) }}
      />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}

function PlanEditor({ open, editing, onClose, onSuccess }: { open: boolean; editing: any | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<any>(() =>
    editing
      ? { ...editing, raidSupported: (editing.raidSupported || []).join(',') }
      : {
          name: '', slug: '', category: 'compute',
          cpu: 2, ramGB: 4, diskGB: 80, bandwidthTB: 2,
          priceMonthly: 399, priceHourly: 0.54, priceInr: 399, priceYearly: 3990,
          hourlyEnabled: true, monthlyEnabled: true, yearlyEnabled: false,
          diskType: 'nvme', diskCount: 1, raidSupported: '',
          ipv4Included: 1, ipv6Included: 1, stockTotal: 0,
          isActive: true, isPopular: false, sortOrder: 0,
        }
  )

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {
        ...form,
        cpu: Number(form.cpu),
        ramGB: Number(form.ramGB),
        diskGB: Number(form.diskGB),
        bandwidthTB: Number(form.bandwidthTB),
        priceMonthly: Number(form.priceMonthly),
        priceHourly: Number(form.priceHourly),
        priceInr: Number(form.priceInr || form.priceMonthly),
        priceYearly: Number(form.priceYearly || 0),
        diskCount: Number(form.diskCount || 1),
        ipv4Included: Number(form.ipv4Included || 0),
        ipv6Included: Number(form.ipv6Included || 0),
        stockTotal: Number(form.stockTotal || 0),
        sortOrder: Number(form.sortOrder || 0),
        cpuCores: form.cpuCores ? Number(form.cpuCores) : null,
        cpuThreads: form.cpuThreads ? Number(form.cpuThreads) : null,
        raidSupported: form.raidSupported
          ? form.raidSupported.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
      }
      delete payload.id
      delete payload.createdAt
      delete payload._count
      delete payload.stockAvailable
      delete payload.stockReserved
      return editing
        ? plansAdminAPI.update(editing.id, payload)
        : plansAdminAPI.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Plan updated' : 'Plan created')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Save failed'),
  })

  if (!open) return null

  const isBareMetal = form.category === 'bare-metal' || form.category === 'gpu'

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">
            {editing ? `Edit ${editing.name}` : 'Create plan'}
          </h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="c3.large" />
          <Input label="Slug (URL key)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="c3-large" disabled={!!editing} className="font-mono" />

          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c]?.label || c}</option>)}
          </Select>
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />

          <div className="col-span-2 mt-2">
            <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-2">Specs</div>
          </div>
          <Input label="CPU (vCPU or cores)" type="number" value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} />
          <Input label="RAM (GB)" type="number" value={form.ramGB} onChange={(e) => setForm({ ...form, ramGB: e.target.value })} />
          <Input label="Disk (GB)" type="number" value={form.diskGB} onChange={(e) => setForm({ ...form, diskGB: e.target.value })} />
          <Input label="Bandwidth (TB)" type="number" step="0.5" value={form.bandwidthTB} onChange={(e) => setForm({ ...form, bandwidthTB: e.target.value })} />

          {isBareMetal && (
            <>
              <Input label="CPU model" value={form.cpuModel || ''} onChange={(e) => setForm({ ...form, cpuModel: e.target.value })} placeholder="AMD EPYC 7402P" />
              <Select label="Disk type" value={form.diskType} onChange={(e) => setForm({ ...form, diskType: e.target.value })}>
                <option value="nvme">NVMe SSD</option>
                <option value="ssd">SATA SSD</option>
                <option value="hdd">HDD</option>
              </Select>
              <Input label="Disk count" type="number" value={form.diskCount} onChange={(e) => setForm({ ...form, diskCount: e.target.value })} />
              <Input
                label="RAID supported (comma-separated)"
                value={form.raidSupported}
                onChange={(e) => setForm({ ...form, raidSupported: e.target.value })}
                placeholder="raid0,raid1,raid10"
                className="font-mono text-xs"
              />
              <Input label="CPU cores (physical)" type="number" value={form.cpuCores || ''} onChange={(e) => setForm({ ...form, cpuCores: e.target.value })} />
              <Input label="CPU threads" type="number" value={form.cpuThreads || ''} onChange={(e) => setForm({ ...form, cpuThreads: e.target.value })} />
              <Input label="IPv4 included" type="number" value={form.ipv4Included} onChange={(e) => setForm({ ...form, ipv4Included: e.target.value })} />
              <Input label="IPv6 included" type="number" value={form.ipv6Included} onChange={(e) => setForm({ ...form, ipv6Included: e.target.value })} />
              <Input label="Stock total (0 = unlimited)" type="number" value={form.stockTotal} onChange={(e) => setForm({ ...form, stockTotal: e.target.value })} />
            </>
          )}

          <div className="col-span-2 mt-2">
            <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-2">Pricing (₹)</div>
          </div>
          <Input label="Price hourly" type="number" step="0.01" value={form.priceHourly} onChange={(e) => setForm({ ...form, priceHourly: e.target.value })} />
          <Input label="Price monthly" type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} />
          <Input label="Price yearly" type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} />
          <Input label="Display price (priceInr)" type="number" value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} />

          <div className="col-span-2 mt-2 flex flex-wrap gap-4">
            {(['hourly', 'monthly', 'yearly'] as const).map((cycle) => {
              const flag = `${cycle}Enabled`
              return (
                <label key={cycle} className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={!!form[flag]}
                    onChange={(e) => setForm({ ...form, [flag]: e.target.checked })}
                    className="accent-[#e0fe56] cursor-pointer"
                  />
                  {cycle} billing offered
                </label>
              )
            })}
            <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="accent-[#e0fe56] cursor-pointer"
              />
              Active (visible to customers)
            </label>
            <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.isPopular}
                onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                className="accent-[#e0fe56] cursor-pointer"
              />
              Mark as Popular
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!form.name || !form.slug || !form.priceMonthly}
          >
            {editing ? 'Save changes' : 'Create plan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
