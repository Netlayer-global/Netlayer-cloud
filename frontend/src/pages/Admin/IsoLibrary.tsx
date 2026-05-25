import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Disc3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { isoAdminAPI, adminAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const formatBytes = (bytes: number) => {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export default function IsoLibrary() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: isos = [], isLoading } = useQuery({
    queryKey: ['admin', 'iso'],
    queryFn: () => isoAdminAPI.list().then((r: any) => r.data.data),
    refetchInterval: 5000, // poll while ISOs are downloading
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'iso'] })

  const remove = useMutation({
    mutationFn: (id: string) => isoAdminAPI.delete(id),
    onSuccess: () => {
      toast.success('ISO deleted')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">ISO library</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Boot images for rescue mode and custom installs.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Add ISO
        </Button>
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : isos.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-[#a0a09e] py-8">
            <Disc3 size={24} className="mx-auto mb-3 text-[#6a6a68]" />
            No ISOs yet. Add one to enable rescue mode for your customers.
          </div>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Name', 'Filename', 'Node', 'Size', 'Visibility', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isos.map((iso: any) => (
                <tr key={iso.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-[#e8e8e6] font-medium">{iso.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{iso.filename}</td>
                  <td className="px-4 py-3 text-[#a0a09e]">{iso.node?.name || <span className="text-[#6a6a68]">All nodes</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{formatBytes(iso.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase',
                      iso.isPublic
                        ? 'text-[#4ade80] bg-green-950/40 border-green-900/60'
                        : 'text-[#a0a09e] bg-[#252625] border-[#2a2b2a]'
                    )}>
                      {iso.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={iso.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(iso.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove.mutate(iso.id)}
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
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">{children}</div>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available:   'text-[#4ade80] bg-green-950/40 border-green-900/60',
    downloading: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
    error:       'text-red-400 bg-red-950/40 border-red-900/60',
  }
  return (
    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase tracking-wide', map[status] || map.downloading)}>
      {status}
    </span>
  )
}

function CreateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [tab, setTab] = useState<'url' | 'upload'>('url')
  const [name, setName] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [nodeId, setNodeId] = useState<string>('')
  const [isPublic, setIsPublic] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState(0)

  const { data: nodes = [] } = useQuery({
    queryKey: ['admin', 'nodes'],
    queryFn: () => adminAPI.getNodes().then((r) => r.data.data),
    enabled: open,
  })

  const reset = () => {
    setName('')
    setDownloadUrl('')
    setFile(null)
    setUploadPct(0)
  }

  const create = useMutation({
    mutationFn: () =>
      isoAdminAPI.create({
        name,
        downloadUrl,
        nodeId: nodeId || null,
        isPublic,
      }),
    onSuccess: () => {
      toast.success('ISO download started')
      onSuccess()
      onClose()
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Add failed'),
  })

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file as File)
      fd.append('name', name || (file as File).name.replace(/\.(iso|img|qcow2)$/i, ''))
      fd.append('nodeId', nodeId || 'all')
      fd.append('isPublic', String(isPublic))
      return isoAdminAPI.upload(fd, setUploadPct)
    },
    onSuccess: () => {
      toast.success('ISO uploaded successfully')
      onSuccess()
      onClose()
      reset()
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || e.message || 'Upload failed'
      toast.error(msg)
      setUploadPct(0)
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Add ISO</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#161716] rounded-md p-0.5 mb-4">
          {(['url', 'upload'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 h-8 text-xs rounded cursor-pointer transition-colors ${
                tab === t
                  ? 'bg-[#252625] text-[#e8e8e6]'
                  : 'text-[#a0a09e] hover:text-[#e8e8e6]'
              }`}
            >
              {t === 'url' ? 'From URL' : 'Upload from PC'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === 'upload' ? '(auto from filename)' : 'systemrescue-11'}
          />

          {tab === 'url' ? (
            <Input
              label="Download URL"
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://..."
              className="font-mono text-xs"
            />
          ) : (
            <div>
              <label className="block text-xs text-[#a0a09e] mb-1.5">ISO file</label>
              <div className="border border-dashed border-[#333433] rounded-md p-4 text-center hover:border-[#e0fe56]/40 transition-colors">
                <input
                  type="file"
                  accept=".iso,.img,.qcow2"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setFile(f)
                    if (f && !name) setName(f.name.replace(/\.(iso|img|qcow2)$/i, ''))
                  }}
                  className="hidden"
                  id="iso-file-input"
                />
                <label htmlFor="iso-file-input" className="cursor-pointer block">
                  {file ? (
                    <>
                      <div className="text-sm text-[#e8e8e6] font-medium truncate">{file.name}</div>
                      <div className="text-xs text-[#a0a09e] mt-1">
                        {(file.size / (1024 ** 3)).toFixed(2)} GB · click to change
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-[#a0a09e]">Click to select an ISO</div>
                      <div className="text-[11px] text-[#6a6a68] mt-1">
                        .iso / .img / .qcow2 · max 8 GB
                      </div>
                    </>
                  )}
                </label>
              </div>

              {upload.isPending && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-[#a0a09e] mb-1">
                    <span>Uploading…</span>
                    <span className="tabular-nums">{uploadPct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#252625] overflow-hidden">
                    <div
                      className="h-full bg-[#e0fe56] transition-[width]"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Select label="Target node" value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
            <option value="">All nodes (replicate)</option>
            {nodes.map((n: any) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-[#a0a09e] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[#e0fe56] cursor-pointer"
            />
            Make available to all customers (rescue mode)
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={upload.isPending}>Cancel</Button>
          {tab === 'url' ? (
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!name || !downloadUrl}>
              Add ISO
            </Button>
          ) : (
            <Button onClick={() => upload.mutate()} loading={upload.isPending} disabled={!file || !name}>
              Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
