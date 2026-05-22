import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Wrench, Server as ServerIcon, Trash2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { catalogAPI } from '../../api/endpoints'
import { cn, relativeTime } from '../../lib/utils'

const STATUS_VARIANT: Record<string, any> = {
  ONLINE: 'running', OFFLINE: 'error', DEGRADED: 'building', MAINTENANCE: 'pending',
}

export default function AdminNodes() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editNode, setEditNode] = useState<any | null>(null)
  const [vmsNode, setVmsNode] = useState<any | null>(null)

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['admin-nodes'],
    queryFn: () => adminAPI.listNodes(),
    refetchInterval: 60000,
  })

  const summary = {
    total: nodes.length,
    online: nodes.filter((n: any) => n.status === 'ONLINE').length,
    offline: nodes.filter((n: any) => n.status === 'OFFLINE').length,
    degraded: nodes.filter((n: any) => n.status === 'DEGRADED').length,
    maintenance: nodes.filter((n: any) => n.status === 'MAINTENANCE').length,
    totalVMs: nodes.reduce((s: number, n: any) => s + (n.currentVMs || 0), 0),
  }

  const test = useMutation({
    mutationFn: (id: string) => adminAPI.testNode(id),
    onSuccess: (data) => {
      if (data.success) toast.success(`Connected · ${data.nodeInfo?.version || 'OK'}`)
      else toast.error(data.error || 'Test failed')
    },
  })
  const sync = useMutation({
    mutationFn: (id: string) => adminAPI.syncNode(id),
    onSuccess: (data) => {
      toast.success(`Synced · ${data.proxmoxVms} VMs on Proxmox, ${data.dbServers} in DB`)
      qc.invalidateQueries({ queryKey: ['admin-nodes'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })
  const maintenance = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adminAPI.toggleMaintenance(id, enabled, enabled ? 'Scheduled maintenance' : undefined),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin-nodes'] })
    },
  })
  const del = useMutation({
    mutationFn: (id: string) => adminAPI.deleteNode(id),
    onSuccess: () => {
      toast.success('Node deleted')
      qc.invalidateQueries({ queryKey: ['admin-nodes'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Nodes</h1>
          <p className="text-sm text-[#a0a09e] mt-1">Proxmox hypervisors backing the platform.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add node</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: summary.total },
          { label: 'Online',      value: summary.online,      cls: 'text-[#4ade80]' },
          { label: 'Degraded',    value: summary.degraded,    cls: 'text-amber-400' },
          { label: 'Maintenance', value: summary.maintenance, cls: 'text-amber-400' },
          { label: 'Offline',     value: summary.offline,     cls: 'text-red-400' },
          { label: 'Total VMs',   value: summary.totalVMs,    cls: 'text-[#e0fe56]' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-1">{s.label}</div>
            <div className={cn('text-xl font-medium', s.cls || 'text-[#e8e8e6]')}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : nodes.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <ServerIcon size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <p className="text-sm text-[#a0a09e]">No nodes yet. Add one to start provisioning.</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {nodes.map((n: any) => {
            const cpuPct = n.totalCpu > 0 ? (n.usedCpu / n.totalCpu) * 100 : 0
            const ramPct = n.totalRamGB > 0 ? (n.usedRamGB / n.totalRamGB) * 100 : 0
            const diskPct = n.totalDiskGB > 0 ? (n.usedDiskGB / n.totalDiskGB) * 100 : 0
            const vmPct = n.maxVMs > 0 ? (n.currentVMs / n.maxVMs) * 100 : 0
            return (
              <Card key={n.id} padding="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#e8e8e6]">{n.name}</span>
                      <Badge variant={STATUS_VARIANT[n.status] || 'default'} showDot>
                        {n.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#6a6a68] mt-0.5">{n.region?.flag} {n.region?.city} · {n.networkGbps} Gbps</div>
                  </div>
                  <div className="text-right text-[10px] text-[#6a6a68]">
                    {n.lastSyncAt ? `synced ${relativeTime(n.lastSyncAt)}` : 'never synced'}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Bar label="CPU" used={n.usedCpu} total={n.totalCpu} unit="cores" pct={cpuPct} />
                  <Bar label="RAM" used={n.usedRamGB} total={n.totalRamGB} unit="GB" pct={ramPct} />
                  <Bar label="Disk" used={n.usedDiskGB} total={n.totalDiskGB} unit="GB" pct={diskPct} />
                  <Bar label="VMs" used={n.currentVMs} total={n.maxVMs} unit="" pct={vmPct} />
                </div>

                {Array.isArray(n.ipRanges) && n.ipRanges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {n.ipRanges.map((r: string) => (
                      <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e1f1e] border border-[#333433] text-[#a0a09e] font-mono">{r}</span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#2a2b2a]">
                  <Button size="sm" variant="secondary" onClick={() => test.mutate(n.id)} loading={test.isPending && test.variables === n.id}>
                    Test
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => sync.mutate(n.id)} loading={sync.isPending && sync.variables === n.id}>
                    <RefreshCw size={12} /> Sync
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => maintenance.mutate({ id: n.id, enabled: n.status !== 'MAINTENANCE' })}>
                    <Wrench size={12} /> {n.status === 'MAINTENANCE' ? 'Resume' : 'Maintenance'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setVmsNode(n)}>
                    <ServerIcon size={12} /> VMs
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditNode(n)}>
                    <Pencil size={12} /> Edit
                  </Button>
                  {n.currentVMs === 0 && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm(`Delete node "${n.name}"?`)) del.mutate(n.id)
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <NodeModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-nodes'] })} />
      <NodeModal open={!!editNode} onClose={() => setEditNode(null)} editing={editNode} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-nodes'] })} />
      {vmsNode && <NodeVmsDrawer node={vmsNode} onClose={() => setVmsNode(null)} />}
    </div>
  )
}

function Bar({ label, used, total, unit, pct }: { label: string; used: number; total: number; unit: string; pct: number }) {
  const color = pct > 80 ? '#f87171' : pct > 60 ? '#fbbf24' : '#4ade80'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#a0a09e]">{label}</span>
        <span className="text-[#6a6a68]">{used}/{total} {unit} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-[#0d0e0d] rounded overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  )
}

function NodeModal({
  open, onClose, editing, onSaved,
}: {
  open: boolean; onClose: () => void; editing?: any; onSaved: () => void
}) {
  const isEdit = !!editing
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  const [form, setForm] = useState(() =>
    editing
      ? {
          name: editing.name,
          regionId: editing.regionId,
          proxmoxHost: editing.proxmoxHost,
          proxmoxNode: editing.proxmoxNode,
          proxmoxTokenId: editing.proxmoxTokenId,
          proxmoxTokenSecret: '',
          totalCpu: String(editing.totalCpu),
          totalRamGB: String(editing.totalRamGB),
          totalDiskGB: String(editing.totalDiskGB),
          maxVMs: String(editing.maxVMs),
          networkGbps: String(editing.networkGbps),
          ipRanges: (editing.ipRanges || []).join(', '),
        }
      : {
          name: '', regionId: '', proxmoxHost: '', proxmoxNode: 'pve', proxmoxTokenId: '',
          proxmoxTokenSecret: '', totalCpu: '32', totalRamGB: '128', totalDiskGB: '3840',
          maxVMs: '50', networkGbps: '10', ipRanges: '',
        }
  )

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; nodeInfo?: any } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await adminAPI.testProxmox({
        host: form.proxmoxHost,
        nodeId: form.proxmoxNode,
        tokenId: form.proxmoxTokenId,
        tokenSecret: form.proxmoxTokenSecret,
      })
      setTestResult(res)
    } catch (e: any) {
      setTestResult({ success: false, error: e.response?.data?.error || e.message })
    } finally {
      setTesting(false)
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {
        name: form.name,
        regionId: form.regionId,
        proxmoxHost: form.proxmoxHost,
        proxmoxNode: form.proxmoxNode,
        proxmoxTokenId: form.proxmoxTokenId,
        ...(form.proxmoxTokenSecret && { proxmoxTokenSecret: form.proxmoxTokenSecret }),
        totalCpu: parseInt(form.totalCpu, 10),
        totalRamGB: parseInt(form.totalRamGB, 10),
        totalDiskGB: parseInt(form.totalDiskGB, 10),
        maxVMs: parseInt(form.maxVMs, 10),
        networkGbps: parseInt(form.networkGbps, 10),
        ipRanges: form.ipRanges.split(',').map((s: string) => s.trim()).filter(Boolean),
      }
      return isEdit ? adminAPI.updateNode(editing.id, payload) : adminAPI.createNode(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Node updated' : 'Node created')
      onSaved()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit node' : 'Add node'}
      description={isEdit ? `Modify ${editing.name}` : 'Connect a new Proxmox node.'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!isEdit && (!testResult?.success || !form.name || !form.regionId)}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {isEdit ? 'Save' : 'Create node'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mumbai Node 02" />
        <Select label="Region" value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })}>
          <option value="">Select…</option>
          {regions.map((r: any) => <option key={r.id} value={r.id}>{r.flag} {r.city}, {r.country}</option>)}
        </Select>
      </div>

      <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-1.5 mt-3">Proxmox connection</div>
      <div className="space-y-3">
        <Input label="Host URL" value={form.proxmoxHost} onChange={(e) => setForm({ ...form, proxmoxHost: e.target.value })} placeholder="https://10.0.0.1:8006" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Node name" value={form.proxmoxNode} onChange={(e) => setForm({ ...form, proxmoxNode: e.target.value })} placeholder="pve" />
          <Input label="Token ID" value={form.proxmoxTokenId} onChange={(e) => setForm({ ...form, proxmoxTokenId: e.target.value })} placeholder="user@pam!api" />
        </div>
        <Input label={`Token secret${isEdit ? ' (leave empty to keep)' : ''}`} type="password" value={form.proxmoxTokenSecret} onChange={(e) => setForm({ ...form, proxmoxTokenSecret: e.target.value })} />
      </div>

      <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-1.5 mt-4">Capacity</div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="CPU cores" type="number" value={form.totalCpu} onChange={(e) => setForm({ ...form, totalCpu: e.target.value })} />
        <Input label="RAM (GB)" type="number" value={form.totalRamGB} onChange={(e) => setForm({ ...form, totalRamGB: e.target.value })} />
        <Input label="Disk (GB)" type="number" value={form.totalDiskGB} onChange={(e) => setForm({ ...form, totalDiskGB: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Input label="Max VMs" type="number" value={form.maxVMs} onChange={(e) => setForm({ ...form, maxVMs: e.target.value })} />
        <Input label="Network (Gbps)" type="number" value={form.networkGbps} onChange={(e) => setForm({ ...form, networkGbps: e.target.value })} />
      </div>
      <Input label="IP ranges (comma separated)" className="mt-3" value={form.ipRanges} onChange={(e) => setForm({ ...form, ipRanges: e.target.value })} placeholder="103.21.148.0/24" />

      <Button variant="secondary" className="w-full mt-5" onClick={handleTest} loading={testing} disabled={!form.proxmoxHost || !form.proxmoxNode || !form.proxmoxTokenId || !form.proxmoxTokenSecret}>
        Test connection
      </Button>

      {testResult && (
        <div className={cn('mt-3 rounded-md p-3 text-sm border', testResult.success ? 'bg-green-950/20 border-green-900/40 text-green-300' : 'bg-red-950/20 border-red-900/40 text-red-300')}>
          {testResult.success ? (
            <>
              <div className="font-medium">✓ Connected</div>
              {testResult.nodeInfo && (
                <div className="text-xs mt-1 text-[#a0a09e]">
                  Version {testResult.nodeInfo.version} · Uptime {Math.floor((testResult.nodeInfo.uptime || 0) / 86400)} days
                </div>
              )}
            </>
          ) : (
            <>
              <div className="font-medium">✗ Connection failed</div>
              <div className="text-xs mt-1">{testResult.error}</div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

function NodeVmsDrawer({ node, onClose }: { node: any; onClose: () => void }) {
  const { data: vms = [], isLoading } = useQuery({
    queryKey: ['admin-node-vms', node.id],
    queryFn: () => adminAPI.getNodeVms(node.id),
  })

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-[600px] max-w-full bg-[#161716] border-l border-[#2a2b2a] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2a]">
          <div>
            <h2 className="font-medium">VMs on {node.name}</h2>
            <p className="text-xs text-[#a0a09e]">Live data from Proxmox</p>
          </div>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? <Skeleton className="h-40" /> : vms.length === 0 ? (
            <p className="text-sm text-[#6a6a68]">No VMs reported by Proxmox.</p>
          ) : (
            <div className="space-y-2">
              {vms.map((vm: any) => (
                <div key={vm.vmid} className="border border-[#2a2b2a] rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-[#e0fe56]">VM {vm.vmid}</div>
                    <Badge variant={vm.status === 'running' ? 'running' : 'stopped'} showDot>{vm.status}</Badge>
                  </div>
                  <div className="text-[#e8e8e6] mt-1">{vm.name}</div>
                  <div className="text-xs text-[#6a6a68] mt-1">
                    CPU: {((vm.cpu || 0) * 100).toFixed(1)}% · MEM: {Math.round((vm.mem || 0) / 1024 / 1024)} MB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
