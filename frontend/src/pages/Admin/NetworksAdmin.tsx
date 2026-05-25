import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Network, Radio, Unlink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { adminPlatformAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const TABS = ['Floating IPs', 'VPCs'] as const

export default function NetworksAdmin() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Floating IPs')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform', 'networks'],
    queryFn: () => adminPlatformAPI.networks().then((r: any) => r.data.data),
  })

  const release = useMutation({
    mutationFn: (id: string) => adminPlatformAPI.releaseFloatingIp(id),
    onSuccess: () => {
      toast.success('Floating IP unassigned')
      qc.invalidateQueries({ queryKey: ['admin', 'platform', 'networks'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Networks</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Platform-wide view of every floating IP and VPC across all customers.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Floating IPs" value={data?.floatingIps?.length ?? 0} accent="#e0fe56" />
        <Stat label="Assigned" value={data?.floatingIps?.filter((f: any) => f.status === 'assigned').length ?? 0} accent="#4ade80" />
        <Stat label="Unassigned" value={data?.floatingIps?.filter((f: any) => f.status !== 'assigned').length ?? 0} accent="#fbbf24" />
        <Stat label="VPCs" value={data?.vpcs?.length ?? 0} />
      </div>

      <div className="flex gap-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 px-3 rounded-md text-xs cursor-pointer transition-colors',
              tab === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : tab === 'Floating IPs' ? (
        <FloatingIpsTable items={data?.floatingIps || []} onRelease={(id) => release.mutate(id)} />
      ) : (
        <VpcsTable items={data?.vpcs || []} />
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className="text-2xl font-medium mt-1 tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}

function FloatingIpsTable({ items, onRelease }: { items: any[]; onRelease: (id: string) => void }) {
  if (items.length === 0) {
    return <Card><Radio size={20} className="mx-auto mb-2 text-[#6a6a68]" />No floating IPs allocated yet.</Card>
  }
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161716] text-left">
            {['IP', 'Region', 'Status', 'Owner', 'Server', 'Created', ''].map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.id} className="border-t border-[#2a2b2a]">
              <td className="px-4 py-3 font-mono text-xs text-[#e8e8e6]">{f.ip}</td>
              <td className="px-4 py-3 text-[#a0a09e]">{f.region.flag} {f.region.name}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase tracking-wide',
                  f.status === 'assigned'
                    ? 'text-[#4ade80] bg-green-950/40 border-green-900/60'
                    : 'text-amber-400 bg-amber-950/40 border-amber-900/60'
                )}>
                  {f.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{f.user.email}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{f.server?.name || '—'}</td>
              <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(f.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {f.serverId && (
                  <button
                    onClick={() => onRelease(f.id)}
                    title="Force unassign (admin override)"
                    className="p-1.5 rounded hover:bg-[#252625] text-amber-400 cursor-pointer transition-colors"
                  >
                    <Unlink size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VpcsTable({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <Card><Network size={20} className="mx-auto mb-2 text-[#6a6a68]" />No VPCs created yet.</Card>
  }
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161716] text-left">
            {['Name', 'Region', 'CIDR', 'Owner', 'Members', 'Created'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id} className="border-t border-[#2a2b2a]">
              <td className="px-4 py-3 text-[#e8e8e6] font-medium">{v.name}</td>
              <td className="px-4 py-3 text-[#a0a09e]">{v.region}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{v.cidr}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{v.user.email}</td>
              <td className="px-4 py-3 tabular-nums">{v._count?.members ?? 0}</td>
              <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(v.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
