import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Folder,
  Activity,
  Server as ServerIcon,
  Cpu,
  Hexagon,
  Database,
  HardDrive,
  Network,
  Globe,
  Boxes,
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
  Key,
  BarChart3,
  Bell,
  FileText,
  LifeBuoy as TicketIcon,
  Gift,
  Camera,
  Radio,
  Disc3,
  Receipt,
  Building2,
  Phone,
  IdCard,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { serverAPI } from '../../api/endpoints'
import { useModules } from '../../hooks/useModules'
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
  const { isEnabled } = useModules()

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

  // Track whether each section has at least one visible item so we don't render
  // empty section labels when the operator has disabled the entire group.
  const computeShown =
    isEnabled('servers') || isEnabled('vms') || isEnabled('gpu') ||
    isEnabled('kubernetes') || isEnabled('marketplace')
  const storageShown =
    isEnabled('objectStorage') || isEnabled('blockStorage') || isEnabled('managedDb') ||
    isEnabled('snapshots') || isEnabled('customIsos')
  const networkShown =
    isEnabled('loadBalancers') || isEnabled('dns') || isEnabled('vpc') || isEnabled('floatingIps')
  const monitoringShown =
    isEnabled('monitoring') || isEnabled('alerts') || isEnabled('logs')
  const accountShown =
    isEnabled('billing') || isEnabled('apiKeys') || isEnabled('sshKeys') ||
    isEnabled('team') || isEnabled('referrals') || isEnabled('support') ||
    isEnabled('deployOrders') || isEnabled('organizations') ||
    isEnabled('kyc') || isEnabled('phoneVerify')

  return (
    <aside className="w-[220px] shrink-0 bg-[#0d0e0d] border-r border-[#2a2b2a] flex flex-col h-screen sticky top-0">
      {/* Top section */}
      <div className="border-b border-[#2a2b2a] p-2 space-y-1">
        <button className="w-full h-9 px-2 flex items-center gap-2 rounded-md hover:bg-[#1e1f1e] cursor-pointer transition-colors">
          <div className="w-6 h-6 bg-[#e0fe56] text-[#0d0e0d] rounded-md flex items-center justify-center text-xs font-bold shrink-0">
            N
          </div>
          <span className="flex-1 text-left text-[13px] font-medium text-[#e8e8e6] truncate nl-heading">
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
        {isEnabled('projects') && <NavItem to="/dashboard/projects" icon={Folder} label="Projects" />}
        {isEnabled('activity') && <NavItem to="/dashboard/activity" icon={Activity} label="Activity" />}

        {computeShown && (
          <>
            <SectionLabel>Compute</SectionLabel>
            {isEnabled('servers') && (
              <NavItem
                to="/dashboard/servers"
                icon={ServerIcon}
                label="Servers"
                badge={countBadge(serverCount)}
              />
            )}
            {isEnabled('vms') && (
              <NavItem to="/dashboard/vms" icon={Cpu} label="Virtual machines" badge={countBadge(0)} />
            )}
            {isEnabled('gpu') && (
              <NavItem
                to="/dashboard/gpu"
                icon={Monitor}
                label="GPU instances"
                badge={<Badge variant="preview">New</Badge>}
              />
            )}
            {isEnabled('kubernetes') && (
              <NavItem
                to="/dashboard/k8s"
                icon={Hexagon}
                label="Kubernetes"
                badge={<Badge variant="preview">Preview</Badge>}
              />
            )}
            {isEnabled('marketplace') && (
              <NavItem to="/dashboard/marketplace" icon={Boxes} label="Marketplace" />
            )}
          </>
        )}

        {storageShown && (
          <>
            <SectionLabel>Storage</SectionLabel>
            {isEnabled('blockStorage') && (
              <NavItem to="/dashboard/storage/block" icon={HardDrive} label="Block volumes" />
            )}
            {isEnabled('objectStorage') && (
              <NavItem to="/dashboard/storage/object" icon={Database} label="Object storage" />
            )}
            {isEnabled('managedDb') && (
              <NavItem to="/dashboard/databases" icon={Database} label="Managed databases" />
            )}
            {isEnabled('snapshots') && (
              <NavItem to="/dashboard/snapshots" icon={Camera} label="Snapshots" />
            )}
            {/* Round 24: Custom ISOs no longer in sidebar — surfaced inside Deploy → OS step.
                Operator can re-enable a sidebar shortcut by toggling the customIsos module. */}
            {isEnabled('customIsos') && (
              <NavItem to="/dashboard/custom-isos" icon={Disc3} label="Custom ISOs" />
            )}
          </>
        )}

        {networkShown && (
          <>
            <SectionLabel>Network</SectionLabel>
            {isEnabled('loadBalancers') && (
              <NavItem to="/dashboard/load-balancers" icon={Network} label="Load balancers" />
            )}
            {isEnabled('dns') && (
              <NavItem to="/dashboard/dns" icon={Globe} label="DNS zones" />
            )}
            {isEnabled('vpc') && (
              <NavItem to="/dashboard/vpc" icon={Network} label="VPC & private network" />
            )}
            {isEnabled('floatingIps') && (
              <NavItem to="/dashboard/floating-ips" icon={Radio} label="Floating IPs" />
            )}
          </>
        )}

        {monitoringShown && (
          <>
            <SectionLabel>Monitoring</SectionLabel>
            {isEnabled('monitoring') && (
              <NavItem to="/dashboard/monitoring" icon={BarChart3} label="Metrics & graphs" />
            )}
            {isEnabled('alerts') && (
              <NavItem to="/dashboard/alerts" icon={Bell} label="Alerts" />
            )}
            {isEnabled('logs') && (
              <NavItem to="/dashboard/logs" icon={FileText} label="Logs" />
            )}
          </>
        )}

        {accountShown && (
          <>
            <SectionLabel>Account</SectionLabel>
            {isEnabled('billing') && (
              <NavItem to="/dashboard/billing" icon={CreditCard} label="Usage & billing" />
            )}
            {isEnabled('deployOrders') && (
              <NavItem to="/dashboard/deploy-orders" icon={Receipt} label="Deploy orders" />
            )}
            {isEnabled('organizations') && (
              <NavItem to="/dashboard/organizations" icon={Building2} label="Organizations" />
            )}
            {isEnabled('kyc') && (
              <NavItem to="/dashboard/kyc"           icon={IdCard}    label="KYC verification" />
            )}
            {isEnabled('phoneVerify') && (
              <NavItem to="/dashboard/phone-verify"  icon={Phone}     label="Phone verify" />
            )}
            {isEnabled('team') && (
              <NavItem to="/dashboard/team" icon={Users} label="Team settings" />
            )}
            {isEnabled('sshKeys') && (
              <NavItem to="/dashboard/ssh-keys" icon={Shield} label="SSH keys" />
            )}
            {isEnabled('apiKeys') && (
              <NavItem to="/dashboard/api-keys" icon={Key} label="API keys" />
            )}
            {isEnabled('referrals') && (
              <NavItem to="/dashboard/referrals" icon={Gift} label="Referrals" />
            )}
            {isEnabled('support') && (
              <NavItem to="/dashboard/support" icon={TicketIcon} label="Support" />
            )}
            <NavItem to="/dashboard/settings" icon={Settings} label="Settings" />
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
