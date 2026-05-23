import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Network, Plus, Trash2, Server as ServerIcon, ArrowLeft, Settings as SettingsIcon,
  Activity, Heart, Copy, Check,
} from 'lucide-react'

import { loadBalancersAPI, type LoadBalancer, type LoadBalancerTarget } from '../api/infra'
import { catalogAPI, serverAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { Select } from '../components/ui/Select'
import { cn, relativeTime, copyToClipboard } from '../lib/utils'

const createSchema = z.object({
  name: z.string().min(1, 'Required').max(64),
  region: z.string().min(1, 'Pick a region'),
  algorithm: z.enum(['round_robin', 'least_connections', 'ip_hash']),
  protocol: z.enum(['HTTP', 'HTTPS', 'TCP']),
  port: z.number().int().min(1).max(65535),
})
type CreateForm = z.infer<typeof createSchema>

export default function LoadBalancers() {
  const [openLB, setOpenLB] = useState<LoadBalancer | null>(null)

  if (openLB) {
    return <LoadBalancerDetail lbId={openLB.id} onBack={() => setOpenLB(null)} />
  }

  return <LoadBalancersList onOpen={setOpenLB} />
}

function LoadBalancersList({ onOpen }: { onOpen: (lb: LoadBalancer) => void }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: lbs = [], isLoading } = useQuery({
    queryKey: ['load-balancers'],
    queryFn: () => loadBalancersAPI.list().then((r) => r.data.data),
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '', region: '', algorithm: 'round_robin', protocol: 'HTTP', port: 80,
    },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) => loadBalancersAPI.create(v),
    onSuccess: () => {
      toast.success('Load balancer created')
      qc.invalidateQueries({ queryKey: ['load-balancers'] })
      setCreateOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => loadBalancersAPI.delete(id),
    onSuccess: () => {
      toast.success('Load balancer deleted')
      qc.invalidateQueries({ queryKey: ['load-balancers'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Load balancers</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Distribute traffic across multiple servers with automatic health checks.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create load balancer
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : lbs.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Network size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No load balancers</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Create one to spread traffic across your servers and add high availability.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create load balancer
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lbs.map((lb) => {
            const healthy = lb.targets.filter((t) => t.isHealthy).length
            const total = lb.targets.length
            return (
              <Card key={lb.id} hover onClick={() => onOpen(lb)} className="cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Network size={16} className="text-[#e0fe56] shrink-0" />
                    <span className="text-sm font-medium text-[#e8e8e6] truncate">{lb.name}</span>
                  </div>
                  <Badge variant={lb.status === 'active' ? 'running' : 'stopped'}>
                    {lb.status}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#6a6a68]">Endpoint</span>
                    <span className="text-[#e8e8e6] font-mono">
                      {lb.protocol.toLowerCase()}://{lb.ipv4}:{lb.port}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a68]">Region</span>
                    <span className="text-[#e8e8e6] uppercase">{lb.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a68]">Algorithm</span>
                    <span className="text-[#e8e8e6]">{lb.algorithm.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a68]">Targets</span>
                    <span className="text-[#e8e8e6]">
                      {total === 0 ? (
                        <span className="text-amber-400">No targets</span>
                      ) : (
                        <>
                          <span className="text-emerald-400">{healthy}</span>
                          <span className="text-[#6a6a68]"> / {total} healthy</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a68]">Created</span>
                    <span className="text-[#e8e8e6]">{relativeTime(lb.createdAt)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-1 pt-3 border-t border-[#2a2b2a] mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete load balancer "${lb.name}"?`)) del.mutate(lb.id)
                    }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="Create load balancer"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <Input
            label="Name"
            placeholder="prod-web-lb"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Select label="Region" error={form.formState.errors.region?.message} {...form.register('region')}>
            <option value="">Select a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.flag} {r.city}, {r.country}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Algorithm" {...form.register('algorithm')}>
              <option value="round_robin">Round robin</option>
              <option value="least_connections">Least connections</option>
              <option value="ip_hash">IP hash</option>
            </Select>
            <Select label="Protocol" {...form.register('protocol')}>
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="TCP">TCP</option>
            </Select>
          </div>
          <Input
            label="Port"
            type="number"
            min={1}
            max={65535}
            error={form.formState.errors.port?.message}
            {...form.register('port', { valueAsNumber: true })}
          />
          <p className="text-[11px] text-[#6a6a68]">
            A public IPv4 will be allocated automatically. You can add target servers after creation.
          </p>
        </form>
      </Modal>
    </div>
  )
}

function LoadBalancerDetail({ lbId, onBack }: { lbId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [addTargetOpen, setAddTargetOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: lb, isLoading } = useQuery({
    queryKey: ['load-balancer', lbId],
    queryFn: () => loadBalancersAPI.get(lbId).then((r) => r.data.data),
    refetchInterval: 10_000,
  })

  const removeTarget = useMutation({
    mutationFn: (targetId: string) => loadBalancersAPI.removeTarget(lbId, targetId),
    onSuccess: () => {
      toast.success('Target removed')
      qc.invalidateQueries({ queryKey: ['load-balancer', lbId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading || !lb) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  const endpoint = `${lb.protocol.toLowerCase()}://${lb.ipv4}:${lb.port}`

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{lb.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={lb.status === 'active' ? 'running' : 'stopped'}>{lb.status}</Badge>
            <code className="text-xs text-[#a0a09e] bg-[#0d0e0d] px-2 py-0.5 rounded border border-[#2a2b2a]">
              {endpoint}
            </code>
            <button
              onClick={async () => {
                if (await copyToClipboard(endpoint)) {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }
              }}
              className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
              title="Copy"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon size={13} /> Settings
        </Button>
        <Button size="sm" onClick={() => setAddTargetOpen(true)}>
          <Plus size={13} /> Add target
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Algorithm" value={lb.algorithm.replace('_', ' ')} />
        <StatTile label="Region" value={lb.region.toUpperCase()} />
        <StatTile
          label="Targets"
          value={`${lb.targets.length}`}
          sub={`${lb.targets.filter((t) => t.isHealthy).length} healthy`}
        />
        <StatTile
          label="Health check"
          value={lb.healthCheck.protocol || lb.protocol}
          sub={lb.healthCheck.path ? `path: ${lb.healthCheck.path}` : `every ${lb.healthCheck.interval || 30}s`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#e8e8e6]">Backend targets</h2>
        </div>
        {lb.targets.length === 0 ? (
          <EmptyTable message="No targets attached. Add a server to start routing traffic." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Server</TH>
                <TH className="hidden sm:table-cell">IP</TH>
                <TH>Port</TH>
                <TH>Weight</TH>
                <TH>Health</TH>
                <TH className="w-12"></TH>
              </tr>
            </THead>
            <TBody>
              {lb.targets.map((t) => (
                <TR key={t.id}>
                  <TD className="text-[#e8e8e6] font-medium">
                    <div className="flex items-center gap-2">
                      <ServerIcon size={13} className="text-[#a0a09e]" />
                      {t.server?.name || t.serverId.slice(0, 8)}
                    </div>
                  </TD>
                  <TD className="hidden sm:table-cell text-xs font-mono">
                    {t.server?.ipv4 || '—'}
                  </TD>
                  <TD>{t.port}</TD>
                  <TD>{t.weight}</TD>
                  <TD>
                    {t.isHealthy ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <Heart size={11} className="fill-emerald-400" /> Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                        <Activity size={11} /> Unhealthy
                      </span>
                    )}
                  </TD>
                  <TD className="text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${t.server?.name || 'server'} from load balancer?`)) {
                          removeTarget.mutate(t.id)
                        }
                      }}
                      className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <AddTargetModal
        lb={lb}
        open={addTargetOpen}
        onClose={() => setAddTargetOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['load-balancer', lbId] })}
      />

      <SettingsModal
        lb={lb}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['load-balancer', lbId] })}
      />
    </div>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card padding="p-3">
      <div className="text-[11px] text-[#6a6a68]">{label}</div>
      <div className="text-sm text-[#e8e8e6] font-medium mt-0.5 capitalize">{value}</div>
      {sub && <div className="text-[11px] text-[#6a6a68] mt-0.5">{sub}</div>}
    </Card>
  )
}

function AddTargetModal({
  lb, open, onClose, onSuccess,
}: { lb: LoadBalancer; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [serverId, setServerId] = useState('')
  const [port, setPort] = useState(lb.port)
  const [weight, setWeight] = useState(1)

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
    enabled: open,
  })

  const add = useMutation({
    mutationFn: () => loadBalancersAPI.addTarget(lb.id, serverId, port, weight),
    onSuccess: () => {
      toast.success('Target added')
      onSuccess()
      onClose()
      setServerId(''); setPort(lb.port); setWeight(1)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const existingIds = new Set(lb.targets.map((t) => t.serverId))
  const eligible = servers.filter(
    (s: any) =>
      s.region?.slug === lb.region &&
      s.status !== 'DELETED' &&
      !existingIds.has(s.id)
  )

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setServerId('') }}
      title="Add target"
      description={`Pick a server in ${lb.region.toUpperCase()} to receive traffic.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); setServerId('') }}>Cancel</Button>
          <Button loading={add.isPending} disabled={!serverId} onClick={() => add.mutate()}>
            Add target
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {eligible.length === 0 ? (
          <div className="text-sm text-[#a0a09e] py-4 text-center">
            No eligible servers. They must be in <span className="uppercase font-mono">{lb.region}</span> and not already attached.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#2a2b2a]">
          <Input
            label="Backend port"
            type="number"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 80)}
            min={1}
            max={65535}
          />
          <Input
            label="Weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
            min={1}
            max={100}
          />
        </div>
      </div>
    </Modal>
  )
}

function SettingsModal({
  lb, open, onClose, onSuccess,
}: { lb: LoadBalancer; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(lb.name)
  const [algorithm, setAlgorithm] = useState(lb.algorithm)
  const [hcPath, setHcPath] = useState(lb.healthCheck.path || '/')
  const [hcInterval, setHcInterval] = useState(lb.healthCheck.interval || 30)
  const [hcTimeout, setHcTimeout] = useState(lb.healthCheck.timeout || 5)

  const update = useMutation({
    mutationFn: () => loadBalancersAPI.update(lb.id, {
      name,
      algorithm,
      healthCheck: { path: hcPath, interval: hcInterval, timeout: hcTimeout },
    }),
    onSuccess: () => {
      toast.success('Settings saved')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Load balancer settings"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={update.isPending} onClick={() => update.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Algorithm"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as LoadBalancer['algorithm'])}
        >
          <option value="round_robin">Round robin</option>
          <option value="least_connections">Least connections</option>
          <option value="ip_hash">IP hash</option>
        </Select>
        <div className="border-t border-[#2a2b2a] pt-3">
          <h4 className="text-[12px] font-medium text-[#e8e8e6] mb-2">Health check</h4>
          <Input
            label="Path"
            placeholder="/health"
            value={hcPath}
            onChange={(e) => setHcPath(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              label="Interval (seconds)"
              type="number"
              value={hcInterval}
              onChange={(e) => setHcInterval(parseInt(e.target.value) || 30)}
              min={5}
              max={300}
            />
            <Input
              label="Timeout (seconds)"
              type="number"
              value={hcTimeout}
              onChange={(e) => setHcTimeout(parseInt(e.target.value) || 5)}
              min={1}
              max={60}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Suppress unused-import warnings for types we re-export only via imports.
export type _ = LoadBalancerTarget
