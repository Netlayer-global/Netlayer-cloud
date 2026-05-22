import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatDate } from '../../lib/utils'

const TYPE_VARIANT: Record<string, any> = {
  info: 'preview', warning: 'building', maintenance: 'pending',
}

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminAPI.listAnnouncements(),
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminAPI.updateAnnouncement(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  })
  const del = useMutation({
    mutationFn: (id: string) => adminAPI.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement deleted')
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
    },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Announcements</h1>
          <p className="text-sm text-[#a0a09e] mt-1">Banners shown to users in the dashboard.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} /> New announcement</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : items.length === 0 ? (
        <EmptyTable message="No announcements yet." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Title</TH>
              <TH>Type</TH>
              <TH>Target</TH>
              <TH>Active</TH>
              <TH>Expires</TH>
              <TH>Created</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((a: any) => (
              <TR key={a.id}>
                <TD className="text-[#e8e8e6]">{a.title}</TD>
                <TD><Badge variant={TYPE_VARIANT[a.type] || 'default'}>{a.type}</Badge></TD>
                <TD className="text-xs">{a.targetAll ? 'All users' : (a.targetRoles || []).join(', ')}</TD>
                <TD>
                  <button
                    onClick={() => toggle.mutate({ id: a.id, isActive: !a.isActive })}
                    className={cn('relative w-8 h-4 rounded-full transition-colors cursor-pointer', a.isActive ? 'bg-[#e0fe56]' : 'bg-[#333433]')}
                  >
                    <span className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform', a.isActive ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </TD>
                <TD className="text-xs">{a.expiresAt ? formatDate(a.expiresAt) : '—'}</TD>
                <TD className="text-xs">{formatDate(a.createdAt)}</TD>
                <TD className="text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setEditing(a)} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${a.title}"?`)) del.mutate(a.id) }} className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <AnnouncementEditor
        open={creating || !!editing}
        editing={editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSaved={() => qc.invalidateQueries({ queryKey: ['admin-announcements'] })}
      />
    </div>
  )
}

function AnnouncementEditor({
  open, editing, onClose, onSaved,
}: {
  open: boolean; editing: any | null; onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState(editing?.title || '')
  const [message, setMessage] = useState(editing?.message || '')
  const [type, setType] = useState<'info' | 'warning' | 'maintenance'>(editing?.type || 'info')
  const [targetAll, setTargetAll] = useState(editing?.targetAll ?? true)
  const [expiresAt, setExpiresAt] = useState<string>(
    editing?.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 16) : ''
  )

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {
        title,
        message,
        type,
        targetAll,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }
      return editing
        ? adminAPI.updateAnnouncement(editing.id, payload)
        : adminAPI.createAnnouncement(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Announcement updated' : 'Announcement created')
      onSaved()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit announcement' : 'New announcement'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!title || !message} loading={save.isPending} onClick={() => save.mutate()}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Message</label>
          <textarea
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm h-24 focus:border-[#e0fe56] focus:outline-none resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <Input label="Expires at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
          <input type="checkbox" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} className="cursor-pointer accent-[#e0fe56]" />
          Show to all users
        </label>

        {/* Preview */}
        <div className="mt-3 pt-3 border-t border-[#2a2b2a]">
          <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-2">Preview</div>
          <div className={cn(
            'border-l-2 rounded-md p-3 text-sm',
            type === 'warning' && 'border-amber-400 bg-amber-950/20 text-amber-300',
            type === 'maintenance' && 'border-orange-400 bg-orange-950/20 text-orange-300',
            type === 'info' && 'border-[#e0fe56] bg-[#e0fe56]/10 text-[#e0fe56]'
          )}>
            <div className="font-medium">{title || 'Untitled'}</div>
            <div className="text-[#a0a09e] text-xs mt-1">{message || 'Your message here.'}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
