import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Server as ServerIcon,
  Cpu,
  CreditCard,
  Activity,
  Plus,
  Folder,
  Monitor,
  Key,
  Mail,
  TrendingUp,
  Terminal,
  MoreHorizontal,
} from 'lucide-react'
import { serverAPI, billingAPI } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { formatCurrency, relativeTime } from '../lib/utils'

const statusToBadge = (status: string) => {
  const map: Record<string, any> = {
    RUNNING: 'running',
    STOPPED: 'stopped',
    BUILDING: 'building',
    PENDING: 'pending',
    ERROR: 'error',
    DELETING: 'pending',
    REBOOTING: 'building',
  }
  return map[status] || 'default'
}

export default function Home() {
  const { user } = useAuthStore()

  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
  })

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => billingAPI.getUsage().then((r) => r.data.data),
  })

  const activeServers = servers?.filter((s) => s.status !== 'DELETED') || []
  const totalBandwidth =
    activeServers.reduce((sum, s) => sum + (s.bandwidth?.used || 0), 0) / 1024

  const stats = [
    { icon: ServerIcon, label: 'Servers', value: activeServers.length, change: '+2 this month' },
    { icon: Cpu, label: 'Virtual machines', value: 0, change: '—' },
    { icon: CreditCard, label: 'Monthly cost', value: formatCurrency(usage?.total || 0), change: 'estimate' },
    { icon: Activity, label: 'Bandwidth', value: `${totalBandwidth.toFixed(1)} TB`, change: 'this month' },
  ]

  const projects = [
    { name: 'production', env: 'production', servers: activeServers.filter((s) => s.status === 'RUNNING').length, region: 'Mumbai' },
    { name: 'development', env: 'development', servers: 0, region: 'Frankfurt' },
    { name: 'staging', env: 'staging', servers: 0, region: 'Singapore' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Email verification banner */}
      {user && !user.emailVerified && (
        <div className="border-l-2 border-amber-400 bg-amber-950/20 rounded-md p-3 flex items-center gap-3">
          <Mail size={16} className="text-amber-400" />
          <span className="text-sm text-[#e8e8e6] flex-1">
            Verify your email to unlock all features.
          </span>
          <button className="text-xs text-amber-400 hover:underline cursor-pointer">
            Resend verification
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Overview</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Welcome back, {user?.firstName}. Here's what's happening with your infrastructure.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) =>
          serversLoading || usageLoading ? (
            <Card key={s.label}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ) : (
            <Card key={s.label}>
              <div className="flex items-center gap-2 text-xs text-[#6a6a68] mb-2">
                <s.icon size={14} />
                <span className="uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="text-2xl font-medium text-[#e8e8e6]">{s.value}</div>
              <div className="text-xs text-[#6a6a68] mt-1 flex items-center gap-1">
                <TrendingUp size={12} />
                {s.change}
              </div>
            </Card>
          )
        )}
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-base font-medium text-[#e8e8e6] mb-3">Projects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.name} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder size={16} className="text-[#a0a09e]" />
                  <span className="font-medium text-[#e8e8e6]">{p.name}</span>
                </div>
                <Badge variant={p.env as any} showDot>{p.env}</Badge>
              </div>
              <div className="text-xs text-[#6a6a68] space-y-0.5">
                <div>{p.servers} server{p.servers !== 1 ? 's' : ''} · {p.region}</div>
              </div>
            </Card>
          ))}
          <Link to="/dashboard/deploy" className="block">
            <div className="border border-dashed border-[#333433] rounded-lg p-4 hover:border-[#e0fe56]/40 transition-colors cursor-pointer h-full flex items-center justify-center text-[#6a6a68] hover:text-[#e8e8e6]">
              <Plus size={16} className="mr-2" /> New project
            </div>
          </Link>
        </div>
      </div>

      {/* Recent servers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-[#e8e8e6]">Recent servers</h2>
          <Link to="/dashboard/servers" className="text-xs text-[#a0a09e] hover:text-[#e8e8e6]">
            View all →
          </Link>
        </div>
        {serversLoading ? (
          <Card>
            <Skeleton className="h-20" />
          </Card>
        ) : activeServers.length === 0 ? (
          <Card padding="p-8" className="text-center">
            <ServerIcon size={28} className="text-[#6a6a68] mx-auto mb-3" />
            <p className="text-sm text-[#a0a09e] mb-4">No servers yet. Deploy your first one.</p>
            <Link to="/dashboard/deploy">
              <Button size="sm">Deploy server</Button>
            </Link>
          </Card>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Location</TH>
                <TH>Plan</TH>
                <TH>Status</TH>
                <TH className="text-right pr-4">Created</TH>
                <TH className="w-12"></TH>
              </tr>
            </THead>
            <TBody>
              {activeServers.slice(0, 5).map((s) => (
                <Link key={s.id} to={`/dashboard/servers/${s.id}`} className="contents">
                  <TR className="cursor-pointer">
                    <TD>
                      <div className="text-[#e8e8e6] font-medium">{s.name}</div>
                      <div className="text-xs text-[#6a6a68]">{s.ipv4 || s.hostname}</div>
                    </TD>
                    <TD>{s.region.flag} {s.region.city}</TD>
                    <TD>{s.plan.name}</TD>
                    <TD>
                      <Badge variant={statusToBadge(s.status)} showDot>
                        {s.status.toLowerCase()}
                      </Badge>
                    </TD>
                    <TD className="text-right pr-4 text-xs">{relativeTime(s.createdAt)}</TD>
                    <TD className="text-right pr-4">
                      <button
                        className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </TD>
                  </TR>
                </Link>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-medium text-[#e8e8e6] mb-3">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/dashboard/deploy">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#e0fe56]/10 text-[#e0fe56] flex items-center justify-center">
                <ServerIcon size={16} />
              </div>
              <div>
                <div className="font-medium text-[#e8e8e6] text-sm">Deploy server</div>
                <div className="text-xs text-[#6a6a68]">Provision in 60 seconds</div>
              </div>
            </Card>
          </Link>
          <Link to="/dashboard/gpu">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Monitor size={16} />
              </div>
              <div>
                <div className="font-medium text-[#e8e8e6] text-sm">Deploy GPU</div>
                <div className="text-xs text-[#6a6a68]">Coming soon</div>
              </div>
            </Card>
          </Link>
          <Link to="/dashboard/ssh-keys">
            <Card hover className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Key size={16} />
              </div>
              <div>
                <div className="font-medium text-[#e8e8e6] text-sm">SSH keys</div>
                <div className="text-xs text-[#6a6a68]">Manage your access</div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
