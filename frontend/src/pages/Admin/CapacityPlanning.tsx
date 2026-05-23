import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Plus, Server } from 'lucide-react'
import { Link } from 'react-router-dom'
import { capacityAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const barColor = (pct: number) => (pct >= 85 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#4ade80')

export default function CapacityPlanning() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'capacity'],
    queryFn: () => capacityAPI.getReport().then((r: any) => r.data.data),
    refetchInterval: 60_000,
  })

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">
          Loading capacity report…
        </div>
      </div>
    )
  }

  const warning = data.regions.filter((r: any) => r.status === 'warning' || r.status === 'critical')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Capacity planning</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Per-region utilisation and growth-rate projection. Refreshed every 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total regions" value={data.totalRegions} />
        <Stat label="Total nodes" value={data.totalNodes} />
        <Stat label="Active VMs" value={`${data.currentVMs} / ${data.totalVMs}`} mono />
        <Stat label="Avg utilisation" value={`${data.averageUtilization}%`} accent={barColor(data.averageUtilization)} />
      </div>

      {warning.length > 0 && (
        <div className="mb-6 space-y-2">
          {warning.map((r: any) => (
            <div
              key={r.regionId}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border',
                r.status === 'critical'
                  ? 'border-red-900/60 bg-red-950/30 text-red-300'
                  : 'border-amber-900/60 bg-amber-950/20 text-amber-300'
              )}
            >
              <AlertTriangle size={16} />
              <span className="text-sm flex-1">{r.recommendation}</span>
              <Link
                to={`/admin/nodes`}
                className="text-xs underline hover:no-underline whitespace-nowrap cursor-pointer"
              >
                Add node →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#161716] text-left">
              {['Region', 'CPU', 'RAM', 'Disk', 'VMs', 'Growth/day', 'Days until full', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.regions.map((r: any) => (
              <tr key={r.regionId} className="border-t border-[#2a2b2a]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{r.flag}</span>
                    <div>
                      <div className="text-[#e8e8e6] font-medium">{r.regionName}</div>
                      <div className="text-[10px] text-[#6a6a68]">{r.countryCode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Bar value={r.cpuPercent} /></td>
                <td className="px-4 py-3"><Bar value={r.ramPercent} /></td>
                <td className="px-4 py-3"><Bar value={r.diskPercent} /></td>
                <td className="px-4 py-3 tabular-nums text-[#a0a09e]">
                  {r.currentVMs} / {r.maxVMs}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#a0a09e]">
                  {r.growthPerDay > 0 ? `+${r.growthPerDay.toFixed(1)}` : '—'}
                </td>
                <td className={cn(
                  'px-4 py-3 tabular-nums',
                  r.daysUntilFull && r.daysUntilFull < 14 ? 'text-amber-400' :
                  r.daysUntilFull && r.daysUntilFull < 7  ? 'text-red-400' :
                  'text-[#a0a09e]'
                )}>
                  {r.daysUntilFull ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/admin/nodes"
                    className="inline-flex items-center gap-1 text-xs text-[#a0a09e] hover:text-[#e0fe56] transition-colors cursor-pointer"
                  >
                    <Plus size={11} /> Node
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, accent, mono }: { label: string; value: string | number; accent?: string; mono?: boolean }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className={cn('text-2xl font-medium mt-1 tabular-nums', mono && 'font-mono')} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-[#252625] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${Math.min(100, value)}%`, background: barColor(value) }}
        />
      </div>
      <span className="tabular-nums text-xs text-[#a0a09e] w-9 text-right">{value}%</span>
    </div>
  )
}
