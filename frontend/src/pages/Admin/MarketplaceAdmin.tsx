import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { adminPlatformAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

export default function MarketplaceAdmin() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['admin', 'platform', 'marketplace'],
    queryFn: () => adminPlatformAPI.marketplace().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'platform', 'marketplace'] })

  const remove = useMutation({
    mutationFn: (id: string) => adminPlatformAPI.marketplaceDelete(id),
    onSuccess: () => {
      toast.success('App template deleted')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Marketplace</h1>
          <p className="text-sm text-[#a0a09e] mt-1">One-click app templates customers can deploy.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true) }} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Add app
        </Button>
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : apps.length === 0 ? (
        <Card>
          <Boxes size={20} className="mx-auto mb-2 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No app templates configured.</p>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Name', 'Slug', 'Category', 'Min plan', 'Active', 'Installs', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a: any) => (
                <tr key={a.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-[#e8e8e6] font-medium">{a.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{a.slug}</td>
                  <td className="px-4 py-3 text-xs">{a.category}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.minPlanSlug}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase',
                      a.isActive
                        ? 'text-[#4ade80] bg-green-950/40 border-green-900/60'
                        : 'text-[#6a6a68] bg-[#252625] border-[#2a2b2a]'
                    )}>
                      {a.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{a.installs}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditing(a); setOpen(true) }}
                        className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${a.name}?`)) remove.mutate(a.id) }}
                        className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Editor
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          refresh()
          setOpen(false)
        }}
      />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}

function Editor({ open, editing, onClose, onSuccess }: { open: boolean; editing: any | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<any>(() =>
    editing
      ? { ...editing, ports: (editing.ports ? JSON.parse(editing.ports) : []).join(',') }
      : {
          name: '', slug: '', description: '', logo: '🚀', category: 'CMS',
          minPlanSlug: 'c2-medium', userDataScript: '#!/bin/bash\n', ports: '80,443',
          isActive: true,
        }
  )

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        ports: form.ports.split(',').map((p: string) => parseInt(p.trim(), 10)).filter((n: number) => !isNaN(n)),
        envVars: [],
      }
      delete payload.id
      delete payload.createdAt
      delete payload.installs
      delete payload._count
      return editing
        ? adminPlatformAPI.marketplaceUpdate(editing.id, payload)
        : adminPlatformAPI.marketplaceCreate(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Created')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Save failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">
            {editing ? `Edit ${editing.name}` : 'Add app template'}
          </h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!editing} className="font-mono" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Icon (emoji)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Min plan slug" value={form.minPlanSlug} onChange={(e) => setForm({ ...form, minPlanSlug: e.target.value })} className="font-mono" />
          </div>
          <Input label="Open ports (comma-separated)" value={form.ports} onChange={(e) => setForm({ ...form, ports: e.target.value })} placeholder="80,443" />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">User-data script</label>
            <textarea
              value={form.userDataScript}
              onChange={(e) => setForm({ ...form, userDataScript: e.target.value })}
              rows={10}
              className="w-full bg-[#161716] border border-[#2a2b2a] rounded-md px-3 py-2 text-xs font-mono text-[#e8e8e6]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#a0a09e] cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-[#e0fe56] cursor-pointer"
            />
            Active (visible in customer marketplace)
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!form.name || !form.slug || !form.userDataScript}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
