import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Plus, Trash2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { alertAPI, serverAPI, type AlertRule } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { Server } from '../types'
import { cn } from '../lib/utils'

const METRICS: { value: string; label: string; unit: string }[] = [
  { value: 'cpu_percent',  label: 'CPU usage',     unit: '%'    },
  { value: 'ram_percent',  label: 'RAM usage',     unit: '%'    },
  { value: 'disk_percent', label: 'Disk usage',    unit: '%'    },
  { value: 'network_in',   label: 'Network in',    unit: 'MB/s' },
  { value: 'network_out',  label: 'Network out',   unit: 'MB/s' },
]

const CONDITIONS: { value: string; label: string }[] = [
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'eq', label: 'Equal to' },
]

const DURATIONS = [1, 5, 10, 15, 30]

export default function Alerts() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<AlertRule | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AlertRule | null>(null)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => alertAPI.list().then((r) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['alert-rules'] })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firedToday = rules.filter((r) => r.lastFiredAt && new Date(r.lastFiredAt) >= today).length
  const monitored = new Set(rules.filter((r) => r.server?.id).map((r) => r.server!.id)).size

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      alertAPI.update(id, { isActive }),
    onSuccess: refresh,
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Alert rules</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Get notified by email, SMS, or webhook when a metric crosses a threshold.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Create alert rule
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total rules" value={rules.length} />
        <Stat label="Active" value={rules.filter((r) => r.isActive).length} accent="#4ade80" />
        <Stat label="Fired today" value={firedToday} accent={firedToday > 0 ? '#f87171' : undefined} />
        <Stat label="Servers monitored" value={monitored} />
      </div>

      {isLoading ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">
          Loading…
        </div>
      ) : rules.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Rule', 'Server', 'Metric', 'Condition', 'Channels', 'Active', 'Last fired', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const metric = METRICS.find((m) => m.value === rule.metric)
                return (
                  <tr key={rule.id} className="border-t border-[#2a2b2a]">
                    <td className="px-4 py-3 text-[#e8e8e6] font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-[#a0a09e]">
                      {rule.server?.name || <span className="text-[#6a6a68]">All servers</span>}
                    </td>
                    <td className="px-4 py-3 text-[#a0a09e]">{metric?.label || rule.metric}</td>
                    <td className="px-4 py-3 text-[#a0a09e]">
                      {rule.condition === 'gt' ? '>' : rule.condition === 'lt' ? '<' : '≈'}{' '}
                      <span className="font-mono text-[#e8e8e6]">
                        {rule.threshold}
                        {metric?.unit || ''}
                      </span>{' '}
                      <span className="text-[#6a6a68]">for {rule.duration}m</span>
                    </td>
                    <td className="px-4 py-3 text-[#a0a09e] text-xs">
                      {rule.channels.join(' · ')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive.mutate({ id: rule.id, isActive: !rule.isActive })}
                        className={cn(
                          'relative h-5 w-9 rounded-full transition-colors cursor-pointer',
                          rule.isActive ? 'bg-[#e0fe56]' : 'bg-[#252625]'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-4 w-4 rounded-full bg-[#0d0e0d] transition-transform',
                            rule.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6a6a68]">
                      {rule.lastFiredAt ? new Date(rule.lastFiredAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(rule)}
                          className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(rule)}
                          className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <RuleEditor
        open={creating || !!editing}
        rule={editing}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        onSuccess={refresh}
      />
      <DeleteConfirm rule={confirmDelete} onClose={() => setConfirmDelete(null)} onSuccess={refresh} />
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className="text-2xl font-medium mt-1 tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#252625] mx-auto mb-4 flex items-center justify-center">
        <Bell size={20} className="text-[#6a6a68]" />
      </div>
      <h3 className="text-base font-medium text-[#e8e8e6]">No alert rules</h3>
      <p className="text-sm text-[#a0a09e] mt-1 mb-5 max-w-sm mx-auto">
        Create your first rule to get notified when CPU, RAM, disk, or network usage crosses a threshold.
      </p>
      <Button onClick={onCreate} className="cursor-pointer">
        <Plus size={14} className="mr-1.5" /> Create alert rule
      </Button>
    </div>
  )
}

function RuleEditor({
  open,
  rule,
  onClose,
  onSuccess,
}: {
  open: boolean
  rule: AlertRule | null
  onClose: () => void
  onSuccess: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const [name, setName] = useState(rule?.name || '')
  const [serverId, setServerId] = useState(rule?.server?.id || '')
  const [metric, setMetric] = useState(rule?.metric || 'cpu_percent')
  const [condition, setCondition] = useState(rule?.condition || 'gt')
  const [threshold, setThreshold] = useState(rule?.threshold ?? 80)
  const [duration, setDuration] = useState(rule?.duration || 5)
  const [channels, setChannels] = useState<string[]>(rule?.channels || ['email'])
  const [webhookUrl, setWebhookUrl] = useState(rule?.webhookUrl || '')

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data as Server[]),
    enabled: open,
  })

  const metricMeta = METRICS.find((m) => m.value === metric) || METRICS[0]

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        serverId: serverId || null,
        metric,
        condition: condition as 'gt' | 'lt' | 'eq',
        threshold: Number(threshold),
        duration,
        channels,
        webhookUrl: webhookUrl || undefined,
      }
      return rule ? alertAPI.update(rule.id, payload) : alertAPI.create(payload)
    },
    onSuccess: () => {
      toast.success(rule ? 'Alert rule updated' : 'Alert rule created')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Save failed'),
  })

  const toggleChannel = (ch: string) =>
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">
            {rule ? 'Edit alert rule' : 'Create alert rule'}
          </h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <Input label="Rule name" value={name} onChange={(e) => setName(e.target.value)} placeholder="High CPU on web servers" />

          <Select label="Server" value={serverId} onChange={(e) => setServerId(e.target.value)}>
            <option value="">All my servers</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.region?.flag} {s.region?.city})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Select label="Condition" value={condition} onChange={(e) => setCondition(e.target.value as any)}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a0a09e] mb-1.5">Threshold</label>
              <div className="relative">
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <span className="absolute right-3 top-2 text-xs text-[#6a6a68]">{metricMeta.unit}</span>
              </div>
            </div>
            <Select label="Duration (consecutive minutes)" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} minute{d === 1 ? '' : 's'}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs text-[#a0a09e] mb-2">Notify via</label>
            <div className="space-y-2">
              <Channel
                checked={channels.includes('email')}
                onChange={() => toggleChannel('email')}
                label="Email"
                detail={user?.email}
              />
              <Channel
                checked={channels.includes('sms')}
                onChange={() => toggleChannel('sms')}
                label="SMS"
                detail={user?.phone || 'Add a phone number in Settings'}
                disabled={!user?.phone}
              />
              <Channel
                checked={channels.includes('webhook')}
                onChange={() => toggleChannel('webhook')}
                label="Webhook"
              />
              {channels.includes('webhook') && (
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/alerts"
                  className="font-mono text-xs"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!name || channels.length === 0 || (channels.includes('webhook') && !webhookUrl)}
          >
            {rule ? 'Save changes' : 'Create rule'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Channel({
  checked,
  onChange,
  label,
  detail,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  label: string
  detail?: string | null
  disabled?: boolean
}) {
  return (
    <label className={cn('flex items-center gap-2 text-sm cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="accent-[#e0fe56] cursor-pointer"
      />
      <span className="text-[#e8e8e6]">{label}</span>
      {detail && <span className="text-xs text-[#6a6a68]">{detail}</span>}
    </label>
  )
}

function DeleteConfirm({ rule, onClose, onSuccess }: { rule: AlertRule | null; onClose: () => void; onSuccess: () => void }) {
  const remove = useMutation({
    mutationFn: () => alertAPI.delete(rule!.id),
    onSuccess: () => {
      toast.success('Alert rule deleted')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  if (!rule) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <h3 className="text-base font-medium text-[#e8e8e6] mb-3">Delete alert rule</h3>
        <p className="text-sm text-[#a0a09e]">
          This will permanently delete <strong className="text-[#e8e8e6]">"{rule.name}"</strong>.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
