import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { snapshotAPI, serverAPI } from '../api/endpoints'
import type { Server } from '../types'
import { cn } from '../lib/utils'

const formatBytes = (bytes: number) => {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export default function Snapshots() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ serverId: string; snapshotId: string; name: string } | null>(null)

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => snapshotAPI.listAll().then((r) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['snapshots'] })

  const remove = useMutation({
    mutationFn: () =>
      snapshotAPI.delete(confirmDelete!.serverId, confirmDelete!.snapshotId),
    onSuccess: () => {
      toast.success('Snapshot deleted')
      refresh()
      setConfirmDelete(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Snapshots</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Point-in-time copies of your servers. Restore in seconds when something goes wrong.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Create snapshot
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">
          Loading…
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Snapshot', 'Server', 'Region', 'Size', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-[#e8e8e6] font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/servers/${s.server.id}`} className="text-[#e0fe56] hover:underline">
                      {s.server.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#a0a09e]">
                    {s.server.region.flag} {s.server.region.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{formatBytes(s.size)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDelete({ serverId: s.serverId, snapshotId: s.id, name: s.name })}
                      className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={refresh} />

      {confirmDelete && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
            <h3 className="text-base font-medium text-[#e8e8e6] mb-3">Delete snapshot</h3>
            <p className="text-sm text-[#a0a09e]">
              This will permanently delete <strong className="text-[#e8e8e6]">{confirmDelete.name}</strong>. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready:    'text-[#4ade80] bg-green-950/40 border-green-900/60',
    creating: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
    error:    'text-red-400 bg-red-950/40 border-red-900/60',
  }
  return (
    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase tracking-wide', map[status] || map.creating)}>
      {status}
    </span>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#252625] mx-auto mb-4 flex items-center justify-center">
        <Camera size={20} className="text-[#6a6a68]" />
      </div>
      <h3 className="text-base font-medium text-[#e8e8e6]">No snapshots yet</h3>
      <p className="text-sm text-[#a0a09e] mt-1 mb-5 max-w-sm mx-auto">
        Snapshots capture the full disk state of a server. Restore in seconds when something breaks.
      </p>
      <Button onClick={onCreate} className="cursor-pointer">
        <Plus size={14} className="mr-1.5" /> Create your first snapshot
      </Button>
    </div>
  )
}

function CreateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [serverId, setServerId] = useState('')
  const [name, setName] = useState('')

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data as Server[]),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: () => snapshotAPI.createForServer(serverId, name),
    onSuccess: () => {
      toast.success('Snapshot creation started')
      onSuccess()
      onClose()
      setServerId('')
      setName('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Snapshot failed'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Create snapshot</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <Select label="Server" value={serverId} onChange={(e) => setServerId(e.target.value)}>
            <option value="">Choose a server…</option>
            {servers
              .filter((s) => s.status !== 'DELETED')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </Select>
          <Input label="Snapshot name" value={name} onChange={(e) => setName(e.target.value)} placeholder="before-deploy-v2" />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!serverId || !name}>
            Create snapshot
          </Button>
        </div>
      </div>
    </div>
  )
}
