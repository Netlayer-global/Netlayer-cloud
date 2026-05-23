import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { catalogAPI, ipPoolAPI } from '../../api/endpoints'
import type { Region } from '../../types'
import { cn } from '../../lib/utils'

const cidrUsable = (cidr: string): number => {
  const m = /\/(\d{1,2})$/.exec(cidr)
  if (!m) return 0
  const pfx = parseInt(m[1], 10)
  if (pfx < 16 || pfx > 30) return 0
  return Math.pow(2, 32 - pfx) - 2
}

export default function IpPools() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; cidr: string } | null>(null)

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ['admin', 'ip-pools'],
    queryFn: () => ipPoolAPI.list().then((r: any) => r.data.data),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'ip-pools'] })

  const totals = useMemo(
    () =>
      pools.reduce(
        (acc: any, p: any) => {
          acc.total += p.counts?.total || 0
          acc.available += p.counts?.available || 0
          acc.assigned += p.counts?.assigned || 0
          return acc
        },
        { total: 0, available: 0, assigned: 0 }
      ),
    [pools]
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">IP pools</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Public IPv4 ranges that the allocator hands out at deploy time.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Add pool
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total pools" value={pools.length} />
        <Stat label="Total IPs" value={totals.total} />
        <Stat label="Available" value={totals.available} accent="#4ade80" />
        <Stat label="Assigned" value={totals.assigned} accent="#fbbf24" />
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : pools.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-[#a0a09e] py-8">
            No pools yet. Add one to start allocating IPs.
          </div>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['', 'CIDR', 'Region', 'Gateway', 'Total', 'Avail.', 'Assigned', 'Reserved', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pools.map((pool: any) => (
                <PoolRow
                  key={pool.id}
                  pool={pool}
                  expanded={expanded === pool.id}
                  onToggle={() => setExpanded(expanded === pool.id ? null : pool.id)}
                  onDelete={() => setConfirmDelete({ id: pool.id, cidr: pool.cidr })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreatePoolModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={refresh} />
      <DeleteConfirm
        pool={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onSuccess={() => {
          refresh()
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}

function PoolRow({ pool, expanded, onToggle, onDelete }: { pool: any; expanded: boolean; onToggle: () => void; onDelete: () => void }) {
  const { data: ips, isLoading } = useQuery({
    queryKey: ['admin', 'ip-pools', pool.id, 'ips'],
    queryFn: () => ipPoolAPI.getIps(pool.id).then((r: any) => r.data.data),
    enabled: expanded,
  })

  return (
    <>
      <tr className="border-t border-[#2a2b2a] hover:bg-[#161716]">
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-3 py-3 font-mono text-[13px] text-[#e8e8e6]">{pool.cidr}</td>
        <td className="px-3 py-3 text-[#a0a09e]">
          {pool.region.flag} {pool.region.name}
        </td>
        <td className="px-3 py-3 font-mono text-xs text-[#a0a09e]">{pool.gateway}</td>
        <td className="px-3 py-3 tabular-nums text-[#e8e8e6]">{pool.counts?.total ?? 0}</td>
        <td className="px-3 py-3 tabular-nums text-[#4ade80]">{pool.counts?.available ?? 0}</td>
        <td className="px-3 py-3 tabular-nums text-amber-400">{pool.counts?.assigned ?? 0}</td>
        <td className="px-3 py-3 tabular-nums text-[#a0a09e]">{pool.counts?.reserved ?? 0}</td>
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={(pool.counts?.assigned || 0) + (pool.counts?.reserved || 0) > 0}
            className={cn(
              'p-1.5 rounded transition-colors',
              (pool.counts?.assigned || 0) + (pool.counts?.reserved || 0) > 0
                ? 'text-[#3a3c3a] cursor-not-allowed'
                : 'text-red-400 hover:bg-red-950/40 cursor-pointer'
            )}
            title="Delete pool"
          >
            <Trash2 size={14} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={9} className="px-3 py-0 bg-[#0d0e0d]">
            <div className="border-l-2 border-[#e0fe56]/40 ml-4 pl-4 py-3 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="text-xs text-[#6a6a68]">Loading IPs…</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ips?.map((ip: any) => (
                    <div key={ip.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1e1f1e] border border-[#2a2b2a]">
                      <span className="font-mono text-xs text-[#e8e8e6]">{ip.ip}</span>
                      <StatusDot status={ip.status} />
                      {ip.server && (
                        <span className="text-[10px] text-[#6a6a68] truncate">{ip.server.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'available' ? '#4ade80' : status === 'assigned' ? '#fbbf24' : '#6a6a68'
  return <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} title={status} />
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

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">{children}</div>
}

function CreatePoolModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [regionId, setRegionId] = useState('')
  const [cidr, setCidr] = useState('')
  const [gateway, setGateway] = useState('')

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data as Region[]),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: () => ipPoolAPI.create({ regionId, cidr, gateway }),
    onSuccess: () => {
      toast.success('Pool created')
      onSuccess()
      onClose()
      setRegionId('')
      setCidr('')
      setGateway('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Create failed'),
  })

  if (!open) return null

  const usable = cidrUsable(cidr)

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Add IP pool</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <Select label="Region" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            <option value="">Choose a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.flag} {r.city}, {r.country}
              </option>
            ))}
          </Select>
          <Input
            label="CIDR"
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            placeholder="103.21.200.0/27"
            className="font-mono"
          />
          <Input
            label="Gateway"
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
            placeholder="103.21.200.1"
            className="font-mono"
          />

          {cidr && usable > 0 && (
            <div className="px-3 py-2 rounded-md bg-[#161716] border border-[#2a2b2a] text-xs text-[#a0a09e]">
              This CIDR will create <strong className="text-[#e8e8e6]">{usable}</strong> usable IPs.
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={!regionId || !cidr || !gateway || usable === 0}
          >
            Create pool
          </Button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ pool, onClose, onSuccess }: { pool: { id: string; cidr: string } | null; onClose: () => void; onSuccess: () => void }) {
  const remove = useMutation({
    mutationFn: () => ipPoolAPI.delete(pool!.id),
    onSuccess,
    onError: (e: any) => toast.error(e.response?.data?.error || 'Delete failed'),
  })

  if (!pool) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <h3 className="text-base font-medium text-[#e8e8e6] mb-3">Delete IP pool</h3>
        <p className="text-sm text-[#a0a09e]">
          Pool <code className="text-[#e8e8e6] font-mono">{pool.cidr}</code> will be deleted along with all its IP records.
          This is only allowed when no IPs are assigned.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
            Delete pool
          </Button>
        </div>
      </div>
    </div>
  )
}
