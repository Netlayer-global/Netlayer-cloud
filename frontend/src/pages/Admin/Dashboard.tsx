import { useQuery } from '@tanstack/react-query'
import {
  Users as UsersIcon,
  Server as ServerIcon,
  CreditCard,
  MessageSquare,
  HardDrive,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { adminAPI } from '../../api/admin'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency, relativeTime, initials } from '../../lib/utils'

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats(),
    refetchInterval: 30000,
  })
  const { data: chart = [], isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue', '30d'],
    queryFn: () => adminAPI.revenueChart('30d'),
  })
  const { data: activity = [], isLoading: actLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminAPI.activityFeed(),
    refetchInterval: 15000,
  })
  const { data: nodes = [] } = useQuery({
    queryKey: ['admin-nodes'],
    queryFn: () => adminAPI.listNodes(),
  })

  const statCards = [
    { icon: UsersIcon, label: 'Total users', value: stats?.users.total ?? '—', sub: `+${stats?.users.newThisMonth ?? 0} this month` },
    { icon: ServerIcon, label: 'Active servers', value: stats?.servers.running ?? '—', sub: `${stats?.servers.total ?? 0} total` },
    { icon: CreditCard, label: 'Today', value: stats ? formatCurrency(stats.revenue.today) : '—', sub: 'revenue' },
    { icon: TrendingUp, label: 'This month', value: stats ? formatCurrency(stats.revenue.thisMonth) : '—', sub: `vs ${stats ? formatCurrency(stats.revenue.lastMonth) : '—'} last` },
    { icon: MessageSquare, label: 'Open tickets', value: stats?.tickets.open ?? '—', sub: `${stats?.tickets.inProgress ?? 0} in progress` },
    { icon: HardDrive, label: 'Nodes online', value: `${stats?.nodes.online ?? 0}/${stats?.nodes.total ?? 0}`, sub: `${stats?.nodes.degraded ?? 0} degraded` },
  ]

  const pieData = stats
    ? [
        { name: 'Running', value: stats.servers.running, fill: '#4ade80' },
        { name: 'Stopped', value: stats.servers.stopped, fill: '#6a6a68' },
        { name: 'Building', value: stats.servers.building, fill: '#fbbf24' },
        { name: 'Error', value: stats.servers.error, fill: '#f87171' },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Overview</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Platform health, revenue, and activity at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((s) =>
          statsLoading ? (
            <Card key={s.label}><Skeleton className="h-16" /></Card>
          ) : (
            <Card key={s.label}>
              <div className="flex items-center gap-2 text-xs text-[#6a6a68] uppercase tracking-wide mb-2">
                <s.icon size={12} />
                {s.label}
              </div>
              <div className="text-xl font-medium text-[#e8e8e6]">{s.value}</div>
              <div className="text-[11px] text-[#6a6a68] mt-1 truncate">{s.sub}</div>
            </Card>
          )
        )}
      </div>

      {/* Revenue chart */}
      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#e8e8e6]">Revenue (last 30 days)</h3>
        </div>
        {chartLoading ? (
          <Skeleton className="h-56" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0fe56" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e0fe56" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2b2a" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#6a6a68" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#6a6a68" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#e0fe56" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Two columns: activity + server donut */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card padding="p-5" className="lg:col-span-2">
          <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Recent activity</h3>
          {actLoading ? (
            <Skeleton className="h-40" />
          ) : activity.length === 0 ? (
            <p className="text-sm text-[#6a6a68]">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 py-1.5">
                  {log.user ? (
                    <div className="w-7 h-7 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-[11px] font-medium shrink-0">
                      {initials(log.user.firstName, log.user.lastName)}
                    </div>
                  ) : (
                    <div className="w-7 h-7 bg-[#252625] rounded-full" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e8e8e6] truncate">
                      <span className="font-mono text-[11px] text-[#e0fe56]">{log.action}</span>
                      <span className="text-[#6a6a68] mx-2">·</span>
                      <span className="text-[#a0a09e]">{log.user?.email || 'system'}</span>
                    </div>
                    <div className="text-[11px] text-[#6a6a68]">
                      {log.resource} {log.resourceId ? `· ${log.resourceId.slice(-8)}` : ''}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#6a6a68] shrink-0">{relativeTime(log.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="p-5">
          <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Server status</h3>
          {statsLoading ? (
            <Skeleton className="h-40" />
          ) : pieData.length === 0 ? (
            <p className="text-sm text-[#6a6a68]">No servers yet.</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={70}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-3">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#a0a09e]">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      {d.name}
                    </span>
                    <span className="text-[#e8e8e6]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Node health */}
      <Card padding="p-5">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Node health</h3>
        {nodes.length === 0 ? (
          <p className="text-sm text-[#6a6a68]">No nodes configured.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nodes.map((n: any) => {
              const cpuPct = n.totalCpu > 0 ? (n.usedCpu / n.totalCpu) * 100 : 0
              const ramPct = n.totalRamGB > 0 ? (n.usedRamGB / n.totalRamGB) * 100 : 0
              return (
                <div key={n.id} className="p-3 rounded-md border border-[#2a2b2a] bg-[#161716]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm text-[#e8e8e6]">{n.name}</div>
                    <Badge
                      variant={n.status === 'ONLINE' ? 'running' : n.status === 'OFFLINE' ? 'error' : 'pending'}
                      showDot
                    >
                      {n.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#6a6a68] mb-2">{n.region?.flag} {n.region?.city}</div>
                  <div className="space-y-1.5">
                    <MiniBar label="CPU" pct={cpuPct} />
                    <MiniBar label="RAM" pct={ramPct} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function MiniBar({ label, pct }: { label: string; pct: number }) {
  const color = pct > 80 ? '#f87171' : pct > 60 ? '#fbbf24' : '#4ade80'
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-[#a0a09e]">{label}</span>
        <span className="text-[#6a6a68]">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-[#0d0e0d] rounded overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  )
}
