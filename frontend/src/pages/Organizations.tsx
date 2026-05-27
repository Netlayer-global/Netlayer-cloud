import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { organizationsAPI } from '../api/endpoints'
import { cn } from '../lib/utils'

/**
 * Round 24 — Organizations / teams.
 *
 * Lists user's owned + invited orgs, lets them create new ones. Click an
 * org to view members, invite new members, and edit GST/PAN.
 */
export default function Organizations() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsAPI.list().then((r: any) => r.data.data),
  })

  const remove = useMutation({
    mutationFn: (id: string) => organizationsAPI.delete(id),
    onSuccess: () => {
      toast.success('Organization deleted')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Organizations</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Group servers + invoices under a company entity. Each org has its own GST, billing email, and team members.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" /> New organization
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : orgs.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Building2 size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">
            You're not part of any organization yet. Create one for your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orgs.map((o: any) => (
            <div
              key={o.id}
              className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4 hover:border-[#333433] transition-colors cursor-pointer"
              onClick={() => navigate(`/dashboard/organizations/${o.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-[#252625] border border-[#333433] flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-[#e0fe56]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#e8e8e6] truncate">{o.name}</div>
                    <div className="text-[11px] text-[#6a6a68] font-mono truncate">{o.slug}</div>
                  </div>
                </div>
                <span className={cn(
                  'shrink-0 inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase ml-2',
                  o.role === 'owner' ? 'text-[#e0fe56] bg-[#e0fe56]/10 border-[#e0fe56]/30'
                  : 'text-[#a0a09e] bg-[#252625] border-[#2a2b2a]'
                )}>
                  {o.role}
                </span>
              </div>
              {o.gstNumber && (
                <div className="mt-3 text-[11px] text-[#a0a09e]">GSTIN <span className="font-mono">{o.gstNumber}</span></div>
              )}
              <div className="mt-3 pt-3 border-t border-[#2a2b2a] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[#a0a09e]">
                  <Users size={11} /> {o.members?.length || 1} member{(o.members?.length || 1) === 1 ? '' : 's'}
                </div>
                {o.role === 'owner' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete ${o.name}? This removes all members and cannot be undone.`)) remove.mutate(o.id)
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', billingEmail: '', gstNumber: '', panNumber: '' })

  const create = useMutation({
    mutationFn: () => organizationsAPI.create({
      name: form.name,
      billingEmail: form.billingEmail || undefined,
      gstNumber: form.gstNumber || undefined,
      panNumber: form.panNumber || undefined,
    }),
    onSuccess: () => {
      toast.success('Organization created')
      qc.invalidateQueries({ queryKey: ['organizations'] })
      onClose()
      setForm({ name: '', billingEmail: '', gstNumber: '', panNumber: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Create failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">New organization</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        <div className="space-y-3">
          <Input label="Legal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Cloud Pvt Ltd" />
          <Input label="Billing email" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} placeholder="billing@acme.com" />
          <Input label="GSTIN (optional)" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="font-mono" />
          <Input label="PAN (optional)" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} className="font-mono" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={form.name.length < 2}>Create</Button>
        </div>
      </div>
    </div>
  )
}
