import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const PRODUCTS = [
  { label: 'Cloud Compute',    desc: 'SSD VMs in 60 seconds',         to: '/pricing#compute' },
  { label: 'Bare Metal',       desc: 'Dedicated hardware',            to: '/pricing#baremetal' },
  { label: 'Kubernetes',       desc: 'Managed K8s clusters',          to: '/kubernetes' },
  { label: 'Object Storage',   desc: 'S3-compatible storage',         to: '/pricing#storage' },
  { label: 'Managed Databases', desc: 'PostgreSQL · MySQL · Redis',   to: '/pricing#databases' },
  { label: 'Block Storage',    desc: 'Persistent NVMe volumes',       to: '/pricing#blockstorage' },
  { label: 'Load Balancers',   desc: 'HA traffic distribution',       to: '/pricing#lb' },
]

const SOLUTIONS = [
  { label: 'Startups',          desc: '$100 free credit',              to: '/solutions/startups' },
  { label: 'Developers',        desc: 'Build & ship fast',             to: '/solutions/developers' },
  { label: 'Agencies',          desc: 'Manage client infra',           to: '/solutions/agencies' },
  { label: 'Enterprise',        desc: 'Custom SLAs & support',         to: '/solutions/enterprise' },
]

export function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState<'products' | 'solutions' | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all',
        scrolled
          ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0070f3] to-[#00d4ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.4)]">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-semibold text-white text-[15px] tracking-tight">NetLayer</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Dropdown
            label="Products"
            items={PRODUCTS}
            open={openDrop === 'products'}
            onToggle={(o) => setOpenDrop(o ? 'products' : null)}
          />
          <Dropdown
            label="Solutions"
            items={SOLUTIONS}
            open={openDrop === 'solutions'}
            onToggle={(o) => setOpenDrop(o ? 'solutions' : null)}
          />
          <Link to="/pricing" className="px-3 h-9 inline-flex items-center text-[14px] text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <Link to="/docs" className="px-3 h-9 inline-flex items-center text-[14px] text-gray-300 hover:text-white transition-colors">Docs</Link>
          <a href="#blog" className="px-3 h-9 inline-flex items-center text-[14px] text-gray-300 hover:text-white transition-colors">Blog</a>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link to="/login" className="px-3 h-9 inline-flex items-center text-[14px] text-gray-300 hover:text-white transition-colors">Sign In</Link>
          <Link
            to="/register"
            className="ml-1 inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[14px] font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff] hover:from-[#0080ff] hover:to-[#00a0ff] shadow-[0_4px_14px_rgba(0,112,243,0.4)] hover:shadow-[0_4px_20px_rgba(0,112,243,0.55)] transition-all cursor-pointer"
          >
            Deploy Now
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

      {mobileOpen && (
        <div className="lg:hidden bg-[#0a0a0a] border-t border-white/[0.06] px-4 py-4 space-y-1">
          <MobileSection title="Products" items={PRODUCTS} />
          <MobileSection title="Solutions" items={SOLUTIONS} />
          <Link to="/pricing" className="block px-3 py-2 text-[14px] text-gray-300 hover:text-white">Pricing</Link>
          <Link to="/docs" className="block px-3 py-2 text-[14px] text-gray-300 hover:text-white">Docs</Link>
          <div className="pt-3 mt-3 border-t border-white/[0.06] flex flex-col gap-2">
            <Link to="/login" className="px-3 py-2 text-[14px] text-gray-300">Sign In</Link>
            <Link to="/register" className="text-center h-10 inline-flex items-center justify-center rounded-md text-[14px] font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff]">Deploy Now</Link>
          </div>
        </div>
      )}
    </header>
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
    <div className="relative">
      <button
        onClick={() => onToggle(!open)}
        onMouseEnter={() => onToggle(true)}
        className="px-3 h-9 inline-flex items-center gap-1 text-[14px] text-gray-300 hover:text-white transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          onMouseLeave={() => onToggle(false)}
          className="absolute left-0 top-full mt-1 w-[440px] bg-[#0f0f0f] border border-white/[0.08] rounded-xl shadow-2xl p-2 grid grid-cols-1 gap-1 z-50"
        >
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => onToggle(false)}
              className="flex flex-col px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <span className="text-[13.5px] text-white font-medium">{item.label}</span>
              <span className="text-[12px] text-gray-500">{item.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileSection({ title, items }: { title: string; items: { label: string; desc: string; to: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[14px] text-gray-300 cursor-pointer"
      >
        {title}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pl-4 space-y-1">
          {items.map((i) => (
            <Link key={i.label} to={i.to} className="block px-3 py-1.5 text-[13px] text-gray-400 hover:text-white">
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
