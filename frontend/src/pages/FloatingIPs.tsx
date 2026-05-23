import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Plus, Radio, Trash2, Link2, Unlink, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { catalogAPI, floatingIpAPI, serverAPI, type FloatingIp } from '../api/endpoints'
import type { Region, Server } from '../types'
import { cn, formatCurrency } from '../lib/utils'

/**
 * /dashboard/floating-ips — list + allocate + assign + rDNS + release.
 *
 * UX rules (per user spec):
 *   - copy IP button on every row
 *   - region flag chip
 *   - status badge: assigned (green) / unassigned (amber)
 *   - assign modal filtered to servers in same region
 *   - delete only when unassigned
 */
export default function FloatingIPs() {
  const qc = useQueryClient()
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [assignFor, setAssignFor] = useState<FloatingIp | null>(null)
  const [rdnsFor, setRdnsFor] = useState<FloatingIp | null>(null)
  const [deleteFor, setDeleteFor] = useState<FloatingIp | null>(null)

  const { data: ips = [], isLoading } = useQuery({
    queryKey: ['floating-ips'],
    queryFn: () => floatingIpAPI.list().then((r) => r.data.data),
  })

  const totalCost = ips.length * 50
  const assignedCount = ips.filter((f) => f.status === 'assigned').length

  const refresh = () => qc.invalidateQueries({ queryKey: ['floating-ips'] })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Floating IPs</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Reserved public IPs you can re-point at any server in the same region.
          </p>
        </div>
        <Button onClick={() => setAllocateOpen(true)} className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Allocate IP
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total IPs" value={ips.length} />
        <Stat label="Assigned" value={assignedCount} accent="#4ade80" />
        <Stat label="Unassigned" value={ips.length - assignedCount} accent="#f59e0b" />
        <Stat label="Monthly cost" value={`${formatCurrency(totalCost)}/mo`} mono />
      </div>

      {/* Table or empty state */}
      {isLoading ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">
          Loading…
        </div>
      ) : ips.length === 0 ? (
        <EmptyState onAllocate={() => setAllocateOpen(true)} />
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['IP', 'Region', 'Status', 'Assigned to', 'rDNS', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ips.map((fip) => (
                <tr key={fip.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 font-mono text-[13px] text-[#e8e8e6]">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(fip.ip).catch(() => {})
                        toast.success('Copied')
                      }}
                      className="inline-flex items-center gap-2 hover:text-[#e0fe56] cursor-pointer transition-colors"
                    >
                      {fip.ip}
                      <Copy size={11} className="opacity-50" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#a0a09e]">
                    {fip.region.flag} {fip.region.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={fip.status} />
                  </td>
                  <td className="px-4 py-3 text-[#a0a09e]">
                    {fip.server ? (
                      <a href={`/dashboard/servers/${fip.server.id}`} className="text-[#e0fe56] hover:underline">
                        {fip.server.name}
                      </a>
                    ) : (
                      <span className="text-[#6a6a68]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">
                    {fip.rdns || <span className="text-[#6a6a68]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6a6a68] text-xs">
                    {new Date(fip.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {fip.status === 'unassigned' ? (
                        <button
                          type="button"
                          onClick={() => setAssignFor(fip)}
                          title="Assign to server"
                          className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
                        >
                          <Link2 size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unassignMutate(fip)}
                          title="Unassign"
                          className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
                        >
                          <Unlink size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRdnsFor(fip)}
                        title="Set reverse DNS"
                        className="p-1.5 rounded hover:bg-[#252625] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={fip.status === 'assigned'}
                        onClick={() => setDeleteFor(fip)}
                        title="Release"
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          fip.status === 'assigned'
                            ? 'text-[#3a3c3a] cursor-not-allowed'
                            : 'text-red-400 hover:bg-red-950/40 cursor-pointer'
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AllocateModal open={allocateOpen} onClose={() => setAllocateOpen(false)} onSuccess={refresh} />
      <AssignModal fip={assignFor} onClose={() => setAssignFor(null)} onSuccess={refresh} />
      <RdnsModal fip={rdnsFor} onClose={() => setRdnsFor(null)} onSuccess={refresh} />
      <DeleteConfirm fip={deleteFor} onClose={() => setDeleteFor(null)} onSuccess={refresh} />
    </div>
  )

  // Inline mutation helper used by the unassign button — kept outside the
  // main render to avoid passing too many props down.
  function unassignMutate(fip: FloatingIp) {
    floatingIpAPI
      .unassign(fip.id)
      .then(() => {
        toast.success('Unassigned')
        refresh()
      })
      .catch((e: any) => toast.error(e.response?.data?.error || 'Unassign failed'))
  }
}

function Stat({ label, value, accent, mono }: { label: string; value: string | number; accent?: string; mono?: boolean }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div
        className={cn('text-2xl font-medium mt-1 tabular-nums', mono && 'font-mono')}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    assigned: { color: 'text-[#4ade80] bg-green-950/40 border-green-900/60', label: 'Assigned' },
    unassigned: { color: 'text-amber-400 bg-amber-950/40 border-amber-900/60', label: 'Unassigned' },
    releasing: { color: 'text-red-400 bg-red-950/40 border-red-900/60', label: 'Releasing' },
  }
  const cfg = map[status] || map.unassigned
  return (
    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase tracking-wide', cfg.color)}>
      {cfg.label}
    </span>
  )
}

function EmptyState({ onAllocate }: { onAllocate: () => void }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#252625] mx-auto mb-4 flex items-center justify-center">
        <Radio size={20} className="text-[#6a6a68]" />
      </div>
      <h3 className="text-base font-medium text-[#e8e8e6]">No floating IPs</h3>
      <p className="text-sm text-[#a0a09e] mt-1 mb-5 max-w-sm mx-auto">
        Allocate a stable IP that survives server lifecycle and re-point it as you move workloads.
      </p>
      <Button onClick={onAllocate} className="cursor-pointer">
        <Plus size={14} className="mr-1.5" /> Allocate your first IP
      </Button>
    </div>
  )
}

function AllocateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [regionId, setRegionId] = useState('')
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data as Region[]),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: () => floatingIpAPI.create(regionId),
    onSuccess: () => {
      toast.success('Floating IP allocated')
      onSuccess()
      onClose()
      setRegionId('')
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || 'Allocation failed'
      toast.error(msg)
    },
  })

  if (!open) return null

  return (
    <Modal title="Allocate floating IP" onClose={onClose}>
      <Select
        label="Region"
        value={regionId}
        onChange={(e) => setRegionId(e.target.value)}
      >
        <option value="">Choose a region…</option>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.flag} {r.city}, {r.country}
          </option>
        ))}
      </Select>
      <div className="mt-3 px-3 py-2 rounded-md bg-[#161716] border border-[#2a2b2a] text-xs text-[#a0a09e]">
        ₹50 / month · billed daily at ₹1.67/day
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!regionId} onClick={() => create.mutate()} loading={create.isPending}>
          Allocate
        </Button>
      </div>
    </Modal>
  )
}

