import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { complianceAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const SEVERITY_COLOR: Record<string, string> = {
  low:      'text-[#a0a09e] bg-[#252625] border-[#2a2b2a]',
  medium:   'text-amber-400 bg-amber-950/40 border-amber-900/60',
  high:     'text-red-400 bg-red-950/40 border-red-900/60',
  critical: 'text-red-200 bg-red-900/60 border-red-700',
}

const STATUS_COLOR: Record<string, string> = {
  open:     'text-amber-400 bg-amber-950/40 border-amber-900/60',
  reported: 'text-[#3d8bff] bg-blue-950/40 border-blue-900/60',
  resolved: 'text-[#4ade80] bg-green-950/40 border-green-900/60',
  closed:   'text-[#6a6a68] bg-[#252625] border-[#2a2b2a]',
}

/**
 * Round 24 — Admin compliance incidents (CERT-In 6h SLA tracker).
 *
 * Top SLA banner shows overdue incidents in red. Below is the full table
 * with status badges and a "report to CERT-In" button that flips status
 * to `reported` and stamps reportedAt.
 */
export default function Compliance() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const sla = useQuery({
    queryKey: ['compliance', 'sla'],
    queryFn: () => complianceAPI.sla().then((r: any) => r.data.data),
    refetchInterval: 60_000,
  })
  const list = useQuery({
    queryKey: ['compliance', 'incidents'],
    queryFn: () => complianceAPI.incidents().then((r: any) => r.data.data),
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['compliance'] })
  }

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => complianceAPI.updateIncident(id, data),
    onSuccess: () => { toast.success('Incident updated'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Compliance</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            CERT-In incident reporting (6-hour SLA from detection). DPDP Act 2023 + IT Act 2000.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" /> Log incident
        </Button>
      </div>

      {/* SLA banner */}
      {sla.data && sla.data.overdue > 0 && (
        <div className="bg-red-950/40 border border-red-700 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-300">SLA breach</div>
            <div className="text-xs text-[#a0a09e] mt-1">
              {sla.data.overdue} incident(s) detected over 6 hours ago and not yet reported to CERT-In.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Open incidents" value={sla.data?.open ?? '—'} tint="text-amber-400" />
        <Stat label="Overdue (>6h)" value={sla.data?.overdue ?? '—'} tint="text-red-400" />
        <Stat label="Reported this month" value={sla.data?.reportedThisMonth ?? '—'} tint="text-[#4ade80]" />
      </div>

      {list.isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : list.data && list.data.length > 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Detected', 'Type', 'Severity', 'Status', 'CERT-In ref', 'Description', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.data.map((inc: any) => (
                <tr key={inc.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">{new Date(inc.detectedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#e8e8e6] capitalize">{inc.type.replace('-', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase', SEVERITY_COLOR[inc.severity])}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase', STATUS_COLOR[inc.status])}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e] font-mono">{inc.certInRef || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e] max-w-md truncate">{inc.description}</td>
                  <td className="px-4 py-3">
                    {inc.status === 'open' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const ref = prompt('CERT-In reference number (leave blank if none yet):')
                          update.mutate({
                            id: inc.id,
                            data: { status: 'reported', certInRef: ref || undefined },
                          })
                        }}
                      >
                        Mark reported
                      </Button>
                    )}
                    {inc.status === 'reported' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => update.mutate({ id: inc.id, data: { status: 'resolved' } })}
                      >
                        Resolve
                      </Button>
                    )}
                    {inc.status === 'resolved' && (
                      <CheckCircle2 size={14} className="text-[#4ade80]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <ShieldAlert size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No incidents yet. That's a good thing.</p>
        </div>
      )}

      <CreateModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function Stat({ label, value, tint }: { label: string; value: number | string; tint: string }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wide text-[#6a6a68]">{label}</div>
      <div className={cn('mt-1 text-2xl font-medium tabular-nums', tint)}>{value}</div>
    </div>
  )
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    type: 'breach' as const,
    severity: 'medium' as const,
    description: '',
  })

  const create = useMutation({
    mutationFn: () => complianceAPI.createIncident(form),
    onSuccess: () => {
      toast.success('Incident logged — clock starts now')
      qc.invalidateQueries({ queryKey: ['compliance'] })
      onClose()
      setForm({ type: 'breach', severity: 'medium', description: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Create failed'),
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#e8e8e6]">Log compliance incident</h3>
          <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">✕</button>
        </div>
        <div className="space-y-3">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
            <option value="breach">Data breach</option>
            <option value="ddos">DDoS attack</option>
            <option value="malware">Malware</option>
            <option value="unauthorized">Unauthorized access</option>
            <option value="data-loss">Data loss</option>
            <option value="other">Other</option>
          </Select>
          <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as any })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#252625] border border-[#333433] text-[#e8e8e6] rounded-md p-2 text-sm focus:border-[#e0fe56] focus:outline-none"
              rows={5}
              placeholder="What happened, when discovered, who/what was affected"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={form.description.length < 10}>
            Log incident
          </Button>
        </div>
      </div>
    </div>
  )
}
