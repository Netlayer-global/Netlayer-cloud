import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MoreHorizontal, Power, RotateCcw, Trash2, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatDate, copyToClipboard } from '../../lib/utils'

const STATUS_VARIANT: Record<string, any> = {
  RUNNING: 'running', STOPPED: 'stopped', BUILDING: 'building', PENDING: 'pending',
  ERROR: 'error', DELETING: 'pending', REBOOTING: 'building', DELETED: 'stopped',
}

export default function AdminServers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [regionId, setRegionId] = useState('')
  const [nodeId, setNodeId] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [migrateServer, setMigrateServer] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-servers', status, regionId, nodeId],
    queryFn: () => adminAPI.listServers({
      status: status || undefined,
      regionId: regionId || undefined,
      nodeId: nodeId || undefined,
    }),
  })
  const { data: nodes = [] } = useQuery({ queryKey: ['admin-nodes'], queryFn: () => adminAPI.listNodes() })

  const power = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) =>
      adminAPI.powerServer(id, action),
    onSuccess: () => {
      toast.success('Power action sent')
      qc.invalidateQueries({ queryKey: ['admin-servers'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => adminAPI.deleteServer(id),
    onSuccess: () => {
      toast.success('Server deleted')
      qc.invalidateQueries({ queryKey: ['admin-servers'] })
      setConfirmDelete(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const migrate = useMutation({
    mutationFn: ({ id, target }: { id: string; target: string }) => adminAPI.migrateServer(id, target),
    onSuccess: () => {
      toast.success('Migration started')
      qc.invalidateQueries({ queryKey: ['admin-servers'] })
      setMigrateServer(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const allServers = data?.data || []
  const filtered = allServers.filter((s: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.ipv4 || '').toLowerCase().includes(q) ||
      s.user?.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Servers</h1>
        <p className="text-sm text-[#a0a09e] mt-1">{data?.pagination?.total ?? 0} total</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none" />
          <Input className="pl-8" placeholder="Name, IP, user email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
          <option value="">All statuses</option>
          {['RUNNING','STOPPED','BUILDING','ERROR','DELETING'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={nodeId} onChange={(e) => setNodeId(e.target.value)} className="w-44">
          <option value="">All nodes</option>
          {nodes.map((n: any) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-lg" /> : filtered.length === 0 ? (
        <EmptyTable message="No servers match your filters." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-8"></TH>
              <TH>Name</TH>
              <TH>User</TH>
              <TH>IP</TH>
              <TH>Plan</TH>
              <TH>Region</TH>
              <TH>Node</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((s: any) => (
              <>
                <TR key={s.id} onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="cursor-pointer">
                  <TD className="text-center">
                    <span className={cn('inline-block transition-transform', expanded === s.id && 'rotate-90')}>›</span>
                  </TD>
                  <TD>
                    <div className="text-[#e8e8e6] font-medium">{s.name}</div>
                    <div className="text-xs text-[#6a6a68]">{s.hostname}</div>
                  </TD>
                  <TD>
                    <div className="text-xs">{s.user?.email}</div>
                  </TD>
                  <TD>
                    {s.ipv4 ? (
                      <button className="font-mono text-xs hover:text-[#e8e8e6] cursor-pointer" onClick={(e) => { e.stopPropagation(); copyToClipboard(s.ipv4); toast.success('Copied') }}>
                        {s.ipv4}
                      </button>
                    ) : <span className="text-[#6a6a68] text-xs">—</span>}
                  </TD>
                  <TD>{s.plan?.name}</TD>
                  <TD>{s.region?.flag} {s.region?.city}</TD>
                  <TD className="text-xs">{s.node?.name || '—'}</TD>
                  <TD><Badge variant={STATUS_VARIANT[s.status] || 'default'} showDot>{s.status.toLowerCase()}</Badge></TD>
                  <TD className="text-xs">{formatDate(s.createdAt)}</TD>
                  <TD className="text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded hover:bg-[#252625]" onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === s.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-2 top-full mt-1 bg-[#161716] border border-[#2a2b2a] rounded-md shadow-lg z-20 w-48 py-1">
                          {s.status === 'RUNNING' ? (
                            <MenuItem icon={Power} label="Stop" onClick={() => { power.mutate({ id: s.id, action: 'stop' }); setOpenMenu(null) }} />
                          ) : (
                            <MenuItem icon={Power} label="Start" onClick={() => { power.mutate({ id: s.id, action: 'start' }); setOpenMenu(null) }} />
                          )}
                          <MenuItem icon={RotateCcw} label="Restart" onClick={() => { power.mutate({ id: s.id, action: 'restart' }); setOpenMenu(null) }} />
                          <MenuItem icon={ArrowRightLeft} label="Migrate node" onClick={() => { setMigrateServer(s); setOpenMenu(null) }} />
                          <div className="border-t border-[#2a2b2a] my-1" />
                          <MenuItem icon={Trash2} label="Force delete" danger onClick={() => { setConfirmDelete(s); setOpenMenu(null) }} />
                        </div>
                      </>
                    )}
                  </TD>
                </TR>
                {expanded === s.id && (
                  <TR key={s.id + '-exp'} className="bg-[#0d0e0d]">
                    <TD colSpan={10}>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[#6a6a68] uppercase tracking-wide mb-1">Specs</div>
                          <div className="text-[#e8e8e6]">{s.specs?.cpu} CPU · {s.specs?.ram} GB · {s.specs?.disk} GB</div>
                        </div>
                        <div>
                          <div className="text-[#6a6a68] uppercase tracking-wide mb-1">Bandwidth</div>
                          <div className="text-[#e8e8e6]">{s.bandwidth?.used ?? 0} / {s.bandwidth?.limit ?? 0} GB</div>
                        </div>
                        <div>
                          <div className="text-[#6a6a68] uppercase tracking-wide mb-1">Root password</div>
                          <code className="text-[#e8e8e6]">●●●●●●●●●●●●</code>
                        </div>
                      </div>
                    </TD>
                  </TR>
                )}
              </>
            ))}
          </TBody>
        </Table>
      )}

      {/* Migrate modal */}
      <Modal
        open={!!migrateServer}
        onClose={() => setMigrateServer(null)}
        title="Migrate server"
        description={`Move ${migrateServer?.name} to another node`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMigrateServer(null)}>Cancel</Button>
            <MigrateButton server={migrateServer} nodes={nodes} onMigrate={migrate.mutate} loading={migrate.isPending} />
          </>
        }
      >
        <p className="text-sm text-[#a0a09e]">
          The server will be live-migrated. There may be a brief network interruption.
        </p>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Force delete server"
        description={`This will destroy ${confirmDelete?.name} (owned by ${confirmDelete?.user?.email}). Irreversible.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={del.isPending} onClick={() => confirmDelete && del.mutate(confirmDelete.id)}>
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="bg-red-950/20 border border-red-900/40 rounded-md p-3 text-sm text-red-300">
          All data and DNS records will be removed.
        </div>
      </Modal>
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('w-full flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors', danger ? 'text-red-400 hover:bg-red-950/30' : 'text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625]')}>
      <Icon size={13} />
      {label}
    </button>
  )
}

function MigrateButton({ server, nodes, onMigrate, loading }: { server: any; nodes: any[]; onMigrate: (v: { id: string; target: string }) => void; loading: boolean }) {
  const [target, setTarget] = useState('')
  const candidates = nodes.filter((n: any) => n.id !== server?.nodeId && n.status === 'ONLINE')
  return (
    <div className="flex items-center gap-2">
      <Select value={target} onChange={(e) => setTarget(e.target.value)} className="w-44">
        <option value="">Select target node</option>
        {candidates.map((n: any) => <option key={n.id} value={n.id}>{n.name} ({n.region?.city})</option>)}
      </Select>
      <Button disabled={!target || loading} loading={loading} onClick={() => onMigrate({ id: server.id, target })}>
        Migrate
      </Button>
    </div>
  )
}
