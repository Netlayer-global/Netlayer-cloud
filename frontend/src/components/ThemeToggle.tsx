import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/utils'

/**
 * Dashboard theme switch — designed to live inline inside the Topbar
 * (and admin Layout's header) rather than fixed-positioned, so it sits
 * next to the user's avatar / notification bell.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'w-8 h-8 rounded-md inline-flex items-center justify-center cursor-pointer transition-colors',
        'border border-[#2a2b2a] bg-[#1e1f1e] text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625]',
        className
      )}
    >
      <span
        key={theme}
        className="inline-flex"
        style={{ animation: 'nl-theme-spin 320ms cubic-bezier(.34, 1.56, .64, 1)' }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </span>
      <style>{`
        @keyframes nl-theme-spin {
          from { transform: rotate(-90deg) scale(.5); opacity: 0; }
          to   { transform: rotate(0) scale(1); opacity: 1; }
        }
      `}</style>
    </button>
  )
}
