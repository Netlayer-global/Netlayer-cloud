import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

/**
 * Top-right floating theme switch.
 *
 * Default (no props): renders a fixed-position pill in the top-right
 * corner of the viewport so it sits above every page chrome including
 * the LandingNav. Pages can opt out of fixed-positioning by passing
 * `inline` and embedding it inside their own nav.
 */
export function ThemeToggle({
  inline = false,
  size = 'md',
}: {
  inline?: boolean
  size?: 'sm' | 'md'
}) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const dimensions = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 14 : 16

  const button = (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={`${dimensions} rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200`}
      style={{
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        border: '1px solid var(--b-default)',
        color: 'var(--t-hi)',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-b)'
        e.currentTarget.style.color = 'var(--brand)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--b-default)'
        e.currentTarget.style.color = 'var(--t-hi)'
      }}
    >
      {/* Sun + moon swap with a tiny rotate animation */}
      <span
        key={theme}
        className="inline-flex"
        style={{
          animation: 'nl-theme-spin 320ms cubic-bezier(.34, 1.56, .64, 1)',
        }}
      >
        {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      </span>
      <style>{`
        @keyframes nl-theme-spin {
          from { transform: rotate(-90deg) scale(.5); opacity: 0; }
          to   { transform: rotate(0) scale(1); opacity: 1; }
        }
      `}</style>
    </button>
  )

  if (inline) return button

  return (
    <div
      className="fixed top-3 right-3 sm:top-4 sm:right-4"
      style={{ zIndex: 70 }}
    >
      {button}
    </div>
  )
}
