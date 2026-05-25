import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Server as ServerIcon,
  HardDrive,
  CreditCard,
  MessageSquare,
  Plug,
  Shield,
  Megaphone,
  FileText,
  Settings,
  ArrowLeft,
  ShieldAlert,
  LogOut,
  GitBranch,
  Activity,
  Globe,
  BarChart,
  Mail,
  Tag,
  Disc3,
  Network,
  Database as DatabaseIcon,
  Boxes,
  FileMinus,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api/endpoints'
import { cn, initials } from '../../lib/utils'
import { useSocket } from '../../hooks/useSocket'

interface NavItem {
  to: string
  icon: any
  label: string
  roles: string[]
}

const NAV: NavItem[] = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Overview',      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING'] },
  { to: '/admin/users',         icon: Users,           label: 'Users',         roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING'] },
  { to: '/admin/servers',       icon: ServerIcon,      label: 'Servers',       roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
  { to: '/admin/nodes',         icon: HardDrive,       label: 'Nodes',         roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/ip-pools',      icon: Globe,           label: 'IP pools',      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/iso',           icon: Disc3,           label: 'ISO library',   roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/capacity',      icon: BarChart,        label: 'Capacity',      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/health',        icon: Activity,        label: 'Global health', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/billing',       icon: CreditCard,      label: 'Billing',       roles: ['SUPER_ADMIN', 'ADMIN', 'BILLING'] },
  { to: '/admin/credit-notes',  icon: FileMinus,       label: 'Credit notes',  roles: ['SUPER_ADMIN', 'ADMIN', 'BILLING'] },
  { to: '/admin/gstr1',         icon: Receipt,         label: 'GSTR-1 export', roles: ['SUPER_ADMIN', 'ADMIN', 'BILLING'] },
  { to: '/admin/promos',        icon: Tag,             label: 'Promo codes',   roles: ['SUPER_ADMIN', 'ADMIN', 'BILLING'] },
  { to: '/admin/communications', icon: Mail,           label: 'Communications', roles: ['SUPER_ADMIN', 'ADMIN'] },
  // Round 20: platform-wide views
  { to: '/admin/networks',      icon: Network,         label: 'Networks',      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/storage',       icon: DatabaseIcon,    label: 'Storage',       roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/dns',           icon: Globe,           label: 'DNS zones',     roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/marketplace',   icon: Boxes,           label: 'Marketplace',   roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/tickets',       icon: MessageSquare,   label: 'Tickets',       roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
  { to: '/admin/abuse',         icon: ShieldAlert,     label: 'Abuse',         roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
  { to: '/admin/workflows',     icon: GitBranch,       label: 'Workflows',     roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/status',        icon: Activity,        label: 'Status page',   roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/integrations',  icon: Plug,            label: 'Integrations',  roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/roles',         icon: Shield,          label: 'Roles',         roles: ['SUPER_ADMIN'] },
  { to: '/admin/announcements', icon: Megaphone,       label: 'Announcements', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/audit-logs',    icon: FileText,        label: 'Audit logs',    roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/settings',      icon: Settings,        label: 'Settings',      roles: ['SUPER_ADMIN', 'ADMIN'] },
]

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-950/40 text-red-400 border-red-900/60',
  ADMIN:       'bg-orange-950/40 text-orange-400 border-orange-900/60',
  SUPPORT:     'bg-blue-950/40 text-blue-400 border-blue-900/60',
  BILLING:     'bg-green-950/40 text-green-400 border-green-900/60',
}

export default function AdminLayout() {
  useSocket()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'CLIENT'

  const visible = NAV.filter((n) => n.roles.includes(role))

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    toast.success('Signed out')
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0d0e0d]">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#0d0e0d] border-r border-[#2a2b2a] flex flex-col h-screen sticky top-0">
        <div className="border-b border-[#2a2b2a] p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-950/40 border border-red-900/60 rounded-md flex items-center justify-center">
              <ShieldAlert size={14} className="text-red-400" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-red-400 font-medium">Admin</div>
              <div className="text-[12px] text-[#e8e8e6]">NetLayer</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'h-8 rounded-md flex items-center gap-2 px-2 text-[13px] cursor-pointer transition-colors',
                  isActive
                    ? 'bg-[#1e1f1e] text-[#e8e8e6]'
                    : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
                )
              }
            >
              <item.icon size={14} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#2a2b2a] p-2 space-y-1">
          <button
            onClick={() => navigate('/dashboard/home')}
            className="w-full h-8 rounded-md flex items-center gap-2 px-2 text-[13px] text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Customer dashboard</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-8 rounded-md flex items-center gap-2 px-2 text-[13px] text-red-400 hover:bg-red-950/20 cursor-pointer transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
          <div className="flex items-center gap-2 p-1.5 rounded-md">
            <div className="w-7 h-7 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-[11px] font-medium shrink-0">
              {initials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[#e8e8e6] truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-[#6a6a68] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-[#161716] border-b border-[#2a2b2a] px-5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/60">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium border capitalize',
                ROLE_BADGE[role] || 'bg-[#1e1f1e] text-[#a0a09e] border-[#333433]'
              )}
            >
              {role.replace('_', ' ').toLowerCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
