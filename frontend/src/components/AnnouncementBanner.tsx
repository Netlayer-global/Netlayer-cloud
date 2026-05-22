import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Info, AlertTriangle, Wrench } from 'lucide-react'
import api from '../api/client'
import { cn } from '../lib/utils'

const ICONS: Record<string, any> = { info: Info, warning: AlertTriangle, maintenance: Wrench }
const STYLES: Record<string, string> = {
  info: 'border-[#e0fe56] bg-[#e0fe56]/5 text-[#e0fe56]',
  warning: 'border-amber-400 bg-amber-950/20 text-amber-300',
  maintenance: 'border-orange-400 bg-orange-950/20 text-orange-300',
}

const DISMISSED_KEY = 'netlayer-dismissed-announcements'

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    } catch {
      return []
    }
  })

  const { data: items = [] } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: () => api.get('/announcements/active').then((r) => r.data.data),
    refetchInterval: 60_000,
  })

  const visible = items.filter((a: any) => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
  }

  return (
    <div className="px-6 pt-3 space-y-2">
      {visible.map((a: any) => {
        const Icon = ICONS[a.type] || Info
        return (
          <div
            key={a.id}
            className={cn(
              'flex items-start gap-3 border-l-2 rounded-md p-3',
              STYLES[a.type] || STYLES.info
            )}
          >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{a.title}</div>
              <div className="text-xs text-[#a0a09e] mt-0.5">{a.message}</div>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className="text-current opacity-60 hover:opacity-100 cursor-pointer p-1"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
