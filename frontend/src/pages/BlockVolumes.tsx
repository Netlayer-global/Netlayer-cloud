import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HardDrive, Plus, Trash2, Link as LinkIcon, Unlink, Server as ServerIcon } from 'lucide-react'

import { volumesAPI, type BlockVolume } from '../api/infra'
import { catalogAPI, serverAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { Select } from '../components/ui/Select'
import { cn, formatDate, relativeTime } from '../lib/utils'

const createSchema = z.object({
  name: z.string()
    .min(1, 'Required')
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, numbers, hyphens'),
  sizeGB: z.number().int().min(10).max(16384),
  region: z.string().min(1, 'Pick a region'),
})
type CreateForm = z.infer<typeof createSchema>

const statusBadge = (status: string) => {
  switch (status) {
    case 'available': return <Badge variant="default">Available</Badge>
    case 'attached': return <Badge variant="running">Attached</Badge>
    case 'detaching': return <Badge variant="building">Detaching</Badge>
    case 'deleting': return <Badge variant="error">Deleting</Badge>
    default: return <Badge variant="default">{status}</Badge>
  }
}

export default function BlockVolumes() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [attachVolume, setAttachVolume] = useState<BlockVolume | null>(null)
  const [resizeVolume, setResizeVolume] = useState<BlockVolume | null>(null)

  const { data: volumes = [], isLoading } = useQuery({
    queryKey: ['volumes'],
    queryFn: () => volumesAPI.list().then((r) => r.data.data),
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', sizeGB: 100, region: '' },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) => volumesAPI.create(v),
    onSuccess: () => {
      toast.success('Volume created')
      qc.invalidateQueries({ queryKey: ['volumes'] })
      setCreateOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const detach = useMutation({
    mutationFn: (id: string) => volumesAPI.detach(id),
    onSuccess: () => {
      toast.success('Volume detached')
      qc.invalidateQueries({ queryKey: ['volumes'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => volumesAPI.delete(id),
    onSuccess: () => {
      toast.success('Volume deleted')
      qc.invalidateQueries({ queryKey: ['volumes'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Block volumes</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            High-performance NVMe volumes you can attach to any server in the same region.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create volume
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : volumes.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <HardDrive size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No volumes yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Create a block volume to add persistent NVMe storage to any server.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create volume
          </Button>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH className="hidden sm:table-cell">Size</TH>
              <TH className="hidden md:table-cell">Region</TH>
              <TH>Status</TH>
              <TH className="hidden lg:table-cell">Attached to</TH>
              <TH className="hidden md:table-cell">Created</TH>
              <TH className="w-32 text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {volumes.map((v) => (
              <TR key={v.id}>
                <TD className="text-[#e8e8e6] font-medium">
                  <div className="flex items-center gap-2">
                    <HardDrive size={14} className="text-[#a0a09e] shrink-0" />
                    {v.name}
                  </div>
                </TD>
                <TD className="hidden sm:table-cell">{v.sizeGB} GB</TD>
                <TD className="hidden md:table-cell uppercase text-xs">{v.region}</TD>
                <TD>{statusBadge(v.status)}</TD>
                <TD className="hidden lg:table-cell">
                  {v.server ? (
                    <span className="flex items-center gap-1.5 text-[#e8e8e6]">
                      <ServerIcon size={12} className="text-[#a0a09e]" />
                      {v.server.name}
                    </span>
                  ) : (
                    <span className="text-[#6a6a68]">—</span>
                  )}
                </TD>
                <TD className="hidden md:table-cell text-xs">{relativeTime(v.createdAt)}</TD>
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {v.serverId ? (
                      <button
                        onClick={() => {
                          if (confirm(`Detach "${v.name}" from ${v.server?.name}?`)) {
                            detach.mutate(v.id)
                          }
                        }}
                        className="text-[#6a6a68] hover:text-amber-400 cursor-pointer p-1 rounded transition-colors"
                        title="Detach"
                      >
                        <Unlink size={13} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setAttachVolume(v)}
                          className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                          title="Attach"
                        >
                          <LinkIcon size={13} />
                        </button>
                        <button
                          onClick={() => setResizeVolume(v)}
                          className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                          title="Resize"
                        >
                          <span className="text-[10px]">↔</span>
                        </button>
                      </>
                    )}
                    <button
                      disabled={!!v.serverId}
                      onClick={() => {
                        if (confirm(`Delete "${v.name}"? This cannot be undone.`)) del.mutate(v.id)
                      }}
                      className={cn(
                        'p-1 rounded transition-colors',
                        v.serverId
                          ? 'text-[#3a3b3a] cursor-not-allowed'
                          : 'text-[#6a6a68] hover:text-red-400 cursor-pointer'
                      )}
                      title={v.serverId ? 'Detach first to delete' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="Create block volume"
        description="Volumes can only be attached to servers in the same region."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>
              Create volume
            </Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <Input
            label="Name"
            placeholder="data-disk-01"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Size (GB)</label>
            <input
              type="number"
              min={10}
              max={16384}
              step={10}
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md h-9 px-3 text-sm focus:border-[#e0fe56] focus:outline-none transition-colors"
              {...form.register('sizeGB', { valueAsNumber: true })}
            />
            {form.formState.errors.sizeGB && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.sizeGB.message}</p>
            )}
            <p className="text-[11px] text-[#6a6a68] mt-1">Min 10 GB, max 16 TB. ₹4 / GB / month.</p>
          </div>
          <Select
            label="Region"
            error={form.formState.errors.region?.message}
            {...form.register('region')}
          >
            <option value="">Select a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.flag} {r.city}, {r.country}
              </option>
            ))}
          </Select>
        </form>
      </Modal>

      {/* Attach modal */}
      <AttachModal
        volume={attachVolume}
        onClose={() => setAttachVolume(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['volumes'] })}
      />

      {/* Resize modal */}
      <ResizeModal
        volume={resizeVolume}
        onClose={() => setResizeVolume(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['volumes'] })}
      />
    </div>
  )
}

function AttachModal({
  volume, onClose, onSuccess,
}: { volume: BlockVolume | null; onClose: () => void; onSuccess: () => void }) {
  const [serverId, setServerId] = useState('')

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
    enabled: !!volume,
  })

  const attach = useMutation({
    mutationFn: () => volumesAPI.attach(volume!.id, serverId),
    onSuccess: () => {
      toast.success('Volume attached')
      onSuccess()
      onClose()
      setServerId('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  // Filter servers to the same region as the volume.
  const eligible = servers.filter((s: any) => s.region?.slug === volume?.region && s.status !== 'DELETED')

  return (
    <Modal
      open={!!volume}
      onClose={() => { onClose(); setServerId('') }}
      title={volume ? `Attach "${volume.name}"` : 'Attach volume'}
      description={volume ? `Pick a running server in ${volume.region.toUpperCase()}.` : ''}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); setServerId('') }}>Cancel</Button>
          <Button loading={attach.isPending} disabled={!serverId} onClick={() => attach.mutate()}>
            Attach
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <div className="text-sm text-[#a0a09e] py-4 text-center">
          No servers in this region. Deploy a server in <span className="uppercase font-mono">{volume?.region}</span> first.
        </div>
      ) : (
        <div className="space-y-2">
          {eligible.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setServerId(s.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-md border text-left cursor-pointer transition-colors',
                serverId === s.id
                  ? 'bg-[#e0fe56]/5 border-[#e0fe56]/40'
                  : 'bg-[#1e1f1e] border-[#2a2b2a] hover:bg-[#252625]'
              )}
            >
              <ServerIcon size={14} className="text-[#a0a09e]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#e8e8e6] font-medium">{s.name}</div>
                <div className="text-[11px] text-[#6a6a68]">{s.ipv4 || s.hostname}</div>
              </div>
              <Badge variant={s.status === 'RUNNING' ? 'running' : 'stopped'}>{s.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

function ResizeModal({
  volume, onClose, onSuccess,
}: { volume: BlockVolume | null; onClose: () => void; onSuccess: () => void }) {
  const [size, setSize] = useState(volume?.sizeGB ?? 0)

  const resize = useMutation({
    mutationFn: () => volumesAPI.update(volume!.id, { sizeGB: size }),
    onSuccess: () => {
      toast.success('Volume resized')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={!!volume}
      onClose={onClose}
      title={volume ? `Resize "${volume.name}"` : 'Resize'}
      description="You can only grow a volume, never shrink. Resize takes effect immediately."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            loading={resize.isPending}
            disabled={!volume || size <= (volume?.sizeGB ?? 0)}
            onClick={() => resize.mutate()}
          >
            Resize to {size} GB
          </Button>
        </>
      }
    >
      {volume && (
        <div className="space-y-3">
          <div className="text-xs text-[#6a6a68]">Current size: <span className="text-[#e8e8e6]">{volume.sizeGB} GB</span></div>
          <Input
            label="New size (GB)"
            type="number"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value) || 0)}
            min={volume.sizeGB + 1}
            max={16384}
          />
        </div>
      )}
    </Modal>
  )
}