function AssignModal({ fip, onClose, onSuccess }: { fip: FloatingIp | null; onClose: () => void; onSuccess: () => void }) {
  const [serverId, setServerId] = useState('')
  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data as Server[]),
    enabled: !!fip,
  })

  const eligible = servers.filter((s) => s.region?.id === fip?.region.id && s.status !== 'DELETED')

  const assign = useMutation({
    mutationFn: () => floatingIpAPI.assign(fip!.id, serverId),
    onSuccess: () => {
      toast.success('Assigned')
      onSuccess()
      onClose()
      setServerId('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Assignment failed'),
  })

  if (!fip) return null

  return (
    <Modal title={`Assign ${fip.ip}`} onClose={onClose}>
      <div className="text-xs text-[#a0a09e] mb-3">
        Server must be in the same region: <strong className="text-[#e8e8e6]">{fip.region.flag} {fip.region.name}</strong>
      </div>
      <Select label="Server" value={serverId} onChange={(e) => setServerId(e.target.value)}>
        <option value="">Choose a server…</option>
        {eligible.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.ipv4 ? `(${s.ipv4})` : ''}
          </option>
        ))}
      </Select>
      {eligible.length === 0 && (
        <p className="mt-2 text-xs text-amber-400">
          No servers in this region. Deploy a server in {fip.region.name} first.
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!serverId} onClick={() => assign.mutate()} loading={assign.isPending}>
          Assign
        </Button>
      </div>
    </Modal>
  )
}

function RdnsModal({ fip, onClose, onSuccess }: { fip: FloatingIp | null; onClose: () => void; onSuccess: () => void }) {
  const [rdns, setRdns] = useState(fip?.rdns || '')

  const save = useMutation({
    mutationFn: () => floatingIpAPI.updateRdns(fip!.id, rdns),
    onSuccess: () => {
      toast.success('rDNS updated')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  })

  if (!fip) return null

  return (
    <Modal title={`Reverse DNS for ${fip.ip}`} onClose={onClose}>
      <div className="text-xs text-[#a0a09e] mb-3">
        Set a PTR record for this IP. Useful for outbound mail and bypassing some bot blocklists.
      </div>
      <label className="block text-xs text-[#a0a09e] mb-1.5">FQDN (or empty to clear)</label>
      <Input
        value={rdns}
        onChange={(e) => setRdns(e.target.value)}
        placeholder="mail.example.com"
        className="font-mono"
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
      </div>
    </Modal>
  )
}

function DeleteConfirm({ fip, onClose, onSuccess }: { fip: FloatingIp | null; onClose: () => void; onSuccess: () => void }) {
  const remove = useMutation({
    mutationFn: () => floatingIpAPI.delete(fip!.id),
    onSuccess: () => {
      toast.success('Floating IP released')
      onSuccess()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Release failed'),
  })

  if (!fip) return null

  return (
    <Modal title="Release floating IP" onClose={onClose}>
      <p className="text-sm text-[#a0a09e]">
        This will permanently release <strong className="text-[#e8e8e6] font-mono">{fip.ip}</strong>.
        The IP will go back into the pool and may be reassigned to another customer.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
          Release
        </Button>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">{title}</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
