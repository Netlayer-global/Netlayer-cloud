import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ChevronDown, Menu, X as XIcon,
  Cpu, Server, MonitorCog, Hexagon, HardDrive, Database, Network, Boxes,
} from 'lucide-react'

/**
 * LandingNav — public site top navigation.
 *
 * Sticky glass bar that sits just below the promo TopBanner. Becomes more
 * opaque once the page is scrolled. The Products entry opens a two-column
 * mega-menu; the rest are flat links. Right cluster carries a live-status
 * pill, sign-in, and the primary lime "Deploy" CTA.
 *
 * Rendered unchanged across every public page so the chrome stays in sync.
 * Re-exported from `pages/Landing.tsx` for backwards compatibility.
 */

const BRAND = '#c8f135'
const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const PRODUCTS: { icon: typeof Cpu; label: string; desc: string; to: string; badge?: string }[][] = [
  [
    { icon: Cpu, label: 'Cloud VPS', desc: 'NVMe virtual servers from ₹149/mo', to: '/pricing#compute' },
    { icon: Server, label: 'Bare Metal', desc: 'Single-tenant dedicated servers', to: '/pricing#bare' },
    { icon: MonitorCog, label: 'GPU Cloud', desc: 'NVIDIA L40 / A100 / H100', to: '/pricing#gpu' },
    { icon: Hexagon, label: 'Kubernetes', desc: 'Managed clusters', to: '/kubernetes', badge: 'PREVIEW' },
  ],
  [
    { icon: HardDrive, label: 'Block Storage', desc: 'NVMe volumes, attach in seconds', to: '/pricing#block' },
    { icon: Boxes, label: 'Object Storage', desc: 'S3-compatible buckets', to: '/pricing#object' },
    { icon: Database, label: 'Managed Databases', desc: 'Postgres, MySQL, Redis', to: '/pricing#db' },
    { icon: Network, label: 'Load Balancers', desc: 'HA traffic distribution', to: '/pricing#lb' },
  ],
]

export function LandingNav() {
  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-9 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,9,9,0.82)' : 'rgba(8,9,9,0.4)',
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        borderBottom: `1px solid ${scrolled ? 'var(--b-default)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden>
            <polygon points="16,3 27,9 27,22 16,28 5,22 5,9" stroke={BRAND} strokeWidth="1.5" fill="none" />
            <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="var(--brand-d)" stroke={BRAND} strokeWidth="1" />
            <circle cx="16" cy="16" r="2.5" fill={BRAND} />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight text-white">NetLayer</span>
        </Link>

        {/* Center links */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] transition-colors"
              style={{ color: productsOpen ? 'var(--t-hi)' : 'var(--t-med)' }}
            >
              Products
              <ChevronDown size={13} className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                style={{ width: 620 }}
              >
                <div
                  className="grid grid-cols-2 gap-1 rounded-2xl p-3"
                  style={{
                    background: 'rgba(13,14,13,0.96)',
                    border: '1px solid var(--b-strong)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {PRODUCTS.flat().map((p) => (
                    <Link
                      key={p.label}
                      to={p.to}
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: BRAND }}
                      >
                        <p.icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-medium text-white">{p.label}</span>
                          {p.badge && (
                            <span
                              className="rounded px-1.5 text-[9px] tracking-wider"
                              style={{ background: 'var(--brand-d)', color: BRAND, border: '1px solid var(--brand-b)' }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[12px]" style={{ color: 'var(--t-low)' }}>
                          {p.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TopLink to="/features">Solutions</TopLink>
          <TopLink to="/pricing">Pricing</TopLink>
          <TopLink to="/network">Network</TopLink>
          <TopLink to="/docs">Docs</TopLink>
          <TopLink to="/blog">Blog</TopLink>
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            to="/status"
            className="inline-flex h-8 items-center gap-2 rounded-full pl-2.5 pr-3"
            style={{ border: '1px solid rgba(46,204,113,.3)', background: 'var(--c-green-d)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full nl-pulse-ring" style={{ background: 'var(--c-green)' }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--c-green)' }} />
            </span>
            <span className="text-[11px]" style={{ color: 'var(--c-green)' }}>All systems go</span>
          </Link>
          <a href={`${DASHBOARD_URL}/login`} className="px-3 py-2 text-[13.5px]" style={{ color: 'var(--t-med)' }}>
            Sign in
          </a>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="group inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: BRAND, color: '#0d0e0d', boxShadow: 'var(--shadow-brand)' }}
          >
            Deploy now
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="-mr-2 p-2 lg:hidden"
          style={{ color: 'var(--t-med)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="space-y-1 px-4 py-4 lg:hidden"
          style={{ background: 'rgba(8,9,9,0.97)', borderTop: '1px solid var(--b-default)' }}
        >
          {[
            ['Products', '/pricing'],
            ['Solutions', '/features'],
            ['Pricing', '/pricing'],
            ['Network', '/network'],
            ['Docs', '/docs'],
            ['Blog', '/blog'],
          ].map(([label, to]) => (
            <Link key={label} to={to} className="block py-2.5 text-[15px]" style={{ color: 'var(--t-med)' }} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--b-default)' }}>
            <a href={`${DASHBOARD_URL}/login`} className="py-2 text-[15px]" style={{ color: 'var(--t-med)' }}>Sign in</a>
            <a
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-[14px] font-semibold"
              style={{ background: BRAND, color: '#0d0e0d' }}
            >
              Deploy now <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-[13.5px] transition-colors"
      style={{ color: 'var(--t-med)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
    >
      {children}
    </Link>
  )
}
