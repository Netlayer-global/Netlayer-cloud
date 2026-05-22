import { Link, useLocation } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { NotificationBell } from '../NotificationBell'
import { useAuthStore } from '../../store/authStore'

const labels: Record<string, string> = {
  home: 'Home',
  servers: 'Servers',
  deploy: 'Deploy server',
  billing: 'Usage & billing',
  'ssh-keys': 'SSH keys',
  settings: 'Settings',
  admin: 'Admin',
  projects: 'Projects',
  activity: 'Activity',
  vms: 'Virtual machines',
  k8s: 'Kubernetes',
  storage: 'Storage',
  network: 'Network',
  gpu: 'GPU instances',
  team: 'Team settings',
}

export function Topbar() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  const { user } = useAuthStore()
  const isAdmin = user?.role && ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING'].includes(user.role)

  return (
    <header className="h-12 bg-[#161716] border-b border-[#2a2b2a] px-5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 text-[13px] min-w-0">
        <Link to="/dashboard/home" className="text-[#6a6a68] hover:text-[#e8e8e6] transition-colors cursor-pointer">
          NetLayer
        </Link>
        {segments.slice(1).map((seg, i, arr) => {
          const isLast = i === arr.length - 1
          return (
            <span key={`${seg}-${i}`} className="flex items-center gap-2 min-w-0">
              <ChevronRight size={12} className="text-[#6a6a68] shrink-0" />
              <span className={isLast ? 'text-[#e8e8e6] truncate' : 'text-[#6a6a68] truncate'}>
                {labels[seg] || seg}
              </span>
            </span>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm" className="text-red-400 border-red-900/60 hover:bg-red-950/30">
              Admin
            </Button>
          </Link>
        )}
        <Button variant="secondary" size="sm">SSH key</Button>
        <Button variant="secondary" size="sm">Invite</Button>
        <NotificationBell />
        <Link to="/dashboard/deploy">
          <Button size="sm">
            <Plus size={14} />
            Deploy server
          </Button>
        </Link>
      </div>
    </header>
  )
}
