import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react'

const PRODUCTS = [
  { label: 'Cloud VPS',         desc: 'NVMe servers in 60 seconds',     to: '/pricing#compute' },
  { label: 'Bare Metal',        desc: 'Dedicated single-tenant hosts',  to: '/pricing#baremetal' },
  { label: 'GPU Cloud',         desc: 'A100 / H100 on-demand',           to: '/pricing#gpu' },
  { label: 'Kubernetes',        desc: 'Managed K8s, zero ops',           to: '/kubernetes' },
  { label: 'Object Storage',    desc: 'S3-compatible buckets',           to: '/pricing#storage' },
  { label: 'Block Storage',     desc: 'NVMe persistent volumes',         to: '/pricing#blockstorage' },
  { label: 'Managed Databases', desc: 'PostgreSQL · MySQL · Redis',      to: '/pricing#databases' },
  { label: 'Load Balancers',    desc: 'HA traffic distribution',         to: '/pricing#lb' },
]

const COMPANY = [
  { label: 'About',     desc: 'Our story & mission',     to: '/about' },
  { label: 'Careers',   desc: 'We\'re hiring',            to: '/careers' },
  { label: 'Blog',      desc: 'Engineering deep-dives',  to: '/blog' },
  { label: 'Status',    desc: 'Live system health',      to: '/status' },
]

export function TopNavV2() {
  const [scrolled, setScrolled] = useState(false)
  const [openDrop, setOpenDrop] = useState<'products' | 'company' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--nl-bg)]/80 backdrop-blur-xl border-b border-[var(--nl-border)]'
          : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-8 h-8"
          >
            {/* Hexagon mark */}
            <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f8bff" />
                  <stop offset="100%" stopColor="#4ad7ff" />
                </linearGradient>
              </defs>
              <path
                d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
                fill="url(#logoGrad)"
                opacity="0.95"
              />
              <path
                d="M16 7 L23 11 L23 21 L16 25 L9 21 L9 11 Z"
                fill="#0a0c12"
              />
              <circle cx="16" cy="16" r="3" fill="url(#logoGrad)" />
            </svg>
          </motion.div>
          <span className="font-semibold text-[15px] tracking-tight">NetLayer</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Dropdown label="Products" items={PRODUCTS} open={openDrop === 'products'} onToggle={(o) => setOpenDrop(o ? 'products' : null)} />
          <NavTo to="/pricing">Pricing</NavTo>
          <NavTo to="/network">Network</NavTo>
          <NavTo to="/docs">Docs</NavTo>
          <Dropdown label="Company" items={COMPANY} open={openDrop === 'company'} onToggle={(o) => setOpenDrop(o ? 'company' : null)} />
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link to="/status" className="hidden xl:inline-flex items-center gap-2 h-8 px-3 rounded-full border border-[var(--nl-border)] hover:border-[var(--nl-border-strong)] transition-colors cursor-pointer">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] text-[var(--nl-text-soft)]">All systems operational</span>
          </Link>
          <Link to="/login" className="px-4 h-9 inline-flex items-center text-[13.5px] text-[var(--nl-text-soft)] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="nl-btn-primary !h-9 !px-4 !text-[13.5px]">
            Deploy now
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <button
          className="lg:hidden text-white p-2 -mr-2 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden bg-[var(--nl-bg)] border-t border-[var(--nl-border)]"
          >
            <div className="px-4 py-4 space-y-1">
              <MobileSection title="Products" items={PRODUCTS} />
              <MobileSection title="Company" items={COMPANY} />
              <Link to="/pricing" className="block px-3 py-2 text-[14px] text-[var(--nl-text-soft)]">Pricing</Link>
              <Link to="/network" className="block px-3 py-2 text-[14px] text-[var(--nl-text-soft)]">Network</Link>
              <Link to="/docs" className="block px-3 py-2 text-[14px] text-[var(--nl-text-soft)]">Docs</Link>
              <div className="pt-4 mt-3 border-t border-[var(--nl-border)] flex flex-col gap-2">
                <Link to="/login" className="px-3 py-2 text-[14px] text-[var(--nl-text-soft)]">Sign in</Link>
                <Link to="/register" className="nl-btn-primary justify-center">
                  Deploy now <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function NavTo({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className="px-3 h-9 inline-flex items-center text-[13.5px] text-[var(--nl-text-soft)] hover:text-white transition-colors"
    >
      {children}
    </NavLink>
  )
}

function Dropdown({
  label, items, open, onToggle,
}: {
  label: string
  items: { label: string; desc: string; to: string }[]
  open: boolean
  onToggle: (o: boolean) => void
}) {
  return (
    <div className="relative" onMouseLeave={() => onToggle(false)}>
      <button
        onMouseEnter={() => onToggle(true)}
        onClick={() => onToggle(!open)}
        className="px-3 h-9 inline-flex items-center gap-1 text-[13.5px] text-[var(--nl-text-soft)] hover:text-white transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 w-[420px] nl-glass-strong rounded-xl shadow-2xl p-2 grid grid-cols-1 gap-0.5 z-50"
          >
            {items.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => onToggle(false)}
                className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <span className="text-[13.5px] text-white font-medium group-hover:text-[var(--nl-brand-2)] transition-colors">
                  {item.label}
                </span>
                <span className="text-[12px] text-[var(--nl-text-muted)]">{item.desc}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileSection({ title, items }: { title: string; items: { label: string; desc: string; to: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-[14px] text-[var(--nl-text-soft)]">
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-4 space-y-1 overflow-hidden"
          >
            {items.map((i) => (
              <Link key={i.label} to={i.to} className="block px-3 py-1.5 text-[13px] text-[var(--nl-text-muted)] hover:text-white">
                {i.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
