import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Flag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { featureFlagsAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

/**
 * Round 24 — Admin feature flags UI.
 *
 * List of flags with default toggle, rollout percent slider, and a count
 * of per-user overrides. Use rollout percent for canary releases (e.g.
 * 10% of users see the new deploy wizard).
 */
export default function FeatureFlags() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'flags'],
    queryFn: () => featureFlagsAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'flags'] })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => featureFlagsAPI.update(id, data),
    onSuccess: () => refresh(),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => featureFlagsAPI.delete(id),
    onSuccess: () => { toast.success('Flag deleted'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Feature flags</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Kill-switches and gradual rollouts. Toggle a flag default or roll out by percentage of users.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" /> New flag
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : flags.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Flag size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No flags defined yet.</p>
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Key', 'Description', 'Default', 'Rollout %', 'Overrides', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flags.map((f: any) => (
                <tr key={f.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 font-mono text-xs text-[#e8e8e6]">{f.key}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">{f.description || '—'}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.defaultEnabled}
                        onChange={(e) => update.mutate({ id: f.id, data: { defaultEnabled: e.target.checked } })}
                        className="accent-[#e0fe56] cursor-pointer"
                      />
                      <span className={cn('text-[10.5px] uppercase font-medium', f.defaultEnabled ? 'text-[#4ade80]' : 'text-[#6a6a68]')}>
                        {f.defaultEnabled ? 'On' : 'Off'}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={f.rolloutPercent}
                      onChange={(e) => update.mutate({ id: f.id, data: { rolloutPercent: Number(e.target.value) } })}
                      className="w-32 accent-[#e0fe56] cursor-pointer"
                    />
                    <span className="ml-2 text-[10.5px] tabular-nums text-[#a0a09e]">{f.rolloutPercent}%</span>
                  </td>
                  <td className="px-4 py-3 text-[10.5px] text-[#a0a09e] tabular-nums">{f._count?.overrides ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (confirm(`Delete flag ${f.key}?`)) remove.mutate(f.id) }}
                      className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal open={open} onClose={() => setOpen(false)} onSuccess={refresh} />
    </div>
  )
}

function CreateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ key: '', description: '', defaultEnabled: false, rolloutPercent: 0 })

  const create = useMutation({
    mutationFn: () => featureFlagsAPI.create(form),
    onSuccess: () => {
      toast.success('Flag created')
      onSuccess()
      onClose()
      setForm({ key: '', description: '', defaultEnabled: false, rolloutPercent: 0 })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Create failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">New feature flag</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        <div className="space-y-3">
          <Input label="Key (lowercase + dashes)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase() })} placeholder="deploy-wizard-v2" className="font-mono" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this flag controls" />
          <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
            <input
              type="checkbox"
              checked={form.defaultEnabled}
              onChange={(e) => setForm({ ...form, defaultEnabled: e.target.checked })}
              className="accent-[#e0fe56] cursor-pointer"
            />
            Enabled by default
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!/^[a-z0-9-]+$/.test(form.key)}>Create</Button>
        </div>
      </div>
    </div>
  )
}
