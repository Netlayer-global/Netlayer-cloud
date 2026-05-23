import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Database, Plus, Trash2, ArrowLeft, Copy, Check, RefreshCw, Eye, EyeOff,
} from 'lucide-react'

import { databasesAPI, type ManagedDatabase, type DbEngineSpec } from '../api/infra'
import { catalogAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { cn, relativeTime, copyToClipboard } from '../lib/utils'

const ENGINE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  redis: 'Redis',
}
const ENGINE_COLOR: Record<string, string> = {
  postgresql: 'text-[#4a9eff]',
  mysql: 'text-[#f0a429]',
  redis: 'text-[#f26666]',
}

const createSchema = z.object({
  name: z.string().min(1, 'Required').max(64),
  engine: z.enum(['postgresql', 'mysql', 'redis']),
  version: z.string().min(1, 'Required'),
  planId: z.string().min(1, 'Pick a plan'),
  region: z.string().min(1, 'Pick a region'),
  backupEnabled: z.boolean(),
})
type CreateForm = z.infer<typeof createSchema>

const statusBadge = (s: string) => {
  switch (s) {
    case 'available': return <Badge variant="running">Available</Badge>
    case 'creating': return <Badge variant="building">Provisioning</Badge>
    case 'deleting': return <Badge variant="error">Deleting</Badge>
    default: return <Badge variant="default">{s}</Badge>
  }
}

export default function ManagedDatabases() {
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) return <DbDetail id={openId} onBack={() => setOpenId(null)} />
  return <DbList onOpen={setOpenId} />
}

