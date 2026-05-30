import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X as XIcon } from 'lucide-react'

/**
 * LandingNav — flat editorial top bar (Fireblox style, theme-aware).
 *
 * Transparent at top, gains a blurred surface + hairline once scrolled.
 * Wordmark left, uppercase tracked links centre, outline "Deploy" CTA
 * right. All colours read from CSS tokens so it flips with the theme.
 *
 * Sits just below the promo TopBanner (top: 36px). Re-exported from
 * pages/Landing.tsx for backwards compatibility.
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const LINKS: [string, string][] = [
  ['Products', '/pricing'],
  ['Solutions', '/features'],
  ['Network', '/network'],
  ['Docs', '/docs'],
  ['Company', '/about'],
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-9 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--surface-glass)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(150%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(150%)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--b-subtle)' : 'transparent'}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: '20px clamp(20px,5vw,52px)' }}>
        {/* wordmark */}
        <Link
          to="/"
          className="cursor-pointer transition-opacity hover:opacity-80"
          style={{ fontWeight: 700, fontSize: 14, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--t-hi)' }}
        >
          NetLayer
        </Link>

        {/* center links */}
        <nav className="hidden lg:flex items-center" style={{ gap: 34 }}>
          {LINKS.map(([label, to]) => (
            <Link
              key={label}
              to={to}
              className="transition-colors"
              style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* right cluster */}
        <div className="flex items-center" style={{ gap: 16 }}>
          <a
            href={`${DASHBOARD_URL}/login`}
            className="hidden md:inline-flex transition-colors"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
          >
            Sign in
          </a>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="transition-all"
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              color: 'var(--brand-fg)', background: 'var(--brand)', padding: '10px 22px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-h)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
          >
            Deploy now
          </a>
          {/* mobile toggle */}
          <button
            className="lg:hidden"
            style={{ color: 'var(--t-hi)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(18px)', borderTop: '1px solid var(--b-subtle)', padding: '12px clamp(20px,5vw,52px) 20px' }}
        >
          {LINKS.map(([label, to]) => (
            <Link
              key={label}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="block"
              style={{ padding: '11px 0', fontSize: 13, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-med)' }}
            >
              {label}
            </Link>
          ))}
          <a
            href={`${DASHBOARD_URL}/register`}
            className="mt-3 inline-flex items-center justify-center w-full"
            style={{ height: 44, background: 'var(--brand)', color: 'var(--brand-fg)', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}
          >
            Deploy now
          </a>
        </div>
      )}
    </header>
  )
}
