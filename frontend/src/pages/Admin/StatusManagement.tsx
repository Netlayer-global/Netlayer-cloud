import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Activity, Plus, Trash2, AlertTriangle, Wrench, MessageSquare } from 'lucide-react'

import { adminAPI } from '../../api/admin'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { cn, formatDate, relativeTime } from '../../lib/utils'

const SERVICES = ['API', 'Dashboard', 'DNS', 'Provisioning', 'Object Storage', 'Block Storage', 'Network', 'Billing', 'Monitoring']

interface Incident {
  id: string
  title: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  impact: 'minor' | 'major' | 'critical' | 'maintenance'
  affectedServices: string[]
  affectedRegions: string[]
  updates: { message: string; status: string; ts: string }[]
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

const IMPACT_TINT: Record<string, any> = {
  minor: 'building',
  major: 'error',
  critical: 'error',
  maintenance: 'preview',
}

const createSchema = z.object({
  title: z.string().min(3, 'Required').max(140),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
  impact: z.enum(['minor', 'major', 'critical', 'maintenance']),
  affectedServices: z.array(z.string()),
  firstUpdate: z.string().min(1, 'Required'),
})
type CreateForm = z.infer<typeof createSchema>

export default function AdminStatus() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState<Incident | null>(null)

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['admin', 'incidents'],
    queryFn: () => adminAPI.listIncidents() as Promise<Incident[]>,
    refetchInterval: 15_000,
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '', status: 'investigating', impact: 'minor',
      affectedServices: [], firstUpdate: '',
    },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) => adminAPI.createIncident(v),
    onSuccess: () => {
      toast.success('Incident published')
      qc.invalidateQueries({ queryKey: ['admin', 'incidents'] })
      setCreateOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => adminAPI.deleteIncident(id),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['admin', 'incidents'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const active = incidents.filter((i) => i.status !== 'resolved')
  const resolved = incidents.filter((i) => i.status === 'resolved').slice(0, 20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Status incidents</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Publish service status updates. Active incidents appear instantly on the public status page.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New incident
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-[#e8e8e6]">Active</h2>
              <span className="text-xs text-[#6a6a68]">{active.length}</span>
            </div>
            {active.length === 0 ? (
              <Card padding="p-8" className="text-center bg-emerald-950/5 border-emerald-900/30">
                <Activity size={24} className="text-emerald-400 mx-auto mb-2" />
                <h3 className="font-medium text-[#e8e8e6] mb-1">All systems operational</h3>
                <p className="text-xs text-[#a0a09e]">No active incidents.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {active.map((i) => (
                  <IncidentCard
                    key={i.id}
                    incident={i}
                    onUpdate={() => setUpdateOpen(i)}
                    onDelete={() => {
                      if (confirm(`Delete "${i.title}"?`)) del.mutate(i.id)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {resolved.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-medium text-[#e8e8e6]">Resolved (last 20)</h2>
                <span className="text-xs text-[#6a6a68]">{resolved.length}</span>
              </div>
              <div className="space-y-3">
                {resolved.map((i) => (
                  <IncidentCard
                    key={i.id}
                    incident={i}
                    compact
                    onUpdate={() => setUpdateOpen(i)}
                    onDelete={() => {
                      if (confirm(`Delete "${i.title}"?`)) del.mutate(i.id)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="New incident"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>Publish</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <Input label="Title" placeholder="API errors in EU regions" error={form.formState.errors.title?.message} {...form.register('title')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" {...form.register('status')}>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </Select>
            <Select label="Impact" {...form.register('impact')}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
              <option value="maintenance">Scheduled maintenance</option>
            </Select>
          </div>
          <ServicesPicker
            value={form.watch('affectedServices')}
            onChange={(v) => form.setValue('affectedServices', v)}
          />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">First update</label>
            <textarea
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm min-h-[100px] focus:border-[#e0fe56] focus:outline-none transition-colors resize-none"
              placeholder="We are investigating elevated error rates affecting…"
              {...form.register('firstUpdate')}
            />
            {form.formState.errors.firstUpdate && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.firstUpdate.message}</p>
            )}
          </div>
        </form>
      </Modal>

      <UpdateModal
        incident={updateOpen}
        onClose={() => setUpdateOpen(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['admin', 'incidents'] })}
      />
    </div>
  )
}

function IncidentCard({
  incident, compact, onUpdate, onDelete,
}: { incident: Incident; compact?: boolean; onUpdate: () => void; onDelete: () => void }) {
  const Icon =
    incident.impact === 'maintenance' ? Wrench :
    AlertTriangle
  return (
    <Card padding="p-4">
      <div className="flex items-start gap-3">
        <Icon size={16} className={cn(
          'shrink-0 mt-0.5',
          incident.impact === 'maintenance' ? 'text-blue-400' :
          incident.impact === 'critical' ? 'text-red-400' :
          incident.impact === 'major' ? 'text-amber-400' :
          'text-[#a0a09e]'
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-medium text-[#e8e8e6]">{incident.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={IMPACT_TINT[incident.impact]}>{incident.impact}</Badge>
                <Badge variant={incident.status === 'resolved' ? 'running' : 'building'}>
                  {incident.status}
                </Badge>
                <span className="text-[11px] text-[#6a6a68]">{relativeTime(incident.createdAt)}</span>
              </div>
            </div>
            {!compact && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={onUpdate}>
                  <MessageSquare size={12} /> Add update
                </Button>
                <button
                  onClick={onDelete}
                  className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1.5 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {incident.affectedServices.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {incident.affectedServices.map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1f1e] border border-[#2a2b2a] text-[#a0a09e]">
                  {s}
                </span>
              ))}
            </div>
          )}

          {!compact && incident.updates.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#2a2b2a] space-y-2">
              {[...incident.updates].reverse().map((u, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="default" className="!capitalize">{u.status}</Badge>
                    <span className="text-[10px] text-[#6a6a68]">{formatDate(u.ts)}</span>
                  </div>
                  <p className="text-[#a0a09e]">{u.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function ServicesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs text-[#a0a09e] mb-1.5">Affected services</label>
      <div className="flex flex-wrap gap-1.5">
        {SERVICES.map((s) => {
          const on = value.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(on ? value.filter((x) => x !== s) : [...value, s])}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs cursor-pointer border transition-colors',
                on
                  ? 'bg-[#e0fe56]/10 border-[#e0fe56]/40 text-[#e0fe56]'
                  : 'bg-[#1e1f1e] border-[#2a2b2a] text-[#a0a09e] hover:text-[#e8e8e6]'
              )}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UpdateModal({
  incident, onClose, onSuccess,
}: { incident: Incident | null; onClose: () => void; onSuccess: () => void }) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Incident['status']>('investigating')

  // Sync when modal opens
  if (incident && status === 'investigating' && incident.status !== 'investigating') {
    setStatus(incident.status)
  }

  const update = useMutation({
    mutationFn: () =>
      adminAPI.updateIncident(incident!.id, { update: message, status }),
    onSuccess: () => {
      toast.success('Update posted')
      onSuccess()
      onClose()
      setMessage('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={!!incident}
      onClose={() => { onClose(); setMessage('') }}
      title={incident?.title || 'Add update'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); setMessage('') }}>Cancel</Button>
          <Button loading={update.isPending} disabled={!message.trim()} onClick={() => update.mutate()}>
            Post update
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="investigating">Investigating</option>
          <option value="identified">Identified</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </Select>
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Update message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm min-h-[120px] focus:border-[#e0fe56] focus:outline-none resize-none"
            placeholder="We have identified the root cause and are deploying a fix…"
          />
        </div>
      </div>
    </Modal>
  )
}
