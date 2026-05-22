import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play, Square, RotateCcw, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Trash2, Terminal,
  Plus, Camera, Shield as ShieldIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts'
import { serverAPI, catalogAPI } from '../api/endpoints'
import { serverExtraAPI } from '../api/admin'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { cn, copyToClipboard, formatDate, formatTime } from '../lib/utils'
import { getSocket } from '../lib/socket'
import type { ServerStatus } from '../types'

const statusToBadge = (status: ServerStatus) => {
  const map: Record<ServerStatus, any> = {
    RUNNING: 'running', STOPPED: 'stopped', BUILDING: 'building', PENDING: 'pending',
    ERROR: 'error', DELETING: 'pending', REBOOTING: 'building', DELETED: 'stopped',
  }
  return map[status]
}

type Tab = 'overview' | 'metrics' | 'console' | 'snapshots' | 'firewall' | 'settings'

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showPassword, setShowPassword] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => serverAPI.get(id!).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s && ['BUILDING', 'PENDING', 'REBOOTING'].includes(s) ? 3000 : false
    },
  })

  useEffect(() => {
    if (!id) return
    const socket = getSocket()
    socket.emit('subscribe:server', id)
    const onStatus = (payload: any) => {
      if (payload.serverId === id) qc.invalidateQueries({ queryKey: ['server', id] })
    }
    socket.on('server:status', onStatus)
    return () => {
      socket.emit('unsubscribe:server', id)
      socket.off('server:status', onStatus)
    }
  }, [id, qc])

  const power = useMutation({
    mutationFn: (action: 'start' | 'stop' | 'restart') => serverAPI.power(id!, action),
    onSuccess: () => {
      toast.success('Action sent')
      qc.invalidateQueries({ queryKey: ['server', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: () => serverAPI.delete(id!),
    onSuccess: () => {
      toast.success('Server deleted')
      navigate('/dashboard/servers')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} color="lime" />
      </div>
    )
  }
  if (!server) return <div className="text-center py-20 text-[#a0a09e]">Server not found.</div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'metrics', label: 'Metrics' },
    { key: 'console', label: 'Console' },
    { key: 'snapshots', label: 'Snapshots' },
    { key: 'firewall', label: 'Firewall' },
    { key: 'settings', label: 'Settings' },
  ]
  const isReady = server.status === 'RUNNING'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card padding="p-5" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={statusToBadge(server.status)} showDot>{server.status.toLowerCase()}</Badge>
            <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{server.name}</h1>
            <button className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"><Pencil size={13} /></button>
          </div>
          <div className="text-xs text-[#6a6a68] font-mono">{server.hostname}</div>
        </div>
        {server.ipv4 && (
          <button
            className="flex items-center gap-1.5 text-xs text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
            onClick={() => { copyToClipboard(server.ipv4!); toast.success('IP copied') }}
          >
            <span className="font-mono">{server.ipv4}</span>
            <Copy size={12} />
          </button>
        )}
        <div className="flex items-center gap-1">
          <PowerBtn icon={Play} title="Start" disabled={!isReady || power.isPending} onClick={() => power.mutate('start')} hoverColor="text-[#4ade80]" />
          <PowerBtn icon={Square} title="Stop" disabled={server.status !== 'RUNNING' || power.isPending} onClick={() => power.mutate('stop')} hoverColor="text-amber-400" />
          <PowerBtn icon={RotateCcw} title="Restart" disabled={server.status !== 'RUNNING' || power.isPending} onClick={() => power.mutate('restart')} hoverColor="text-[#e8e8e6]" />
          <button
            onClick={() => setDeleteOpen(true)}
            className="h-8 w-8 rounded-md border border-[#333433] text-[#a0a09e] hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/60 flex items-center justify-center cursor-pointer transition-colors"
            title="Delete"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </Card>

      <div className="border-b border-[#2a2b2a] flex items-center gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 h-9 text-sm cursor-pointer transition-colors relative whitespace-nowrap',
              tab === t.key ? 'text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-px bg-[#e0fe56]" />}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab server={server} showPassword={showPassword} setShowPassword={setShowPassword} />}
      {tab === 'metrics' && <MetricsTab serverId={server.id} />}
      {tab === 'console' && <ConsoleTab serverId={server.id} server={server} />}
      {tab === 'snapshots' && <SnapshotsTab serverId={server.id} />}
      {tab === 'firewall' && <FirewallTab serverId={server.id} />}
      {tab === 'settings' && <SettingsTab serverId={server.id} serverName={server.name} onDelete={() => setDeleteOpen(true)} />}

      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteStep(1); setDeleteConfirm('') }}
        title="Delete server"
        description="This action is irreversible."
        size="md"
        footer={
          deleteStep === 1 ? (
            <>
              <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setDeleteStep(2)}>Continue</Button>
            </>
          ) : deleteStep === 2 ? (
            <>
              <Button variant="secondary" onClick={() => setDeleteStep(1)}>Back</Button>
              <Button variant="danger" disabled={deleteConfirm !== server.name} onClick={() => setDeleteStep(3)}>Confirm</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setDeleteStep(2)}>Back</Button>
              <Button variant="danger" loading={del.isPending} onClick={() => del.mutate()}>Delete permanently</Button>
            </>
          )
        }
      >
        {deleteStep === 1 && <p className="text-sm text-[#a0a09e]">All data, snapshots, and DNS records will be permanently deleted.</p>}
        {deleteStep === 2 && (
          <div>
            <p className="text-sm text-[#a0a09e] mb-3">
              Type <code className="bg-[#1e1f1e] px-1.5 py-0.5 rounded text-[#e8e8e6] font-mono text-xs">{server.name}</code> to confirm:
            </p>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={server.name} autoFocus />
          </div>
        )}
        {deleteStep === 3 && (
          <div className="bg-red-950/30 border border-red-900/40 rounded-md p-3 text-sm text-red-300">
            <strong>Final confirmation.</strong> Click "Delete permanently" to destroy this server.
          </div>
        )}
      </Modal>
    </div>
  )
}

