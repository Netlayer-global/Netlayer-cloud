import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useSocket } from '../../hooks/useSocket'
import { AnnouncementBanner } from '../AnnouncementBanner'
import { CommandPalette } from '../CommandPalette'

export function DashboardLayout() {
  useSocket()
  return (
    <div className="flex min-h-screen bg-[#0d0e0d]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <AnnouncementBanner />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
