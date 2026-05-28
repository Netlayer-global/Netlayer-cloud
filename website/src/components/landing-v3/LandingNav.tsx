import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Menu, X as XIcon } from 'lucide-react'

/**
 * Public site top navigation. Used on the landing page (/) and rerendered
 * unchanged on all the supporting public pages (/pricing, /network, /docs,
 * /blog, /about, /careers, /status, /legal/*) so the chrome stays consistent.
 *
 * Re-exported from `pages/Landing.tsx` for backwards compatibility — public
 * pages that already import `LandingNav` from `../Landing` keep working.
 */
export function LandingNav() {
  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="nl-glass fixed top-0 inset-x-0 z-50"
      style={{ borderBottom: '1px solid var(--b-subtle)' }}
    >
      <div className="max-w-7xl mx-auto h-[52px] px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" aria-hidden>
            <polygon
              points="16,3 27,9 27,22 16,28 5,22 5,9"
              stroke="var(--brand)" strokeWidth="1.5" fill="none"
            />
            <polygon
              points="16,8 23,12 23,20 16,24 9,20 9,12"
              fill="var(--brand-d)" stroke="var(--brand)" strokeWidth="1"
            />
            <circle cx="16" cy="16" r="2.5" fill="var(--brand)" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.01em' }}>
            NetLayer
          </span>
        </Link>

        {/* Center links */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          <NavLink onMouseEnter={() => setProductsOpen(true)} onClick={() => setProductsOpen(!productsOpen)}>
            Products
            <ChevronDown size={12} className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
          </NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/network">Network</NavLink>
          <NavLink to="/docs">Docs</NavLink>
          <NavLink to="/blog">Blog</NavLink>

          {productsOpen && (
            <div
              onMouseLeave={() => setProductsOpen(false)}
              className="absolute left-1/2 -translate-x-1/2 nl-glass nl-card grid grid-cols-2 gap-1 p-3"
              style={{ top: 52, width: 560, boxShadow: 'var(--shadow-lg)' }}
            >
              <DropCol title="Compute">
                <DropItem to="/pricing#compute"  label="Cloud VPS"     desc="SSD virtual servers from ₹149/mo" />
                <DropItem to="/pricing#bare"     label="Bare Metal"     desc="Dedicated servers from ₹999/mo" />
                <DropItem to="/pricing#gpu"      label="GPU Cloud"      desc="NVIDIA A100/H100 from ₹1,999/mo" />
                <DropItem to="/kubernetes"       label="Kubernetes"     desc="Managed clusters (Preview)" badge="PREVIEW" />
              </DropCol>
              <DropCol title="Storage & Data">
                <DropItem to="/pricing#block"    label="Block Storage"  desc="NVMe volumes from ₹40/GB" />
                <DropItem to="/pricing#object"   label="Object Storage" desc="S3-compatible from ₹5/GB" />
                <DropItem to="/pricing#db"       label="Managed DB"     desc="PostgreSQL, MySQL, Redis" />
                <DropItem to="/pricing#lb"       label="Load Balancers" desc="HA traffic routing" />
              </DropCol>
            </div>
          )}
        </nav>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/status"
            className="inline-flex items-center gap-2 h-7 pl-2 pr-3 rounded-full"
            style={{
              border: '1px solid rgba(46,204,113,.3)',
              background: 'var(--c-green-d)',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full nl-pulse-ring"
                style={{ background: 'var(--c-green)' }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--c-green)' }}
              />
            </span>
            <span style={{ fontSize: 11, color: 'var(--c-green)' }}>All systems operational</span>
          </Link>
          <Link
            to="/login"
            className="px-3 h-9 inline-flex items-center text-[13px]"
            style={{ color: 'var(--t-med)' }}
          >
            Sign in
          </Link>
          <Link to="/register" className="nl-btn-primary !h-9 !px-4 !text-[13px]">
            Deploy now
            <ArrowRight size={13} />
          </Link>
        </div>

        <button
          className="lg:hidden p-2 -mr-2"
          style={{ color: 'var(--t-med)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden nl-glass px-4 py-4 space-y-1"
          style={{ borderTop: '1px solid var(--b-subtle)' }}
        >
          <Link to="/pricing" className="block py-2" style={{ color: 'var(--t-med)' }}>Pricing</Link>
          <Link to="/network" className="block py-2" style={{ color: 'var(--t-med)' }}>Network</Link>
          <Link to="/docs"    className="block py-2" style={{ color: 'var(--t-med)' }}>Docs</Link>
          <Link to="/blog"    className="block py-2" style={{ color: 'var(--t-med)' }}>Blog</Link>
          <div className="pt-3 mt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--b-subtle)' }}>
            <Link to="/login"    className="px-3 py-2 text-[14px]" style={{ color: 'var(--t-med)' }}>Sign in</Link>
            <Link to="/register" className="nl-btn-primary justify-center">Deploy now <ArrowRight size={14} /></Link>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({
  to, children, onClick, onMouseEnter,
}: {
  to?: string; children: React.ReactNode
  onClick?: () => void; onMouseEnter?: () => void
}) {
  const cls = "px-3 py-1.5 inline-flex items-center gap-1 rounded text-[12px] cursor-pointer"
  const style = { color: 'var(--t-low)' }
  if (to) return <Link to={to} className={cls} style={style}>{children}</Link>
  return <button className={cls} style={style} onClick={onClick} onMouseEnter={onMouseEnter}>{children}</button>
}

function DropCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="px-3 py-1.5 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--t-low)' }}
      >
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function DropItem({ to, label, desc, badge }: { to: string; label: string; desc: string; badge?: string }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded-md transition-colors"
      style={{ transition: 'var(--ease-fast) background' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-center gap-2">
        <span className="text-[13px]" style={{ color: 'var(--t-hi)', fontWeight: 500 }}>{label}</span>
        {badge && (
          <span
            className="px-1.5 h-4 inline-flex items-center text-[9px] tracking-wider rounded"
            style={{
              background: 'var(--brand-d)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-b)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: 'var(--t-low)' }}>{desc}</div>
    </Link>
  )
}