function PowerBtn({ icon: Icon, title, disabled, onClick, hoverColor }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        'h-8 w-8 rounded-md border border-[#333433] text-[#a0a09e] flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors',
        !disabled && `hover:bg-[#1e1f1e] hover:${hoverColor}`
      )}
    >
      <Icon size={13} />
    </button>
  )
}

// ─── Overview ──────────────────────────────────────
function OverviewTab({ server, showPassword, setShowPassword }: any) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card padding="p-5">
          <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Specs</h3>
          <div className="space-y-3">
            <UsageBar label="CPU" value={35} sub={`${server.specs.cpu} vCPU`} color="#4ade80" />
            <UsageBar label="RAM" value={62} sub={`${server.specs.ram} GB`} color="#8261fb" />
            <UsageBar label="Disk" value={28} sub={`${server.specs.disk} GB SSD`} color="#e0fe56" />
          </div>
        </Card>
        <Card padding="p-5">
          <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">SSH access</h3>
          <div className="bg-[#0d0e0d] border border-[#2a2b2a] rounded-md p-3 font-mono text-xs text-[#e0fe56] flex items-center justify-between">
            <span>ssh root@{server.ipv4 || server.hostname}</span>
            <button
              className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
              onClick={() => { copyToClipboard(`ssh root@${server.ipv4 || server.hostname}`); toast.success('Copied') }}
            >
              <Copy size={13} />
            </button>
          </div>
        </Card>
      </div>
      <div>
        <Card padding="p-5">
          <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Server info</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="IP address" value={server.ipv4 || '—'} mono copyable />
            <InfoRow label="Hostname" value={server.hostname} mono />
            <InfoRow label="Region" value={`${server.region.flag} ${server.region.city}`} />
            <InfoRow label="Plan" value={server.plan.name} />
            <InfoRow label="OS" value={server.osTemplate.name} />
            <InfoRow label="Created" value={formatDate(server.createdAt)} />
          </div>
          <div className="border-t border-[#2a2b2a] mt-4 pt-4">
            <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-1.5">Root password</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0d0e0d] border border-[#2a2b2a] rounded px-2 py-1.5 font-mono text-xs text-[#e8e8e6]">
                {showPassword ? server.rootPassword || '••••••••' : '••••••••••••'}
              </code>
              <button onClick={() => setShowPassword(!showPassword)} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              {server.rootPassword && (
                <button
                  className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
                  onClick={() => { copyToClipboard(server.rootPassword); toast.success('Password copied') }}
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function UsageBar({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#a0a09e]">{label}</span>
        <span className="text-xs text-[#6a6a68]">{sub} · {value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-[#0d0e0d] rounded overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-[#6a6a68] uppercase tracking-wide pt-0.5">{label}</span>
      <span className={cn('text-right text-[#e8e8e6]', mono && 'font-mono text-xs')}>
        {value}
        {copyable && value !== '—' && (
          <button
            className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer ml-1.5"
            onClick={() => { copyToClipboard(value); toast.success('Copied') }}
          >
            <Copy size={11} className="inline" />
          </button>
        )}
      </span>
    </div>
  )
}

// ─── Metrics ───────────────────────────────────────
function MetricsTab({ serverId }: { serverId: string }) {
  const [range, setRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', serverId, range],
    queryFn: () => serverAPI.getMetrics(serverId, range).then((r) => r.data.data),
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5 w-fit">
        {(['1h', '6h', '24h', '7d'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'h-7 px-3 text-xs rounded cursor-pointer transition-colors',
              range === r ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {isLoading || !metrics ? (
        <Card padding="p-5"><div className="h-48 bg-[#0d0e0d] animate-pulse-soft rounded" /></Card>
      ) : (
        <>
          <Card padding="p-5">
            <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">CPU usage</h3>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={metrics.cpu}>
                  <CartesianGrid stroke="#2a2b2a" strokeDasharray="3 3" />
                  <XAxis dataKey="t" stroke="#6a6a68" fontSize={10} tickFormatter={formatTime} />
                  <YAxis stroke="#6a6a68" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }} labelFormatter={formatTime} />
                  <Line type="monotone" dataKey="v" stroke="#e0fe56" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card padding="p-5">
            <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">RAM usage</h3>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={metrics.ram}>
                  <defs>
                    <linearGradient id="ram" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8261fb" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8261fb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2b2a" strokeDasharray="3 3" />
                  <XAxis dataKey="t" stroke="#6a6a68" fontSize={10} tickFormatter={formatTime} />
                  <YAxis stroke="#6a6a68" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }} labelFormatter={formatTime} />
                  <Area type="monotone" dataKey="v" stroke="#8261fb" strokeWidth={2} fill="url(#ram)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card padding="p-5">
            <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Disk usage</h3>
            <div className="text-3xl font-medium text-[#e8e8e6]">{metrics.disk.toFixed(1)}%</div>
            <div className="mt-3 h-1.5 bg-[#0d0e0d] rounded overflow-hidden">
              <div className="h-full bg-[#e0fe56] transition-all" style={{ width: `${metrics.disk}%` }} />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Console ───────────────────────────────────────
function ConsoleTab({ serverId, server }: { serverId: string; server: any }) {
  const { data: console, refetch, isFetching } = useQuery({
    queryKey: ['console', serverId],
    queryFn: () => serverExtraAPI.getConsole(serverId),
    enabled: false,
  })

  return (
    <Card padding="p-5">
      <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Console access</h3>
      <p className="text-sm text-[#a0a09e] mb-4">Connect via SSH or open the browser console.</p>
      <div className="bg-[#0d0e0d] border border-[#2a2b2a] rounded-md p-3 font-mono text-sm text-[#e0fe56] mb-4 flex items-center justify-between">
        <span>ssh root@{server.ipv4 || server.hostname}</span>
        <button onClick={() => { copyToClipboard(`ssh root@${server.ipv4 || server.hostname}`); toast.success('Copied') }} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">
          <Copy size={14} />
        </button>
      </div>
      <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
        <Terminal size={13} /> Open VNC console
      </Button>
      {console && (
        <div className="mt-4 bg-[#0d0e0d] border border-[#2a2b2a] rounded-md p-3 text-xs">
          <div className="text-[#6a6a68] mb-1">Console ticket (valid 30s)</div>
          <code className="text-[#e0fe56] break-all">{console.ticket}</code>
          <div className="mt-2 text-[#6a6a68]">VM ID: {console.vmId} · Port: {console.port}</div>
        </div>
      )}
    </Card>
  )
}

// ─── Snapshots ─────────────────────────────────────
function SnapshotsTab({ serverId }: { serverId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['snapshots', serverId],
    queryFn: () => serverExtraAPI.listSnapshots(serverId),
  })

  const create = useMutation({
    mutationFn: () => serverExtraAPI.createSnapshot(serverId, name),
    onSuccess: () => {
      toast.success('Snapshot created')
      qc.invalidateQueries({ queryKey: ['snapshots', serverId] })
      setOpen(false)
      setName('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => serverExtraAPI.deleteSnapshot(serverId, id),
    onSuccess: () => {
      toast.success('Snapshot deleted')
      qc.invalidateQueries({ queryKey: ['snapshots', serverId] })
    },
  })

  return (
    <div className="space-y-4">
      <Card padding="p-4" className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#e8e8e6]">Snapshots</h3>
          <p className="text-xs text-[#a0a09e] mt-0.5">Point-in-time copies of your server.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Camera size={13} /> Create snapshot</Button>
      </Card>
      {isLoading ? (
        <Card padding="p-8" className="text-center"><Spinner size={24} color="lime" /></Card>
      ) : snapshots.length === 0 ? (
        <EmptyTable message="No snapshots yet." />
      ) : (
        <Table>
          <THead>
            <tr><TH>Name</TH><TH>Status</TH><TH>Size</TH><TH>Created</TH><TH className="w-12"></TH></tr>
          </THead>
          <TBody>
            {snapshots.map((s: any) => (
              <TR key={s.id}>
                <TD className="text-[#e8e8e6]">{s.name}</TD>
                <TD><Badge variant={s.status === 'ready' ? 'running' : s.status === 'error' ? 'error' : 'building'} showDot>{s.status}</Badge></TD>
                <TD className="text-xs">{(s.size || 0).toFixed(1)} GB</TD>
                <TD className="text-xs">{formatDate(s.createdAt)}</TD>
                <TD className="text-right">
                  <button
                    onClick={() => { if (confirm(`Delete snapshot "${s.name}"?`)) del.mutate(s.id) }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setName('') }}
        title="Create snapshot"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!name} loading={create.isPending} onClick={() => create.mutate()}>Create</Button>
          </>
        }
      >
        <Input label="Snapshot name" value={name} onChange={(e) => setName(e.target.value)} placeholder="pre-upgrade-2024-01" />
      </Modal>
    </div>
  )
}

// ─── Firewall ──────────────────────────────────────
function FirewallTab({ serverId }: { serverId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({
    direction: 'INBOUND', protocol: 'TCP', portFrom: '', portTo: '', sourceIp: '', action: 'ACCEPT',
  })

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['firewall', serverId],
    queryFn: () => serverExtraAPI.listFirewall(serverId),
  })

  const create = useMutation({
    mutationFn: () => serverExtraAPI.createFirewallRule(serverId, {
      direction: form.direction,
      protocol: form.protocol,
      portFrom: form.portFrom ? parseInt(form.portFrom, 10) : undefined,
      portTo: form.portTo ? parseInt(form.portTo, 10) : undefined,
      sourceIp: form.sourceIp || undefined,
      action: form.action,
    }),
    onSuccess: () => {
      toast.success('Rule added')
      qc.invalidateQueries({ queryKey: ['firewall', serverId] })
      setOpen(false)
      setForm({ direction: 'INBOUND', protocol: 'TCP', portFrom: '', portTo: '', sourceIp: '', action: 'ACCEPT' })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => serverExtraAPI.deleteFirewallRule(serverId, id),
    onSuccess: () => {
      toast.success('Rule deleted')
      qc.invalidateQueries({ queryKey: ['firewall', serverId] })
    },
  })

  return (
    <div className="space-y-4">
      <Card padding="p-4" className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#e8e8e6]">Firewall rules</h3>
          <p className="text-xs text-[#a0a09e] mt-0.5">Control inbound and outbound traffic.</p>
        </div>
        <Button onClick={() => setOpen(true)}><ShieldIcon size={13} /> Add rule</Button>
      </Card>
      {isLoading ? (
        <Card padding="p-8" className="text-center"><Spinner size={24} color="lime" /></Card>
      ) : rules.length === 0 ? (
        <EmptyTable message="No firewall rules. Default policy: allow all." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Direction</TH><TH>Protocol</TH><TH>Port</TH><TH>Source</TH><TH>Action</TH><TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {rules.map((r: any) => (
              <TR key={r.id}>
                <TD>{r.direction}</TD>
                <TD>{r.protocol}</TD>
                <TD className="font-mono text-xs">
                  {r.portFrom ? (r.portTo && r.portTo !== r.portFrom ? `${r.portFrom}-${r.portTo}` : r.portFrom) : 'any'}
                </TD>
                <TD className="font-mono text-xs">{r.sourceIp || 'any'}</TD>
                <TD>
                  <Badge variant={r.action === 'ACCEPT' ? 'running' : 'error'}>{r.action.toLowerCase()}</Badge>
                </TD>
                <TD className="text-right">
                  <button
                    onClick={() => { if (confirm('Delete this rule?')) del.mutate(r.id) }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add firewall rule"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>Add rule</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Select label="Direction" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
          </Select>
          <Select label="Protocol" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
            <option value="TCP">TCP</option><option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option><option value="ALL">ALL</option>
          </Select>
          <Input label="Port from" type="number" value={form.portFrom} onChange={(e) => setForm({ ...form, portFrom: e.target.value })} placeholder="22" />
          <Input label="Port to" type="number" value={form.portTo} onChange={(e) => setForm({ ...form, portTo: e.target.value })} placeholder="22" />
          <Input label="Source IP / CIDR" value={form.sourceIp} onChange={(e) => setForm({ ...form, sourceIp: e.target.value })} placeholder="0.0.0.0/0" />
          <Select label="Action" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
            <option value="ACCEPT">Accept</option><option value="DROP">Drop</option><option value="REJECT">Reject</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}

// ─── Settings ──────────────────────────────────────
function SettingsTab({ serverId, serverName, onDelete }: { serverId: string; serverName: string; onDelete: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(serverName)
  const [rebuildOsId, setRebuildOsId] = useState('')
  const [rebuildPwd, setRebuildPwd] = useState('')

  const { data: osList = [] } = useQuery({
    queryKey: ['os'],
    queryFn: () => catalogAPI.getOS().then((r) => r.data.data),
  })

  const rebuild = useMutation({
    mutationFn: () => serverAPI.rebuild(serverId, rebuildOsId, rebuildPwd),
    onSuccess: () => {
      toast.success('Rebuild started')
      qc.invalidateQueries({ queryKey: ['server', serverId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Rebuild failed'),
  })

  return (
    <div className="space-y-4">
      <Card padding="p-5">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Rename server</h3>
        <div className="flex gap-2 max-w-md">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="secondary">Save</Button>
        </div>
      </Card>
      <Card padding="p-5">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-1">Rebuild server</h3>
        <p className="text-xs text-[#a0a09e] mb-4">Reinstall the OS. All data will be lost.</p>
        <div className="space-y-3 max-w-md">
          <Select label="New OS" value={rebuildOsId} onChange={(e) => setRebuildOsId(e.target.value)}>
            <option value="">Select OS…</option>
            {osList.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <Input
            label="New root password"
            type="password"
            value={rebuildPwd}
            onChange={(e) => setRebuildPwd(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Button
            variant="secondary"
            disabled={!rebuildOsId || rebuildPwd.length < 8}
            loading={rebuild.isPending}
            onClick={() => rebuild.mutate()}
          >
            Rebuild
          </Button>
        </div>
      </Card>
      <Card padding="p-5" className="border-red-900/40">
        <h3 className="text-sm font-medium text-red-400 mb-1">Danger zone</h3>
        <p className="text-xs text-[#a0a09e] mb-4">Permanently delete this server.</p>
        <Button variant="danger" onClick={onDelete}><Trash2 size={13} /> Delete server</Button>
      </Card>
    </div>
  )
}
