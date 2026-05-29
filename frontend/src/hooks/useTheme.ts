import { useCallback, useEffect, useState } from 'react'

/**
 * Theme hook — reads + writes a `theme` setting and reflects it on the
 * `<html>` element via `data-theme="light" | "dark"`. CSS in tokens.css
 * picks up the attribute selector so every dashboard surface switches
 * without any conditional rendering.
 *
 * Persistence:
 *   - localStorage key `nl:theme` (`light` / `dark`) — same key as the
 *     marketing site, so a customer's choice is preserved when bouncing
 *     between origins via the same browser
 *   - On first visit we honour `prefers-color-scheme`
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nl:theme'

const detectInitial = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => detectInitial())

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.style.colorScheme = theme
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      try { if (window.localStorage.getItem(STORAGE_KEY)) return } catch {}
      setThemeState(e.matches ? 'light' : 'dark')
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, setTheme, toggle, isDark: theme === 'dark', isLight: theme === 'light' }
}

export function applyInitialTheme() {
  if (typeof document === 'undefined') return
  const initial = detectInitial()
  document.documentElement.setAttribute('data-theme', initial)
  document.documentElement.style.colorScheme = initial
}
