import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu, X as XIcon, ChevronDown,
  Server, Cpu, Boxes, HardDrive, Network, Database, Globe2, Layers,
} from 'lucide-react'
import { ThemeToggle } from '../ThemeToggle'

/**
 * LandingNav — sticky top bar with a Products mega-menu dropdown.
 *
 * Transparent at top, gains a blurred surface + hairline once scrolled.
 * Wordmark left, nav (with a Products dropdown) centre, Sign in + Deploy
 * CTA right. Theme-aware via CSS tokens. Sits below the promo TopBanner.
 */
const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string

type ProductItem = { icon: typeof Server; label: string; desc: string; to: string }

const PRODUCTS: ProductItem[] = [
  { icon: Server,   label: 'Cloud VPS',         desc: 'NVMe KVM virtual machines', to: '/pricing#compute' },
  { icon: Cpu,      label: 'Bare Metal',        desc: 'Single-tenant EPYC servers', to: '/pricing#bare' },
  { icon: Boxes,    label: 'GPU Instances',     desc: 'A100 / H100 on demand',     to: '/pricing#gpu' },
  { icon: HardDrive,label: 'Storage',           desc: 'Block + S3 object storage',  to: '/pricing#storage' },
  { icon: Network,  label: 'Networking',        desc: 'VLANs, LBs, floating IPs',   to: '/network' },
  { icon: Database, label: 'Managed Databases', desc: 'Postgres, MySQL, Redis',     to: '/pricing#db' },
  { icon: Globe2,   label: 'Kubernetes',        desc: 'Managed clusters (preview)', to: '/kubernetes' },
  { icon: Layers,   label: 'Developer API',     desc: 'REST API + Terraform',       to: '/docs' },
]

const LINKS: [string, string][] = [
  ['Solutions', '/features'],
  ['Network', '/network'],
  ['Pricing', '/pricing'],
  ['Docs', '/docs'],
  ['Company', '/about'],
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setProductsOpen(true)
  }
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setProductsOpen(false), 120)
  }

  const linkStyle: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)',
  }

  return (
    <header
      className="fixed inset-x-0 top-9 z-50 transition-all duration-300"
      style={{
        background: scrolled || productsOpen ? 'var(--surface-glass)' : 'transparent',
        backdropFilter: scrolled || productsOpen ? 'blur(18px) saturate(150%)' : 'none',
        WebkitBackdropFilter: scrolled || productsOpen ? 'blur(18px) saturate(150%)' : 'none',
        borderBottom: `1px solid ${scrolled || productsOpen ? 'var(--b-subtle)' : 'transparent'}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: '20px clamp(20px,5vw,52px)' }}>
        {/* wordmark */}
        <Link
          to="/"
          className="cursor-pointer transition-opacity hover:opacity-80 inline-flex items-center"
          style={{ gap: 10 }}
        >
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden>
              <path d="M9 9h4.5l5 8V9H23v14h-4.5l-5-8v8H9V9z" fill="currentColor" />
            </svg>
          </span>
          <span className="nl-display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-.02em', color: 'var(--t-hi)' }}>
            NetLayer
          </span>
        </Link>

        {/* center links */}
        <nav className="hidden lg:flex items-center" style={{ gap: 30 }}>
          {/* Products dropdown trigger */}
          <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button
              className="inline-flex items-center gap-1 transition-colors cursor-pointer"
              style={{ ...linkStyle, color: productsOpen ? 'var(--t-hi)' : 'var(--t-low)' }}
              onClick={() => setProductsOpen((v) => !v)}
            >
              Products
              <ChevronDown size={13} style={{ transition: 'transform .2s', transform: productsOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>

          {LINKS.map(([label, to]) => (
            <Link
              key={label}
              to={to}
              className="transition-colors"
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* right cluster */}
        <div className="flex items-center" style={{ gap: 14 }}>
          <ThemeToggle inline size="sm" />
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
              color: 'var(--brand-fg)', background: 'var(--brand)', padding: '10px 22px', borderRadius: 'var(--r-sm)',
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

      {/* Products mega-menu */}
      {productsOpen && (
        <div
          className="hidden lg:block absolute left-0 right-0"
          style={{ top: '100%' }}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <div className="nl-container" style={{ paddingTop: 8, paddingBottom: 20 }}>
            <div
              style={{
                background: 'var(--nl-2)', border: '1px solid var(--b-default)', borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-lg)', padding: 20, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto',
              }}
            >
              <div className="grid grid-cols-2 gap-1.5">
                {PRODUCTS.map((p) => (
                  <Link
                    key={p.label}
                    to={p.to}
                    onClick={() => setProductsOpen(false)}
                    className="flex items-start gap-3 transition-colors"
                    style={{ padding: '12px 14px', borderRadius: 'var(--r-md)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                    >
                      <p.icon size={17} style={{ color: 'var(--brand)' }} />
                    </span>
                    <div>
                      <div className="nl-head" style={{ fontSize: 14, color: 'var(--t-hi)', marginBottom: 2 }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--t-low)' }}>{p.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(18px)', borderTop: '1px solid var(--b-subtle)', padding: '12px clamp(20px,5vw,52px) 20px' }}
        >
          <Link
            to="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block"
            style={{ padding: '11px 0', fontSize: 13, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-med)' }}
          >
            Products
          </Link>
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
            href={`${DASHBOARD_URL}/login`}
            className="block"
            style={{ padding: '11px 0', fontSize: 13, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-med)' }}
          >
            Sign in
          </a>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="mt-3 inline-flex items-center justify-center w-full"
            style={{ height: 44, background: 'var(--brand)', color: 'var(--brand-fg)', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderRadius: 'var(--r-sm)' }}
          >
            Deploy now
          </a>
        </div>
      )}
    </header>
  )
}