function DbList({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: dbs = [], isLoading } = useQuery({
    queryKey: ['databases'],
    queryFn: () => databasesAPI.list().then((r) => r.data.data),
    refetchInterval: (q) => {
      const data = q.state.data as ManagedDatabase[] | undefined
      return data?.some((d) => d.status === 'creating' || d.status === 'deleting') ? 3000 : false
    },
  })

  const { data: engines = [] } = useQuery({
    queryKey: ['db-engines'],
    queryFn: () => databasesAPI.engines().then((r) => r.data.data),
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => catalogAPI.getPlans().then((r) => r.data.data),
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '', engine: 'postgresql', version: '15', planId: '', region: '', backupEnabled: true,
    },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) => databasesAPI.create(v),
    onSuccess: () => {
      toast.success('Database queued for provisioning')
      qc.invalidateQueries({ queryKey: ['databases'] })
      setCreateOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => databasesAPI.delete(id),
    onSuccess: () => {
      toast.success('Database deletion scheduled')
      qc.invalidateQueries({ queryKey: ['databases'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const selectedEngine = form.watch('engine')
  const versionsForEngine = engines.find((e: DbEngineSpec) => e.engine === selectedEngine)?.versions || []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Managed databases</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            PostgreSQL, MySQL, and Redis with automatic backups and patching.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create database
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : dbs.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Database size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No databases yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Spin up a managed database in under a minute. We handle backups, patches, and HA.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create database
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dbs.map((db) => (
            <Card key={db.id} hover onClick={() => onOpen(db.id)} className="cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={16} className={cn('shrink-0', ENGINE_COLOR[db.engine])} />
                  <div className="min-w-0">
                    <div className="text-sm text-[#e8e8e6] font-medium truncate">{db.name}</div>
                    <div className="text-[11px] text-[#6a6a68]">
                      {ENGINE_LABEL[db.engine]} {db.version}
                    </div>
                  </div>
                </div>
                {statusBadge(db.status)}
              </div>
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Region</span>
                  <span className="text-[#e8e8e6] uppercase">{db.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Host</span>
                  <span className="text-[#e8e8e6] font-mono text-[11px] truncate max-w-[60%]">
                    {db.host || '— provisioning —'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Backups</span>
                  <span className={db.backupEnabled ? 'text-emerald-400' : 'text-[#6a6a68]'}>
                    {db.backupEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Created</span>
                  <span className="text-[#e8e8e6]">{relativeTime(db.createdAt)}</span>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-[#2a2b2a] mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete database "${db.name}"? All data will be lost.`)) {
                      del.mutate(db.id)
                    }
                  }}
                  className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="Create database"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>Create</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <Input
            label="Name"
            placeholder="prod-postgres"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Engine" {...form.register('engine')}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="redis">Redis</option>
            </Select>
            <Select label="Version" {...form.register('version')} error={form.formState.errors.version?.message}>
              <option value="">Select…</option>
              {versionsForEngine.map((v: string) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
          </div>
          <Select label="Plan" {...form.register('planId')} error={form.formState.errors.planId?.message}>
            <option value="">Select a plan…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.cpu} vCPU / {p.ramGB} GB / {p.diskGB} GB
              </option>
            ))}
          </Select>
          <Select label="Region" {...form.register('region')} error={form.formState.errors.region?.message}>
            <option value="">Select a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.flag} {r.city}, {r.country}
              </option>
            ))}
          </Select>
          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
            <input type="checkbox" className="mt-1 accent-[#e0fe56]" {...form.register('backupEnabled')} />
            <div>
              <div className="text-sm text-[#e8e8e6]">Daily backups</div>
              <div className="text-xs text-[#6a6a68]">7-day retention. You can restore from any backup.</div>
            </div>
          </label>
        </form>
      </Modal>
    </div>
  )
}

function DbDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [revealPassword, setRevealPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: db, isLoading } = useQuery({
    queryKey: ['database', id],
    queryFn: () => databasesAPI.get(id).then((r) => r.data.data),
    refetchInterval: (q) => {
      const data = q.state.data as ManagedDatabase | undefined
      return data?.status === 'creating' ? 3000 : false
    },
  })

  const rotate = useMutation({
    mutationFn: () => databasesAPI.rotatePassword(id),
    onSuccess: () => {
      toast.success('Password rotated')
      qc.invalidateQueries({ queryKey: ['database', id] })
      setRevealPassword(true)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const toggleBackup = useMutation({
    mutationFn: (enabled: boolean) => databasesAPI.update(id, { backupEnabled: enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['database', id] })
      qc.invalidateQueries({ queryKey: ['databases'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  if (isLoading || !db) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{db.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {statusBadge(db.status)}
            <span className="text-xs text-[#6a6a68]">
              {ENGINE_LABEL[db.engine]} {db.version} · {db.region.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {db.status === 'creating' && (
        <Card padding="p-4" className="border-amber-900/40 bg-amber-950/10">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <RefreshCw size={14} className="animate-spin" />
            Provisioning your database. This usually takes under a minute.
          </div>
        </Card>
      )}

      {/* Connection details */}
      <Card padding="p-5">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Connection</h3>
        <Table>
          <TBody>
            <DetailRow label="Host" value={db.host || '—'} onCopy={db.host ? () => handleCopy(db.host!, 'host') : undefined} copied={copied === 'host'} />
            <DetailRow label="Port" value={db.port?.toString() || '—'} />
            <DetailRow label="Database" value={db.database || '—'} />
            <DetailRow label="Username" value={db.username || '—'} onCopy={db.username ? () => handleCopy(db.username!, 'user') : undefined} copied={copied === 'user'} />
            <TR>
              <TD className="text-[#6a6a68] w-32">Password</TD>
              <TD className="font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate">
                    {db.password
                      ? (revealPassword ? db.password : '•'.repeat(Math.min(db.password.length, 24)))
                      : '— hidden —'}
                  </span>
                  {db.password && (
                    <button
                      onClick={() => setRevealPassword(!revealPassword)}
                      className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                    >
                      {revealPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  )}
                  {db.password && (
                    <button
                      onClick={() => handleCopy(db.password!, 'pass')}
                      className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                    >
                      {copied === 'pass' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    loading={rotate.isPending}
                    onClick={() => {
                      if (confirm('Rotate password? Existing connections will be terminated.')) {
                        rotate.mutate()
                      }
                    }}
                  >
                    Rotate
                  </Button>
                </div>
              </TD>
            </TR>
          </TBody>
        </Table>

        {db.connectionString && (
          <div className="mt-4">
            <div className="text-xs text-[#6a6a68] mb-1">Connection string</div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] text-[#e8e8e6] bg-[#0d0e0d] px-2 py-2 rounded flex-1 font-mono break-all border border-[#2a2b2a]">
                {revealPassword
                  ? db.connectionString
                  : db.connectionString.replace(/:[^:@]+@/, ':•••••••@')}
              </code>
              <button
                onClick={() => handleCopy(db.connectionString!, 'conn')}
                className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-2 rounded transition-colors"
              >
                {copied === 'conn' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-[#6a6a68] mt-2">
              Use this string with your favorite client (psql, mysql, redis-cli, ORMs).
            </p>
          </div>
        )}
      </Card>

      <Card padding="p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-[#e8e8e6]">Daily backups</h3>
            <p className="text-xs text-[#6a6a68] mt-0.5">7-day retention. Run nightly at 02:00 UTC.</p>
          </div>
          <button
            onClick={() => toggleBackup.mutate(!db.backupEnabled)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
              db.backupEnabled ? 'bg-[#e0fe56]' : 'bg-[#333433]'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                db.backupEnabled ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      </Card>
    </div>
  )
}

function DetailRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <TR>
      <TD className="text-[#6a6a68] w-32">{label}</TD>
      <TD className="font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate">{value}</span>
          {onCopy && (
            <button
              onClick={onCopy}
              className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </TD>
    </TR>
  )
}
