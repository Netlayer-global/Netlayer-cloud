import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { inAppMessagesAPI, type InAppMessage } from '../api/endpoints'
import { cn } from '../lib/utils'

/**
 * Round 24 — In-app message banner.
 *
 * Shown at the top of the customer dashboard when an admin has scheduled
 * a message in the active window. Per-message dismiss is stored in
 * localStorage so refresh doesn't re-show it.
 */

const ICON_MAP = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
}

const COLOR_MAP: Record<string, string> = {
  info:    'border-[#3d8bff] bg-blue-950/40 text-[#3d8bff]',
  warning: 'border-amber-700 bg-amber-950/40 text-amber-400',
  error:   'border-red-700 bg-red-950/40 text-red-400',
  success: 'border-[#4ade80] bg-green-950/40 text-[#4ade80]',
}

export function InAppBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nl:inapp:dismissed') || '[]')) }
    catch { return new Set() }
  })

  const { data = [] } = useQuery({
    queryKey: ['in-app-messages', 'active'],
    queryFn: () => inAppMessagesAPI.active().then((r: any) => r.data.data as InAppMessage[]),
    refetchInterval: 5 * 60_000,
  })

  const visible = data.filter((m) => !dismissed.has(m.id))
  if (visible.length === 0) return null

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id)
    setDismissed(next)
    localStorage.setItem('nl:inapp:dismissed', JSON.stringify(Array.from(next)))
  }

  return (
    <div className="space-y-1.5">
      {visible.map((m) => {
        const Icon = ICON_MAP[m.type]
        return (
          <div
            key={m.id}
            className={cn('rounded-md border px-3 py-2 flex items-start gap-2', COLOR_MAP[m.type])}
          >
            <Icon size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#e8e8e6]">{m.title}</div>
              <div className="text-[11px] text-[#a0a09e] mt-0.5">{m.body}</div>
              {m.cta && m.ctaUrl && (
                <a
                  href={m.ctaUrl}
                  target={m.ctaUrl.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[11px] underline cursor-pointer"
                >
                  {m.cta} →
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(m.id)}
              className="shrink-0 p-1 rounded hover:bg-white/5 cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Auto-clean very old entries from localStorage (1 month)
export function useInAppBannerCleanup() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nl:inapp:dismissed:cleanup')
      const last = raw ? Number(raw) : 0
      if (Date.now() - last > 30 * 86_400_000) {
        localStorage.setItem('nl:inapp:dismissed', '[]')
        localStorage.setItem('nl:inapp:dismissed:cleanup', String(Date.now()))
      }
    } catch {}
  }, [])
}
