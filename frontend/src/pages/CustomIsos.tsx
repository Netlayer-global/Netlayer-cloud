import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Disc3, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { customerIsoAPI } from '../api/endpoints'
import { cn } from '../lib/utils'

const formatBytes = (bytes: number) => {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export default function CustomIsos() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: isos = [], isLoading } = useQuery({
    queryKey: ['customer', 'iso'],
    queryFn: () => customerIsoAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['customer', 'iso'] })

  const remove = useMutation({
    mutationFn: (id: string) => customerIsoAPI.delete(id),
    onSuccess: () => { toast.success('ISO deleted'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Custom ISOs</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Upload your own boot images for custom Linux distros, niche OSes, or recovery installs. Up to 5 ISOs, 4 GB each.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="cursor-pointer" disabled={isos.length >= 5}>
          <Plus size={14} className="mr-1.5" /> Upload ISO
        </Button>
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : isos.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-[#a0a09e] py-8">
            <Disc3 size={24} className="mx-auto mb-3 text-[#6a6a68]" />
            No custom ISOs yet. Upload one to install niche distros at deploy time.
          </div>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Name', 'Filename', 'Size', 'Status', 'Uploaded', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isos.map((iso: any) => (
                <tr key={iso.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-[#e8e8e6] font-medium">{iso.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{iso.filename}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{formatBytes(iso.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase',
                      iso.status === 'available'
                        ? 'text-[#4ade80] bg-green-950/40 border-green-900/60'
                        : 'text-amber-400 bg-amber-950/40 border-amber-900/60'
                    )}>
                      {iso.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(iso.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (confirm(`Delete ${iso.name}?`)) remove.mutate(iso.id) }}
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

      <UploadModal open={open} onClose={() => setOpen(false)} onSuccess={refresh} />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">{children}</div>
}

function UploadModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState(0)

  const reset = () => { setName(''); setFile(null); setUploadPct(0) }

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file as File)
      fd.append('name', name || (file as File).name.replace(/\.(iso|img|qcow2)$/i, ''))
      return customerIsoAPI.upload(fd, setUploadPct)
    },
    onSuccess: () => {
      toast.success('ISO uploaded successfully')
      onSuccess()
      onClose()
      reset()
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || e.message || 'Upload failed')
      setUploadPct(0)
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Upload custom ISO</h3>
          <button onClick={onClose} disabled={upload.isPending} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="(auto from filename)"
          />

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
                id="customer-iso-file-input"
              />
              <label htmlFor="customer-iso-file-input" className="cursor-pointer block">
                {file ? (
                  <>
                    <Upload size={20} className="mx-auto mb-1.5 text-[#e0fe56]" />
                    <div className="text-sm text-[#e8e8e6] font-medium truncate">{file.name}</div>
                    <div className="text-xs text-[#a0a09e] mt-1">
                      {(file.size / (1024 ** 3)).toFixed(2)} GB · click to change
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-1.5 text-[#6a6a68]" />
                    <div className="text-sm text-[#a0a09e]">Click to select an ISO</div>
                    <div className="text-[11px] text-[#6a6a68] mt-1">
                      .iso / .img / .qcow2 · max 4 GB · 5 per account
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
                  <div className="h-full bg-[#e0fe56] transition-[width]" style={{ width: `${uploadPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={upload.isPending}>Cancel</Button>
          <Button onClick={() => upload.mutate()} loading={upload.isPending} disabled={!file}>
            Upload
          </Button>
        </div>
      </div>
    </div>
  )
}
