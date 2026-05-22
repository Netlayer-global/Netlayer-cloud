import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Folder,
  Activity,
  Server as ServerIcon,
  Cpu,
  Hexagon,
  Database,
  Network,
  Monitor,
  CreditCard,
  Users,
  Settings,
  RefreshCw,
  Book,
  ExternalLink,
  LifeBuoy,
  ChevronDown,
  Search,
  MoreVertical,
  Shield,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { serverAPI } from '../../api/endpoints'
import { cn, initials } from '../../lib/utils'
import { Badge } from '../ui/Badge'

interface NavItemProps {
  to: string
  icon: any
  label: string
  badge?: React.ReactNode
  end?: boolean
}

function NavItem({ to, icon: Icon, label, badge, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'h-8 rounded-md flex items-center gap-2 px-2 text-[13px] cursor-pointer transition-colors',
          isActive
            ? 'bg-[#1e1f1e] text-[#e8e8e6]'
            : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
        )
      }
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </NavLink>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-4 pb-1.5 text-[11px] uppercase tracking-wider text-[#6a6a68]">
      {children}
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
    staleTime: 30000,
  })

  const serverCount = servers?.filter((s) => s.status !== 'DELETED').length ?? 0

  const handleLogout = async () => {
    try {
      await import('../../api/endpoints').then((m) => m.authAPI.logout())
    } catch {}
    logout()
    navigate('/login')
  }

  const countBadge = (n: number) => (
    <span className="text-[11px] text-[#6a6a68] bg-[#252625] px-1.5 rounded">
      {n}
    </span>
  )

  return (
    <aside className="w-[220px] shrink-0 bg-[#0d0e0d] border-r border-[#2a2b2a] flex flex-col h-screen sticky top-0">
      {/* Top section */}
      <div className="border-b border-[#2a2b2a] p-2 space-y-1">
        <button className="w-full h-9 px-2 flex items-center gap-2 rounded-md hover:bg-[#1e1f1e] cursor-pointer transition-colors">
          <div className="w-6 h-6 bg-[#e0fe56] text-[#0d0e0d] rounded-md flex items-center justify-center text-xs font-bold shrink-0">
            N
          </div>
          <span className="flex-1 text-left text-[13px] font-medium text-[#e8e8e6] truncate">
            NetLayer
          </span>
          <ChevronDown size={14} className="text-[#6a6a68]" />
        </button>

        <button className="w-full h-8 px-2 flex items-center gap-2 rounded-md bg-[#1e1f1e] hover:bg-[#252625] cursor-pointer transition-colors">
          <Search size={14} className="text-[#6a6a68]" />
          <span className="flex-1 text-left text-[13px] text-[#6a6a68]">Search…</span>
          <kbd className="text-[10px] text-[#6a6a68] bg-[#0d0e0d] px-1.5 py-0.5 rounded border border-[#2a2b2a]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem to="/dashboard/home" icon={LayoutDashboard} label="Home" />
        <NavItem to="/dashboard/projects" icon={Folder} label="Projects" />
        <NavItem to="/dashboard/activity" icon={Activity} label="Activity" />

        <SectionLabel>Project: production</SectionLabel>
        <NavItem
          to="/dashboard/servers"
          icon={ServerIcon}
          label="Servers"
          badge={countBadge(serverCount)}
        />
        <NavItem to="/dashboard/vms" icon={Cpu} label="Virtual machines" badge={countBadge(0)} />
        <NavItem
          to="/dashboard/k8s"
          icon={Hexagon}
          label="Kubernetes"
          badge={<Badge variant="preview">Preview</Badge>}
        />
        <NavItem to="/dashboard/storage" icon={Database} label="Storage" />
        <NavItem to="/dashboard/network" icon={Network} label="Network" />
        <NavItem to="/dashboard/gpu" icon={Monitor} label="GPU instances" />

        <SectionLabel>Account</SectionLabel>
        <NavItem to="/dashboard/billing" icon={CreditCard} label="Usage & billing" />
        <NavItem to="/dashboard/team" icon={Users} label="Team settings" />
        <NavItem to="/dashboard/ssh-keys" icon={Shield} label="SSH keys" />
        <NavItem to="/dashboard/settings" icon={Settings} label="Settings" />

        {user?.role && ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING'].includes(user.role) && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <NavLink
              to="/admin/dashboard"
              className="h-8 rounded-md flex items-center gap-2 px-2 text-[13px] cursor-pointer transition-colors text-red-400 hover:bg-red-950/20"
            >
              <Shield size={16} className="shrink-0" />
              <span className="flex-1 truncate">Admin panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#2a2b2a] p-2 space-y-0.5">
        <button className="w-full h-8 px-2 flex items-center gap-2 rounded-md text-[13px] text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6] cursor-pointer transition-colors">
          <RefreshCw size={16} />
          <span className="flex-1 text-left">Changelog</span>
        </button>
        <a
          href="https://docs.netlayer.com"
          target="_blank"
          rel="noreferrer"
          className="w-full h-8 px-2 flex items-center gap-2 rounded-md text-[13px] text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
        >
          <Book size={16} />
          <span className="flex-1 text-left">Documentation</span>
          <ExternalLink size={12} className="text-[#6a6a68]" />
        </a>
        <button className="w-full h-8 px-2 flex items-center gap-2 rounded-md text-[13px] text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6] cursor-pointer transition-colors">
          <LifeBuoy size={16} />
          <span className="flex-1 text-left">Support</span>
        </button>

        <div className="border-t border-[#2a2b2a] mt-2 pt-2">
          <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#1e1f1e] transition-colors group">
            <div className="w-7 h-7 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-[11px] font-medium shrink-0">
              {initials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[#e8e8e6] truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-[#6a6a68] truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
