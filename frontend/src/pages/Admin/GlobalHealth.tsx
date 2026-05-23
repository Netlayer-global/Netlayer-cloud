import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, Server as ServerIcon, RefreshCw } from 'lucide-react'
import { adminHealthAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const TABS = ['Nodes', 'Failed deploys', 'Activity'] as const

export default function GlobalHealth() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Nodes')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'health', 'global'],
    queryFn: () => adminHealthAPI.getGlobal().then((r: any) => r.data.data),
    refetchInterval: 30_000,
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Global health</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Real-time view of node status, failed deploys, and recent platform activity.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className={cn(
            'h-8 px-3 rounded-md text-xs flex items-center gap-1.5 cursor-pointer transition-colors',
            'text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625]'
          )}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {isLoading || !data ? (
        <Card>Loading…</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Online nodes" value={data.nodes.filter((n: any) => n.status === 'ONLINE').length} accent="#4ade80" />
            <Stat label="Failed deploys 24h" value={data.failedDeploys.length} accent={data.failedDeploys.length > 0 ? '#f87171' : undefined} />
            <Stat label="Alerts fired today" value={data.alertsToday} />
            <Stat label="Recent activity" value={data.recentActivity.length} />
          </div>

          <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
            <div className="border-b border-[#2a2b2a] px-3 py-2 flex gap-1">
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

            <div className="p-4">
              {tab === 'Nodes' && <NodesTab nodes={data.nodes} />}
              {tab === 'Failed deploys' && <FailedTab failed={data.failedDeploys} />}
              {tab === 'Activity' && <ActivityTab activity={data.recentActivity} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className="text-2xl font-medium mt-1 tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  )
}

function NodesTab({ nodes }: { nodes: any[] }) {
  if (nodes.length === 0) return <p className="text-sm text-[#6a6a68]">No nodes registered.</p>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {nodes.map((n) => (
        <div key={n.id} className="bg-[#161716] border border-[#2a2b2a] rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-[#e8e8e6]">{n.name}</div>
              <div className="text-xs text-[#a0a09e]">{n.region.flag} {n.region.name}</div>
            </div>
            <span className={cn(
              'h-2 w-2 rounded-full',
              n.status === 'ONLINE' ? 'bg-[#4ade80]' : n.status === 'MAINTENANCE' ? 'bg-amber-400' : 'bg-red-400'
            )} title={n.status} />
          </div>
          <Bar label="CPU" pct={n.cpuPercent} />
          <Bar label="RAM" pct={n.ramPercent} />
          <Bar label="VMs" pct={n.vmPercent} subtitle={`${n.currentVMs}/${n.maxVMs}`} />
        </div>
      ))}
    </div>
  )
}

function Bar({ label, pct, subtitle }: { label: string; pct: number; subtitle?: string }) {
  const color = pct >= 85 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#4ade80'
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px] text-[#a0a09e] mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{subtitle || `${pct}%`}</span>
      </div>
      <div className="h-1 rounded-full bg-[#252625] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  )
}

function FailedTab({ failed }: { failed: any[] }) {
  if (failed.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-10 h-10 rounded-full bg-green-950/40 mx-auto mb-3 flex items-center justify-center text-[#4ade80]">
          ✓
        </div>
        <p className="text-sm text-[#a0a09e]">No failed deploys in the last 24h.</p>
      </div>
    )
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-[#6a6a68]">
          <th className="pb-2">Server</th>
          <th>User</th>
          <th>Region</th>
          <th>Failed at</th>
        </tr>
      </thead>
      <tbody>
        {failed.map((f) => (
          <tr key={f.id} className="border-t border-[#2a2b2a]">
            <td className="py-2 text-[#e8e8e6]">{f.name}</td>
            <td className="py-2 text-[#a0a09e]">{f.user.email}</td>
            <td className="py-2 text-[#a0a09e]">{f.region?.flag} {f.region?.name}</td>
            <td className="py-2 text-xs text-[#6a6a68]">{new Date(f.updatedAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ActivityTab({ activity }: { activity: any[] }) {
  if (activity.length === 0) return <p className="text-sm text-[#6a6a68]">No recent activity.</p>
  return (
    <ul className="space-y-2">
      {activity.map((a) => (
        <li key={a.id} className="flex items-start gap-3 px-3 py-2 rounded-md bg-[#161716] border border-[#2a2b2a]">
          <Activity size={14} className="text-[#a0a09e] mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[#e8e8e6]">{a.action}</div>
            <div className="text-[11px] text-[#6a6a68]">
              {a.user?.email || 'system'} · {a.resource}{a.resourceId ? ` #${a.resourceId.slice(-8)}` : ''}
            </div>
          </div>
          <div className="text-[11px] text-[#6a6a68] whitespace-nowrap">
            {new Date(a.createdAt).toLocaleTimeString()}
          </div>
        </li>
      ))}
    </ul>
  )
}
