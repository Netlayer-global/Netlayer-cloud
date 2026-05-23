import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  BarChart3, Server as ServerIcon, Database, HardDrive, Network, AlertCircle, CheckCircle2,
} from 'lucide-react'

import { monitoringAPI, type MonitoringPoint } from '../api/infra'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { cn, formatBytes } from '../lib/utils'

type Range = '1h' | '6h' | '24h' | '7d' | '30d'
const RANGES: Range[] = ['1h', '6h', '24h', '7d', '30d']

export default function Monitoring() {
  const [range, setRange] = useState<Range>('24h')

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['monitoring', 'overview'],
    queryFn: () => monitoringAPI.overview().then((r) => r.data.data),
    refetchInterval: 30_000,
  })

  const { data: aggregate, isLoading: aggLoading } = useQuery({
    queryKey: ['monitoring', 'aggregate', range],
    queryFn: () => monitoringAPI.aggregate(range).then((r) => r.data.data),
    refetchInterval: 30_000,
  })

  const totals = overview?.totals
  const points: MonitoringPoint[] = aggregate?.points ?? []

  const fmtTime = (t: number) => {
    const d = new Date(t)
    if (range === '1h' || range === '6h' || range === '24h') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Monitoring</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Real-time overview across all your infrastructure.
        </p>
      </div>

      {/* Resource summary tiles */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResourceTile
            icon={ServerIcon}
            label="Servers"
            value={totals.servers}
            sub={`${totals.running} running, ${totals.stopped} stopped`}
            tint="text-[#4a9eff]"
            warn={totals.error > 0 ? `${totals.error} in error` : undefined}
          />
          <ResourceTile
            icon={HardDrive}
            label="Block volumes"
            value={totals.volumes}
            tint="text-[#3dd68c]"
          />
          <ResourceTile
            icon={Database}
            label="Databases"
            value={totals.databases}
            tint="text-[#f0a429]"
          />
          <ResourceTile
            icon={Network}
            label="Load balancers"
            value={totals.loadBalancers}
            tint="text-[#8b6fff]"
          />
        </div>
      )}

      {/* Region distribution + status breakdown */}
      {overview && totals && totals.servers > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card padding="p-4">
            <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Status breakdown</h3>
            <div className="space-y-2">
              <StatusBar label="Running" count={totals.running} total={totals.servers} color="#3dd68c" />
              <StatusBar label="Stopped" count={totals.stopped} total={totals.servers} color="#6a6a68" />
              <StatusBar label="Building" count={totals.building} total={totals.servers} color="#f0a429" />
              {totals.error > 0 && (
                <StatusBar label="Error" count={totals.error} total={totals.servers} color="#f26666" />
              )}
            </div>
          </Card>

          <Card padding="p-4">
            <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">By region</h3>
            <div className="space-y-2">
              {overview.byRegion.length === 0 ? (
                <div className="text-xs text-[#6a6a68]">No active servers.</div>
              ) : (
                overview.byRegion.map((r) => (
                  <div key={r.slug} className="flex items-center gap-2 text-xs">
                    <span className="text-base">{r.flag}</span>
                    <span className="text-[#e8e8e6] flex-1 truncate">{r.city}</span>
                    <span className="text-[#6a6a68] uppercase font-mono text-[10px]">{r.slug}</span>
                    <span className="text-[#e8e8e6] font-medium w-6 text-right">{r.count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Range selector + charts */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-[#e8e8e6]">Aggregate metrics</h3>
          <div className="flex gap-1 bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-2.5 h-7 text-xs cursor-pointer rounded transition-colors',
                  range === r ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {aggLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : !aggregate || aggregate.serverCount === 0 ? (
          <Card padding="p-10" className="text-center">
            <BarChart3 size={28} className="text-[#6a6a68] mx-auto mb-3" />
            <h3 className="font-medium text-[#e8e8e6] mb-1">No metrics yet</h3>
            <p className="text-sm text-[#a0a09e]">
              Deploy a server to see real-time CPU, RAM, and network charts here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="CPU usage" subtitle="Average across all servers (%)" color="#e0fe56">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e0fe56" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#e0fe56" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2a2b2a" />
                  <XAxis dataKey="t" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" />
                  <YAxis tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" />
                  <Tooltip
                    contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }}
                    labelFormatter={(t) => new Date(t as number).toLocaleString()}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#e0fe56" strokeWidth={1.5} fill="url(#cpuFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Memory usage" subtitle="Average across all servers (%)" color="#4a9eff">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="ramFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a9eff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#4a9eff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2a2b2a" />
                  <XAxis dataKey="t" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" />
                  <YAxis tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" />
                  <Tooltip
                    contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }}
                    labelFormatter={(t) => new Date(t as number).toLocaleString()}
                  />
                  <Area type="monotone" dataKey="ram" stroke="#4a9eff" strokeWidth={1.5} fill="url(#ramFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <Card padding="p-4" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-[#e8e8e6]">Network throughput</h4>
                  <p className="text-[11px] text-[#6a6a68]">Sum across all servers (bytes/sec)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#a0a09e]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3dd68c]" /> In</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f26666]" /> Out</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={points}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2a2b2a" />
                  <XAxis dataKey="t" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" />
                  <YAxis tick={{ fontSize: 10, fill: '#6a6a68' }} stroke="#2a2b2a" tickFormatter={(v) => formatBytes(v)} />
                  <Tooltip
                    contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }}
                    labelFormatter={(t) => new Date(t as number).toLocaleString()}
                    formatter={(v: any) => formatBytes(v as number) + '/s'}
                  />
                  <Line type="monotone" dataKey="netIn" stroke="#3dd68c" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="netOut" stroke="#f26666" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function ResourceTile({
  icon: Icon, label, value, sub, tint, warn,
}: {
  icon: any; label: string; value: number; sub?: string; tint: string; warn?: string
}) {
  return (
    <Card padding="p-3">
      <div className="flex items-center justify-between">
        <Icon size={14} className={tint} />
        {warn ? (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <AlertCircle size={10} /> {warn}
          </span>
        ) : value > 0 ? (
          <CheckCircle2 size={11} className="text-emerald-400" />
        ) : null}
      </div>
      <div className="text-[11px] text-[#6a6a68] mt-2">{label}</div>
      <div className="text-xl font-medium text-[#e8e8e6]">{value}</div>
      {sub && <div className="text-[11px] text-[#6a6a68] truncate">{sub}</div>}
    </Card>
  )
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : (count / total) * 100
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#a0a09e]">{label}</span>
        <span className="text-[#e8e8e6]">{count} <span className="text-[#6a6a68]">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-1.5 bg-[#1e1f1e] rounded overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ChartCard({
  title, subtitle, children,
}: { title: string; subtitle: string; color: string; children: React.ReactNode }) {
  return (
    <Card padding="p-4">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-[#e8e8e6]">{title}</h4>
        <p className="text-[11px] text-[#6a6a68]">{subtitle}</p>
      </div>
      {children}
    </Card>
  )
}

// Suppress unused import — consumed via type
export const _ = Badge
