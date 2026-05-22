import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationAPI } from '../api/admin'
import { cn, relativeTime } from '../lib/utils'

export function NotificationBell() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.list(),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const unread = data?.unreadCount ?? 0
  const items = data?.data ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-8 w-8 rounded-md border border-[#333433] text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6] flex items-center justify-center cursor-pointer transition-colors"
        aria-label="Notifications"
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#e0fe56] text-[#0d0e0d] text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#161716] border border-[#2a2b2a] rounded-lg shadow-xl z-40 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-[#2a2b2a]">
            <h3 className="text-sm font-medium text-[#e8e8e6]">Notifications</h3>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-[11px] text-[#e0fe56] hover:underline cursor-pointer">
                Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#6a6a68]">
                No notifications yet.
              </div>
            ) : (
              items.map((n: any) => (
                <NotificationItem key={n.id} n={n} onRead={() => markRead.mutate(n.id)} onClick={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n, onRead, onClick }: { n: any; onRead: () => void; onClick: () => void }) {
  const inner = (
    <div
      className={cn(
        'p-3 border-b border-[#2a2b2a] hover:bg-[#1e1f1e] transition-colors cursor-pointer',
        !n.isRead && 'bg-[#1e1f1e]/50'
      )}
      onClick={() => {
        if (!n.isRead) onRead()
        onClick()
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#e8e8e6] font-medium truncate">{n.title}</span>
            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#e0fe56] shrink-0" />}
          </div>
          <p className="text-xs text-[#a0a09e] mt-0.5 line-clamp-2">{n.message}</p>
          <p className="text-[10px] text-[#6a6a68] mt-1">{relativeTime(n.createdAt)}</p>
        </div>
        {n.isRead && <Check size={12} className="text-[#6a6a68] shrink-0 mt-1" />}
      </div>
    </div>
  )
  return n.link ? <Link to={n.link}>{inner}</Link> : inner
}
