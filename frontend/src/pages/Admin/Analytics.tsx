import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Server as ServerIcon, IndianRupee } from 'lucide-react'
import { analyticsAPI } from '../../api/endpoints'
import { formatCurrency, cn } from '../../lib/utils'

/**
 * Round 24 — Admin revenue / MRR / churn dashboard.
 *
 * 4 KPI cards on top, then daily revenue snapshot table + cohort
 * retention table + region profitability table.
 */
export default function Analytics() {
  const revenue = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsAPI.revenue().then((r: any) => r.data.data),
  })
  const customers = useQuery({
    queryKey: ['analytics', 'customers'],
    queryFn: () => analyticsAPI.customers().then((r: any) => r.data.data),
  })
  const cohorts = useQuery({
    queryKey: ['analytics', 'cohorts'],
    queryFn: () => analyticsAPI.cohorts().then((r: any) => r.data.data),
  })
  const profit = useQuery({
    queryKey: ['analytics', 'profitability'],
    queryFn: () => analyticsAPI.profitability().then((r: any) => r.data.data),
  })

  const r = revenue.data
  const c = customers.data

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Analytics</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Revenue, customer growth, retention, and per-region profitability. Updated daily.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi
          icon={<IndianRupee size={14} />}
          label="MRR (live)"
          value={r ? formatCurrency(r.liveMrr) : '—'}
          sub={r ? `ARR ${formatCurrency(r.liveArr)}` : ''}
          tint="text-[#e0fe56]"
        />
        <Kpi
          icon={<TrendingUp size={14} />}
          label="Today's revenue"
          value={r ? formatCurrency(r.todayRevenue) : '—'}
          sub="paid invoices"
          tint="text-[#4ade80]"
        />
        <Kpi
          icon={<Users size={14} />}
          label="Active customers"
          value={c ? c.active.toLocaleString('en-IN') : '—'}
          sub={c ? `${c.newThisMonth} new this month` : ''}
          tint="text-[#3d8bff]"
        />
        <Kpi
          icon={<ServerIcon size={14} />}
          label="30-day churn"
          value={c ? `${c.churnRatePct}%` : '—'}
          sub={c ? `${c.churned30d} customers` : ''}
          tint="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title={`Daily snapshots (${r?.snapshots?.length || 0})`}>
          {r?.snapshots && r.snapshots.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-[#161716] sticky top-0">
                <tr>
                  {['Date', 'Net rev', 'New', 'MRR'].map((h) => (
                    <th key={h} className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wide text-[#6a6a68]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.snapshots.slice(-30).reverse().map((s: any) => (
                  <tr key={s.id} className="border-t border-[#2a2b2a]">
                    <td className="px-2.5 py-1.5 text-[#a0a09e]">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="px-2.5 py-1.5 text-[#e8e8e6] tabular-nums">{formatCurrency(s.netRevenue)}</td>
                    <td className="px-2.5 py-1.5 text-[#a0a09e] tabular-nums">{s.newCustomers}</td>
                    <td className="px-2.5 py-1.5 text-[#a0a09e] tabular-nums">{formatCurrency(s.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-[#6a6a68] p-3 text-center">No snapshots yet — they accrue daily at 00:30 UTC.</div>
          )}
        </Card>

        <Card title="Cohort retention">
          {cohorts.data && cohorts.data.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-[#161716] sticky top-0">
                <tr>
                  {['Cohort', 'Signups', 'Active', 'Retention'].map((h) => (
                    <th key={h} className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wide text-[#6a6a68]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.data.map((co: any) => (
                  <tr key={co.month} className="border-t border-[#2a2b2a]">
                    <td className="px-2.5 py-1.5 text-[#a0a09e] font-mono">{co.month}</td>
                    <td className="px-2.5 py-1.5 text-[#e8e8e6] tabular-nums">{co.signups}</td>
                    <td className="px-2.5 py-1.5 text-[#a0a09e] tabular-nums">{co.retained}</td>
                    <td className="px-2.5 py-1.5 tabular-nums">
                      <span className={cn(
                        co.retentionPct >= 60 ? 'text-[#4ade80]' :
                        co.retentionPct >= 30 ? 'text-amber-400' :
                        'text-red-400'
                      )}>{co.retentionPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-[#6a6a68] p-3 text-center">No data yet.</div>
          )}
        </Card>

        <Card title="Region profitability" className="lg:col-span-2">
          {profit.data && profit.data.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-[#161716]">
                <tr>
                  {['Region', 'Servers', 'Revenue', 'Cost', 'Margin', 'Margin %'].map((h) => (
                    <th key={h} className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wide text-[#6a6a68]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profit.data.map((p: any) => (
                  <tr key={p.regionId} className="border-t border-[#2a2b2a]">
                    <td className="px-2.5 py-1.5 text-[#e8e8e6]">{p.region}</td>
                    <td className="px-2.5 py-1.5 text-[#a0a09e] tabular-nums">{p.servers}</td>
                    <td className="px-2.5 py-1.5 text-[#a0a09e] tabular-nums">{formatCurrency(p.monthlyRevenue)}</td>
                    <td className="px-2.5 py-1.5 text-[#6a6a68] tabular-nums">{formatCurrency(p.monthlyCost)}</td>
                    <td className="px-2.5 py-1.5 text-[#e0fe56] tabular-nums">{formatCurrency(p.monthlyMargin)}</td>
                    <td className="px-2.5 py-1.5 tabular-nums">
                      <span className={cn(
                        p.marginPct >= 50 ? 'text-[#4ade80]' :
                        p.marginPct >= 20 ? 'text-amber-400' :
                        'text-red-400'
                      )}>{p.marginPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-[#6a6a68] p-3 text-center">No data yet.</div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, sub, tint }: { icon: React.ReactNode; label: string; value: string; sub: string; tint: string }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className={cn('flex items-center gap-1.5 text-[11px] uppercase tracking-wide', tint)}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-xl font-medium text-[#e8e8e6]">{value}</div>
      <div className="mt-0.5 text-[11px] text-[#6a6a68]">{sub}</div>
    </div>
  )
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-2.5 border-b border-[#2a2b2a] text-[11px] uppercase tracking-wide text-[#6a6a68]">{title}</div>
      <div className="max-h-[400px] overflow-y-auto">{children}</div>
    </div>
  )
}
