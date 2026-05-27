import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Megaphone, Trash2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { inAppMessagesAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const TYPE_COLOR: Record<string, string> = {
  info:    'text-[#3d8bff] bg-blue-950/40 border-blue-900/60',
  warning: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
  error:   'text-red-400 bg-red-950/40 border-red-900/60',
  success: 'text-[#4ade80] bg-green-950/40 border-green-900/60',
}

export default function InAppMessages() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['admin', 'in-app-messages'],
    queryFn: () => inAppMessagesAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'in-app-messages'] })

  const remove = useMutation({
    mutationFn: (id: string) => inAppMessagesAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      inAppMessagesAPI.update(id, { isActive }),
    onSuccess: () => refresh(),
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">In-app messages</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Banner shown on customer dashboard top-bar within the configured time window. Useful for maintenance windows or product launches.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus size={14} className="mr-1.5" /> New message
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : list.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Megaphone size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((m: any) => (
            <div key={m.id} className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className={cn('shrink-0 inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase', TYPE_COLOR[m.type])}>
                  {m.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#e8e8e6]">{m.title}</div>
                  <div className="text-xs text-[#a0a09e] mt-1">{m.body}</div>
                  <div className="text-[11px] text-[#6a6a68] mt-2">
                    {new Date(m.startsAt).toLocaleDateString()}
                    {m.endsAt ? ` → ${new Date(m.endsAt).toLocaleDateString()}` : ' → no end'}
                    {m.cta && ` · CTA: ${m.cta}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.isActive}
                      onChange={(e) => toggle.mutate({ id: m.id, isActive: e.target.checked })}
                      className="accent-[#e0fe56] cursor-pointer"
                    />
                    <span className={cn('text-[10.5px] uppercase font-medium', m.isActive ? 'text-[#4ade80]' : 'text-[#6a6a68]')}>
                      {m.isActive ? 'Live' : 'Off'}
                    </span>
                  </label>
                  <button
                    onClick={() => { setEditing(m); setOpen(true) }}
                    className="p-1.5 rounded text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625] cursor-pointer"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete?')) remove.mutate(m.id) }}
                    className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Editor open={open} editing={editing} onClose={() => setOpen(false)} onSuccess={refresh} />
    </div>
  )
}

function Editor({ open, editing, onClose, onSuccess }: { open: boolean; editing: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<any>(() => editing ? {
    ...editing,
    startsAt: editing.startsAt?.slice(0, 16),
    endsAt: editing.endsAt?.slice(0, 16),
    targetRoles: editing.targetRoles?.length ? editing.targetRoles : [],
  } : {
    title: '', body: '', type: 'info', cta: '', ctaUrl: '',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: '',
    isActive: true,
    targetRoles: [],
  })

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {
        title: form.title, body: form.body, type: form.type,
        cta: form.cta || undefined, ctaUrl: form.ctaUrl || undefined,
        isActive: form.isActive,
        targetRoles: form.targetRoles,
      }
      if (form.startsAt) payload.startsAt = new Date(form.startsAt).toISOString()
      if (form.endsAt) payload.endsAt = new Date(form.endsAt).toISOString()
      else if (editing) payload.endsAt = null
      return editing
        ? inAppMessagesAPI.update(editing.id, payload)
        : inAppMessagesAPI.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Created')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Save failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">{editing ? 'Edit message' : 'New message'}</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Maintenance window: Sat 2am" />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-[#252625] border border-[#333433] text-[#e8e8e6] rounded-md p-2 text-sm focus:border-[#e0fe56] focus:outline-none"
              rows={3}
            />
          </div>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </Select>
          <Input label="CTA label (optional)" value={form.cta || ''} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Read more" />
          <Input label="CTA URL (optional)" value={form.ctaUrl || ''} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-3">
            <Input type="datetime-local" label="Starts at" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            <Input type="datetime-local" label="Ends at (optional)" value={form.endsAt || ''} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-[#e0fe56] cursor-pointer" />
            Active
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!form.title || !form.body}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
