import { useCallback, useEffect, useState } from 'react'

/**
 * Theme hook — reads + writes a `theme` setting and reflects it on the
 * `<html>` element via `data-theme="light" | "dark"`. CSS in tokens.css
 * picks up the attribute selector so every component switches without
 * any conditional rendering.
 *
 * Persistence:
 *   - localStorage key `nl:theme` (`light` / `dark`)
 *   - On first visit we honour `prefers-color-scheme`
 *   - The setter is exposed so a top-right toggle can flip the value
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nl:theme'

const detectInitial = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  // System pref fallback — most VPS visitors are on dark anyway
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => detectInitial())

  // Sync to the <html> element on mount + every change
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.style.colorScheme = theme
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  // Listen for OS-level theme changes when the user hasn't chosen
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return // explicit choice wins
      } catch {}
      setThemeState(e.matches ? 'light' : 'dark')
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, setTheme, toggle, isDark: theme === 'dark', isLight: theme === 'light' }
}

/**
 * One-shot bootstrap that runs before React mounts so the very first
 * paint already matches the user's chosen theme — eliminates the
 * dark/light flash. Called from main.tsx before `createRoot()`.
 */
export function applyInitialTheme() {
  if (typeof document === 'undefined') return
  const initial = detectInitial()
  document.documentElement.setAttribute('data-theme', initial)
  document.documentElement.style.colorScheme = initial
}
