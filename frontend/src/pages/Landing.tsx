import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, ArrowRight, Award, Award as Sla, BadgeCheck, Boxes,
  Box, ChevronDown, Cloud, Clock, Container, Copy, Cpu, Database, Eye,
  FileText, Github, Globe, Hexagon, HardDrive, Lock, Mail, MemoryStick,
  Menu, Monitor, MonitorCog, Network, Plug, Rocket, RotateCcw, Server,
  Shield, ShieldCheck, Sparkles, Star, Twitter, Wifi, Zap, Linkedin,
  MessageCircle, X as XIcon, Check, Search, ChevronRight,
} from 'lucide-react'

import { useCountUp, useInView } from '../utils/animations'
import { platformAPI } from '../api/endpoints'

/* ════════════════════════════════════════════════════════════
   2.1 — LandingNav
   ════════════════════════════════════════════════════════════ */
function LandingNav() {
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

/* ════════════════════════════════════════════════════════════
   2.2 — HeroSection
   ════════════════════════════════════════════════════════════ */
const TERMINAL_LINES = [
  { text: '$ nl server create --region mumbai --plan c3.large --os ubuntu-22.04', delayBefore: 0,    color: 'var(--t-hi)'  },
  { text: '✓ Authenticating with API key...             0.1s', delayBefore: 600,  color: 'var(--brand)' },
  { text: '✓ Region validated: Mumbai, India (BOM1)      0.2s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Capacity check: bom1-node-03 selected       0.3s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Cloning Ubuntu 22.04 base image...          2.1s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Allocating NVMe storage (160 GB)...         0.8s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Configuring cloud-init & SSH keys...        0.3s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Starting KVM instance...                    4.2s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Guest agent connected                       6.8s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Assigning IPv4: 103.21.148.92               0.2s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Registering reverse DNS...                  0.4s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Firewall rules applied                      0.1s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '',                                                  delayBefore: 200,  color: 'var(--t-hi)'  },
  { text: '╭─────────────────────────────────────────╮',         delayBefore: 80,   color: 'var(--t-low)' },
  { text: '│  Server ID:   nl-f3a7c219               │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  IPv4:        103.21.148.92             │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  IPv6:        2a01:4f8:c17::1           │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Region:      🇮🇳 Mumbai (BOM1)           │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Plan:        c3.large (4·8·160 NVMe)   │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Status:      ● Running                 │',         delayBefore: 60,   color: 'var(--c-green)' },
  { text: '│  Deployed in: 15.7 seconds              │',         delayBefore: 60,   color: 'var(--brand)' },
  { text: '╰─────────────────────────────────────────╯',         delayBefore: 60,   color: 'var(--t-low)' },
]

function HeroSection() {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    let cancelled = false
    let cumulative = 0
    setVisibleLines(0)
    TERMINAL_LINES.forEach((l, idx) => {
      cumulative += l.delayBefore
      window.setTimeout(() => {
        if (!cancelled) setVisibleLines(idx + 1)
      }, cumulative)
    })
    return () => { cancelled = true }
  }, [epoch])

  const allDone = visibleLines >= TERMINAL_LINES.length

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-16 px-4 sm:px-6 noise-overlay"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,241,53,0.04), transparent 70%),
          radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 1px, transparent 1px) 0 0/24px 24px,
          var(--nl-0)
        `,
      }}
    >
      {/* Announcement badge */}
      <Link
        to="/blog/introducing-gpu-cloud"
        className="inline-flex items-center gap-2 px-3 h-7 rounded-full text-[12px] cursor-pointer transition-all"
        style={{
          background: 'var(--brand-d)',
          border: '1px solid var(--brand-b)',
          color: 'var(--t-med)',
        }}
      >
        <Zap size={12} style={{ color: 'var(--c-amber)' }} />
        GPU Cloud now available — NVIDIA A100 from ₹1,999/mo
        <ArrowRight size={11} style={{ color: 'var(--t-low)' }} />
      </Link>

      {/* Headline */}
      <h1
        className="text-center mt-8"
        style={{
          fontSize: 'clamp(36px, 5.5vw, 52px)',
          fontWeight: 700,
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}
      >
        Infrastructure that
        <br />
        <span className="gradient-text-brand">deploys in seconds</span>
      </h1>

      <p
        className="text-center mt-6 px-4"
        style={{ fontSize: 18, color: 'var(--t-med)', maxWidth: 560 }}
      >
        Bare metal servers, cloud VMs, Kubernetes, and managed databases across 15 global regions.
        Built for developers who need real performance.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
        <Link to="/register" className="nl-btn-primary">
          <Rocket size={15} />
          Deploy now — Free ₹3,500 credit
        </Link>
        <Link to="/pricing" className="nl-btn-ghost">
          View pricing <ArrowRight size={14} />
        </Link>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--t-low)' }}>
        No credit card required · Cancel anytime
      </p>

      {/* Trust indicators */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Clock size={13} style={{ color: 'var(--brand)' }} /> 30-second deploy
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Globe size={13} style={{ color: 'var(--brand)' }} /> 15 regions
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <ShieldCheck size={13} style={{ color: 'var(--brand)' }} /> 99.99% SLA
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Lock size={13} style={{ color: 'var(--brand)' }} /> SOC2 compliant
        </span>
      </div>

      {/* Logo wall */}
      <div className="mt-10 max-w-3xl mx-auto w-full">
        <p className="text-center text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--t-low)' }}>
          Trusted by 50,000+ developers
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-25">
          {['NORTHWIND', 'STARK', 'WAYNE', 'CYBERLOOP', 'PARALLAX', 'OBSIDIAN', 'KINETIC', 'AXIOM'].map((n) => (
            <span
              key={n}
              className="font-bold tracking-[0.18em]"
              style={{ fontSize: 13, color: 'var(--t-med)' }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div className="hidden sm:block w-full max-w-2xl mx-auto mt-12 relative">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--nl-1)',
            border: '1px solid var(--b-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="h-9 flex items-center px-4 gap-2"
            style={{
              background: 'var(--nl-2)',
              borderBottom: '1px solid var(--b-default)',
            }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <span
              className="ml-3 text-[11px]"
              style={{ color: 'var(--t-low)', fontFamily: 'var(--font-mono)' }}
            >
              netlayer — zsh
            </span>
            <button
              onClick={() => setEpoch((e) => e + 1)}
              className="ml-auto p-1 rounded"
              style={{ color: 'var(--t-low)' }}
              title="Replay"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <pre
            className="px-5 py-4 overflow-hidden"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.65,
              minHeight: 460,
            }}
          >
            {TERMINAL_LINES.slice(0, visibleLines).map((l, i) => (
              <div key={`${epoch}-${i}`} style={{ color: l.color, whiteSpace: 'pre-wrap' }}>
                {l.text || '\u00A0'}
              </div>
            ))}
            {!allDone && (
              <span
                className="inline-block w-2 h-3.5 align-middle"
                style={{ background: 'var(--brand)', animation: 'nl-pulse-dot 1s infinite' }}
              />
            )}
          </pre>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.3 — StatsBar
   ════════════════════════════════════════════════════════════ */
function StatsBar() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  // Pull the live platform metrics so the landing page reflects reality.
  // Falls back to safe defaults when the request fails (e.g. backend
  // unreachable from a static hosting preview).
  const { data: stats } = useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformAPI.getStats().then((r) => r.data.data),
    staleTime: 60_000,
    retry: 1,
  })
  const deployedTarget = stats?.serversDeployedToday
    ? Math.max(stats.serversDeployedToday, 500)
    : 500
  const regionsTarget = stats?.regionsOnline ?? 15
  const uptimeTarget = stats?.uptimePercent ?? 99.99

  const a = useCountUp(deployedTarget, 1800, inView)
  const b = useCountUp(regionsTarget, 1400, inView)
  const c = useCountUp(uptimeTarget, 1800, inView)
  const lastDeploy = stats?.lastDeploySeconds ?? 31

  return (
    <section
      ref={ref}
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Servers deployed today', value: `${a}`,           suffix: '+' },
          { label: 'Global regions',         value: `${b}`,           suffix: ''  },
          { label: 'Uptime SLA',             value: `${c.toFixed(2)}`, suffix: '%' },
          { label: 'Last deploy',            value: `${lastDeploy}`,   suffix: 's' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="px-6 py-9 text-center"
            style={{ borderRight: i < 3 ? '1px solid var(--b-subtle)' : undefined }}
          >
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }}>
              {s.value}<span style={{ color: 'var(--brand)' }}>{s.suffix}</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.4 — ProductsSection
   ════════════════════════════════════════════════════════════ */
const PRODUCTS = [
  { Icon: Server,     title: 'Cloud VPS',         desc: 'High-performance virtual servers with dedicated vCPU and NVMe SSD storage', price: 'from ₹149/mo',   tint: 'var(--c-blue)',   bg: 'var(--c-blue-d)',   to: '/pricing#compute' },
  { Icon: Cpu,        title: 'Bare Metal',        desc: 'Dedicated single-tenant hardware. Zero overhead, maximum performance',     price: 'from ₹999/mo',   tint: 'var(--c-amber)',  bg: 'var(--c-amber-d)',  to: '/pricing#bare' },
  { Icon: MonitorCog, title: 'GPU Cloud',         desc: 'NVIDIA A100 and H100 instances for AI, ML, and rendering at scale',         price: 'from ₹1,999/mo', tint: 'var(--c-purple)', bg: 'var(--c-purple-d)', to: '/pricing#gpu',     badge: 'NEW' },
  { Icon: Hexagon,    title: 'Kubernetes',        desc: 'Managed K8s clusters with auto-scaling node pools and GitOps integration',  price: 'from ₹799/mo',   tint: 'var(--c-cyan)',   bg: 'var(--c-cyan-d)',   to: '/kubernetes',      badge: 'PREVIEW' },
  { Icon: Database,   title: 'Managed DB',        desc: 'PostgreSQL, MySQL, Redis with automated backups and instant failover',      price: 'from ₹499/mo',   tint: 'var(--c-green)',  bg: 'var(--c-green-d)',  to: '/pricing#db' },
  { Icon: Cloud,      title: 'Object Storage',    desc: 'S3-compatible storage with global edge delivery and versioning',             price: '₹5/GB/mo',       tint: 'var(--c-red)',    bg: 'var(--c-red-d)',    to: '/pricing#object' },
] as const

function ProductsSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="PLATFORM"
          title="Everything you need to build and scale"
          subtitle="One control plane for your entire cloud infrastructure"
        />

        <div
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-xl overflow-hidden"
          style={{ background: 'var(--b-default)', gap: '1px' }}
        >
          {PRODUCTS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="group cursor-pointer p-6 transition-colors"
              style={{ background: 'var(--nl-1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: p.bg }}
                >
                  <p.Icon size={16} style={{ color: p.tint }} />
                </div>
                <div className="flex items-center gap-2">
                  {'badge' in p && (
                    <span
                      className="px-1.5 h-4 inline-flex items-center text-[9px] tracking-wider rounded"
                      style={{
                        background: 'var(--brand-d)',
                        color: 'var(--brand)',
                        border: '1px solid var(--brand-b)',
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                  <ArrowRight
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--t-low)' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
              <p
                className="mt-2"
                style={{ fontSize: 11, color: 'var(--t-low)', lineHeight: 1.6 }}
              >
                {p.desc}
              </p>
              <div className="mt-3" style={{ fontSize: 11, color: 'var(--brand)' }}>
                {p.price}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHeader({ tag, title, subtitle, align = 'center' }: { tag: string; title: string; subtitle: string; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : ''}>
      <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
        {tag}
      </div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 32px)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
        {title}
      </h2>
      <p className="mt-4" style={{ fontSize: 15, color: 'var(--t-med)' }}>
        {subtitle}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   2.5 — PerformanceSection
   ════════════════════════════════════════════════════════════ */
const BENCHMARKS = [
  { label: 'NVMe Sequential Read',  value: '14.2 GB/s',   pct: 92, vs: 38 },
  { label: 'NVMe Sequential Write', value: '8.7 GB/s',    pct: 71, vs: 30 },
  { label: 'Network Throughput',    value: '25 Gbps',     pct: 98, vs: 22 },
  { label: 'CPU Single-Thread',     value: '5.8 GHz',     pct: 82, vs: 50 },
  { label: 'Deploy Time',           value: '15 seconds',  pct: 96, vs: 18 },
]

const FEATURES = [
  { Icon: Zap,        title: 'AMD EPYC Gen4 processors', desc: 'Latest generation with up to 192 cores per node' },
  { Icon: HardDrive,  title: 'All-NVMe storage',         desc: 'Every plan includes NVMe SSD, not SATA or spinning disk' },
  { Icon: Network,    title: '25 Gbps+ network',         desc: 'Private VLAN, BGP anycast, anti-spoofing included' },
  { Icon: Shield,     title: 'Hardware DDoS protection', desc: 'Layer 3/4/7 filtering at network edge, always on' },
  { Icon: Clock,      title: '30-second provisioning',   desc: 'Linked clone pipeline, pre-cached images, instant boot' },
  { Icon: Globe,      title: 'KVM hypervisor',           desc: 'No containers pretending to be VMs. Real hardware isolation' },
]

function PerformanceSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const [showVs, setShowVs] = useState(false)

  return (
    <section
      ref={ref}
      className="py-20 px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left — benchmarks */}
        <div>
          <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
            PERFORMANCE
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Built on bare metal performance
          </h2>
          <p className="mt-4" style={{ fontSize: 14, color: 'var(--t-med)' }}>
            Every plan runs on AMD EPYC Gen4 or Intel Xeon processors with all-NVMe storage.
          </p>

          <div className="mt-6 mb-8 flex items-center gap-2">
            <button
              onClick={() => setShowVs(!showVs)}
              className="text-[11px] inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full transition-colors"
              style={{
                background: showVs ? 'var(--brand-d)' : 'var(--nl-2)',
                border: `1px solid ${showVs ? 'var(--brand-b)' : 'var(--b-default)'}`,
                color: showVs ? 'var(--brand)' : 'var(--t-med)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: showVs ? 'var(--brand)' : 'var(--t-low)' }}
              />
              vs. industry average
            </button>
          </div>

          <div className="space-y-4">
            {BENCHMARKS.map((b, idx) => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 12, color: 'var(--t-med)' }}>{b.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{b.value}</span>
                </div>
                <div
                  className="relative rounded-full overflow-hidden"
                  style={{ background: 'var(--b-default)', height: 6 }}
                >
                  {showVs && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: 'var(--t-off)',
                        width: inView ? `${b.vs}%` : '0%',
                        transition: `width 1.2s cubic-bezier(.16,1,.3,1) ${idx * 80}ms`,
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--brand), #a8e620)',
                      width: inView ? `${b.pct}%` : '0%',
                      transition: `width 1.4s cubic-bezier(.16,1,.3,1) ${idx * 80 + 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — features */}
        <div>
          <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
            WHY NETLAYER
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            The infrastructure difference
          </h2>

          <div className="mt-8 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                >
                  <f.Icon size={14} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--t-low)', lineHeight: 1.55 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.6 — GlobalNetworkSection
   ════════════════════════════════════════════════════════════ */
interface RegionPin { city: string; country: string; flag: string; lat: number; lng: number; latency: number }

const REGIONS: RegionPin[] = [
  { city: 'Mumbai',      country: 'IN', flag: '🇮🇳', lat: 19.08,  lng: 72.88,  latency: 12 },
  { city: 'Delhi',       country: 'IN', flag: '🇮🇳', lat: 28.61,  lng: 77.21,  latency: 14 },
  { city: 'Singapore',   country: 'SG', flag: '🇸🇬', lat: 1.35,   lng: 103.82, latency: 22 },
  { city: 'Tokyo',       country: 'JP', flag: '🇯🇵', lat: 35.68,  lng: 139.69, latency: 38 },
  { city: 'Seoul',       country: 'KR', flag: '🇰🇷', lat: 37.56,  lng: 126.97, latency: 36 },
  { city: 'Sydney',      country: 'AU', flag: '🇦🇺', lat: -33.87, lng: 151.21, latency: 64 },
  { city: 'Frankfurt',   country: 'DE', flag: '🇩🇪', lat: 50.11,  lng: 8.68,   latency: 88 },
  { city: 'London',      country: 'GB', flag: '🇬🇧', lat: 51.51,  lng: -0.13,  latency: 92 },
  { city: 'Paris',       country: 'FR', flag: '🇫🇷', lat: 48.86,  lng: 2.35,   latency: 90 },
  { city: 'Amsterdam',   country: 'NL', flag: '🇳🇱', lat: 52.37,  lng: 4.90,   latency: 90 },
  { city: 'New York',    country: 'US', flag: '🇺🇸', lat: 40.71,  lng: -74.01, latency: 110 },
  { city: 'Chicago',     country: 'US', flag: '🇺🇸', lat: 41.88,  lng: -87.63, latency: 112 },
  { city: 'Los Angeles', country: 'US', flag: '🇺🇸', lat: 34.05,  lng: -118.24,latency: 130 },
  { city: 'São Paulo',   country: 'BR', flag: '🇧🇷', lat: -23.55, lng: -46.63, latency: 162 },
  { city: 'Dubai',       country: 'AE', flag: '🇦🇪', lat: 25.20,  lng: 55.27,  latency: 30 },
]

const projectToSvg = (lat: number, lng: number) => {
  // Equirectangular projection into 800x400 viewbox
  const x = ((lng + 180) / 360) * 800
  const y = ((90 - lat) / 180) * 400
  return { x, y }
}

function GlobalNetworkSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="NETWORK"
          title="15 regions across 5 continents"
          subtitle="Deploy close to your users. Every region has private networking and DDoS protection."
        />

        <div className="mt-14 relative w-full max-w-5xl mx-auto" style={{ aspectRatio: '2/1' }}>
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.6" fill="var(--b-strong)" />
              </pattern>
            </defs>
            {/* Simplified continent silhouettes (own design — abstract, not copied) */}
            <g fill="url(#dotGrid)">
              <path d="M 65,135 C 100,80 200,75 250,115 C 285,148 290,200 270,232 L 230,255 L 175,255 L 120,225 L 90,190 Z" />
              <path d="M 235,275 C 270,265 320,295 320,350 L 305,395 L 270,400 L 248,360 L 240,310 Z" />
              <path d="M 360,110 C 390,90 440,95 460,120 L 450,160 L 415,170 L 380,155 Z" />
              <path d="M 395,180 C 435,170 470,200 480,250 L 470,330 L 440,365 L 410,345 L 395,290 Z" />
              <path d="M 480,170 C 510,160 555,180 575,210 L 580,250 L 555,265 L 520,255 L 500,220 Z" />
              <path d="M 545,100 C 605,75 700,80 745,125 C 770,165 760,225 725,235 L 660,225 L 605,205 L 565,170 Z" />
              <path d="M 660,330 C 695,320 740,335 750,360 L 740,395 L 700,400 L 670,375 Z" />
            </g>

            {/* Connection arcs between hubs */}
            {[
              [REGIONS[0], REGIONS[2]],   // Mumbai → Singapore
              [REGIONS[2], REGIONS[3]],   // Singapore → Tokyo
              [REGIONS[6], REGIONS[10]],  // Frankfurt → NY
              [REGIONS[10], REGIONS[12]], // NY → LA
              [REGIONS[14], REGIONS[0]],  // Dubai → Mumbai
            ].map(([a, b], idx) => {
              const p1 = projectToSvg(a.lat, a.lng)
              const p2 = projectToSvg(b.lat, b.lng)
              const mx = (p1.x + p2.x) / 2
              const my = Math.min(p1.y, p2.y) - Math.abs(p2.x - p1.x) * 0.18
              return (
                <path
                  key={idx}
                  d={`M ${p1.x} ${p1.y} Q ${mx} ${my}, ${p2.x} ${p2.y}`}
                  stroke="var(--brand)"
                  strokeWidth="0.6"
                  strokeOpacity="0.25"
                  fill="none"
                />
              )
            })}

            {/* Region pins */}
            {REGIONS.map((r, i) => {
              const { x, y } = projectToSvg(r.lat, r.lng)
              return (
                <g key={r.city}>
                  <circle
                    cx={x} cy={y} r="12"
                    fill="none"
                    stroke="var(--brand)"
                    strokeOpacity="0.5"
                    style={{ animation: `nl-pulse-ring 2.4s cubic-bezier(.16,1,.3,1) infinite ${i * 0.15}s`, transformOrigin: `${x}px ${y}px` }}
                  />
                  <circle cx={x} cy={y} r="8" fill="var(--brand-d)" stroke="var(--brand-b)" strokeWidth="1" />
                  <circle cx={x} cy={y} r="3.5" fill="var(--brand)" />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {REGIONS.map((r) => (
            <div
              key={r.city}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full"
              style={{
                background: 'var(--nl-2)',
                border: '1px solid var(--b-default)',
                fontSize: 12,
                color: 'var(--t-med)',
                cursor: 'default',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-default)')}
            >
              <span>{r.flag}</span>
              {r.city}
              <span style={{ color: 'var(--t-low)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {r.latency}ms
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.7 — PricingSection (also reused on /pricing)
   ════════════════════════════════════════════════════════════ */
interface Plan {
  slug: string
  cpu: number
  ram: number
  disk: number
  bw: number
  monthly: number
  hourly: number
  popular?: boolean
}

const PLANS: Plan[] = [
  { slug: 'c2.nano',    cpu: 1,  ram: 1,  disk: 25,   bw: 1,  monthly: 99,   hourly: 0.14 },
  { slug: 'c2.small',   cpu: 1,  ram: 2,  disk: 40,   bw: 1,  monthly: 149,  hourly: 0.21 },
  { slug: 'c2.medium',  cpu: 2,  ram: 4,  disk: 80,   bw: 2,  monthly: 299,  hourly: 0.41 },
  { slug: 'c3.large',   cpu: 4,  ram: 8,  disk: 160,  bw: 3,  monthly: 599,  hourly: 0.82, popular: true },
  { slug: 'c3.xlarge',  cpu: 8,  ram: 16, disk: 320,  bw: 5,  monthly: 1099, hourly: 1.51 },
  { slug: 'c4.2xlarge', cpu: 16, ram: 32, disk: 640,  bw: 8,  monthly: 1999, hourly: 2.74 },
]

export function PricingSection({ standalone = false }: { standalone?: boolean }) {
  const [billing, setBilling] = useState<'monthly' | 'hourly'>('monthly')
  const [tab, setTab] = useState<'vps' | 'bare' | 'gpu' | 'storage'>('vps')

  return (
    <section
      className="py-20 px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: standalone ? undefined : '1px solid var(--b-subtle)',
        borderBottom: standalone ? undefined : '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="PRICING"
          title="Simple, transparent pricing"
          subtitle="No hidden fees. No surprises. Scale up or down anytime."
        />

        {/* Billing toggle */}
        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex items-center p-1 rounded-md"
            style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)' }}
          >
            {(['monthly', 'hourly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="px-4 h-8 rounded text-[12px] font-medium capitalize transition-colors cursor-pointer"
                style={{
                  background: billing === b ? 'var(--nl-4)' : 'transparent',
                  color: billing === b ? 'var(--t-hi)' : 'var(--t-low)',
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex justify-center gap-1 flex-wrap">
          {([
            { key: 'vps',     label: 'Cloud VPS' },
            { key: 'bare',    label: 'Bare Metal' },
            { key: 'gpu',     label: 'GPU' },
            { key: 'storage', label: 'Storage' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 h-8 text-[12px] rounded transition-colors cursor-pointer"
              style={{
                color: tab === t.key ? 'var(--brand)' : 'var(--t-low)',
                background: tab === t.key ? 'var(--brand-d)' : 'transparent',
                border: tab === t.key ? '1px solid var(--brand-b)' : '1px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Plan grid */}
        {tab === 'vps' && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANS.map((p) => (
              <div
                key={p.slug}
                className="nl-card nl-card-hover relative p-5"
                style={{ borderLeft: p.popular ? '2px solid var(--brand)' : undefined }}
              >
                {p.popular && (
                  <span
                    className="absolute right-4 top-4 px-2 h-5 inline-flex items-center text-[10px] tracking-wider rounded"
                    style={{ background: 'var(--brand-d)', color: 'var(--brand)', border: '1px solid var(--brand-b)' }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
                  {p.slug}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.02em' }}>
                    ₹{billing === 'monthly' ? p.monthly : p.hourly}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--t-low)' }}>
                    /{billing === 'monthly' ? 'mo' : 'hr'}
                  </span>
                </div>
                <div
                  className="mt-1 text-[11px]"
                  style={{ color: 'var(--t-low)' }}
                >
                  {billing === 'monthly' ? `or ₹${p.hourly}/hr` : `${(p.hourly * 730).toFixed(0)} per month`}
                </div>

                <div className="mt-5 space-y-2 text-[12px]" style={{ color: 'var(--t-med)' }}>
                  <div className="flex items-center gap-2"><Cpu          size={13} style={{ color: 'var(--t-low)' }} /> {p.cpu} vCPU</div>
                  <div className="flex items-center gap-2"><MemoryStick  size={13} style={{ color: 'var(--t-low)' }} /> {p.ram} GB RAM</div>
                  <div className="flex items-center gap-2"><HardDrive    size={13} style={{ color: 'var(--t-low)' }} /> {p.disk} GB NVMe</div>
                  <div className="flex items-center gap-2"><Wifi         size={13} style={{ color: 'var(--t-low)' }} /> {p.bw} TB Bandwidth</div>
                </div>

                <div className="my-5" style={{ height: 1, background: 'var(--b-default)' }} />

                <ul className="space-y-1.5 text-[11px]" style={{ color: 'var(--t-med)' }}>
                  <li className="flex items-start gap-2"><Check size={11} style={{ color: 'var(--brand)' }} className="mt-0.5" /> Free IPv6 &amp; private network</li>
                  <li className="flex items-start gap-2"><Check size={11} style={{ color: 'var(--brand)' }} className="mt-0.5" /> Hardware DDoS protection</li>
                  <li className="flex items-start gap-2"><Check size={11} style={{ color: 'var(--brand)' }} className="mt-0.5" /> Full root access</li>
                </ul>

                <Link
                  to={`/register?plan=${p.slug}`}
                  className="mt-5 w-full inline-flex items-center justify-center h-10 rounded-md text-[13px] font-medium transition-colors cursor-pointer"
                  style={{
                    background: p.popular ? 'var(--brand)' : 'var(--nl-2)',
                    color: p.popular ? 'var(--nl-0)' : 'var(--t-hi)',
                    border: p.popular ? '1px solid var(--brand)' : '1px solid var(--b-default)',
                  }}
                >
                  Deploy this plan
                </Link>
              </div>
            ))}
          </div>
        )}

        {tab !== 'vps' && (
          <div
            className="mt-10 nl-card p-12 text-center"
            style={{ color: 'var(--t-med)' }}
          >
            <div className="text-[18px] font-medium mb-2">Coming soon</div>
            <div className="text-[13px]" style={{ color: 'var(--t-low)' }}>
              {tab === 'bare' && 'Bare metal pricing rolls out this quarter. Get notified at /register.'}
              {tab === 'gpu' && 'GPU pricing is finalised — A100 from ₹1,999/mo, H100 from ₹3,999/mo. Full table coming online soon.'}
              {tab === 'storage' && 'Storage pricing: Block ₹40/GB · Object ₹5/GB · Snapshots ₹20/GB. Detailed page in progress.'}
            </div>
          </div>
        )}

        {/* Comparison table */}
        <div className="mt-16">
          <h3 className="text-center mb-6" style={{ fontSize: 20, fontWeight: 600 }}>How we compare</h3>
          <div
            className="overflow-x-auto rounded-xl"
            style={{ border: '1px solid var(--b-default)', background: 'var(--nl-2)' }}
          >
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--b-default)' }}>
                  <th className="text-left p-4" style={{ color: 'var(--t-low)', fontWeight: 500 }}>Feature</th>
                  <th className="text-center p-4" style={{ color: 'var(--brand)', fontWeight: 600 }}>NetLayer</th>
                  <th className="text-center p-4" style={{ color: 'var(--t-low)', fontWeight: 500 }}>DigitalOcean</th>
                  <th className="text-center p-4" style={{ color: 'var(--t-low)', fontWeight: 500 }}>Vultr</th>
                  <th className="text-center p-4" style={{ color: 'var(--t-low)', fontWeight: 500 }}>Linode</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['4 vCPU / 8GB / 160GB', '₹599', '₹1,200', '₹1,100', '₹1,150'],
                  ['NVMe SSD',             '✓',     '✗',      '✓',      '✗'],
                  ['Free DDoS',            '✓',     '✓',      '✗',      '✗'],
                  ['30s deploy',           '✓',     '✗',      '✗',      '✗'],
                  ['Free IPv6',            '✓',     '✓',      '✓',      '✓'],
                  ['India region',         '✓',     '✗',      '✓',      '✗'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < 5 ? '1px solid var(--b-subtle)' : undefined }}>
                    <td className="p-4" style={{ color: 'var(--t-med)' }}>{row[0]}</td>
                    {row.slice(1).map((cell, j) => (
                      <td
                        key={j}
                        className="p-4 text-center"
                        style={{
                          color: j === 0 ? 'var(--brand)' : 'var(--t-low)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: j === 0 ? 600 : 400,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.8 — DeveloperSection
   ════════════════════════════════════════════════════════════ */
const CODE_REST = `curl -X POST https://api.netlayer.com/v1/servers \\
  -H "Authorization: Bearer $NL_KEY" \\
  -d '{
    "region": "mumbai",
    "plan":   "c3.large",
    "image":  "ubuntu-22.04"
  }'`

const CODE_CLI = `npm install -g @netlayer/cli
nl login

nl server create \\
  --region mumbai \\
  --plan   c3.large`

const CODE_TF = `resource "netlayer_server" "web" {
  region   = "mumbai"
  plan     = "c3.large"
  image    = "ubuntu-22.04"
  ssh_keys = [var.ssh_key_id]
}

output "ip" {
  value = netlayer_server.web.ipv4
}`

function DeveloperSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="DEVELOPER FIRST"
          title="Every interface you need"
          subtitle="OpenAPI-driven. CLI, REST, and Terraform always in sync."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <CodeCard title="REST API" code={CODE_REST} link={{ to: '/docs#api', label: 'Full API reference' }} />
          <CodeCard title="CLI (npm / brew)" code={CODE_CLI} link={{ to: '/docs#cli', label: 'Install docs' }} />
          <CodeCard title="Terraform provider" code={CODE_TF} link={{ to: '/docs#terraform', label: 'Provider docs' }} />
        </div>
      </div>
    </section>
  )
}

function CodeCard({ title, code, link }: { title: string; code: string; link: { to: string; label: string } }) {
  const [copied, setCopied] = useState(false)
  return (
    <div
      className="nl-card transition-all"
      style={{ overflow: 'hidden' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-b)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--b-default)'
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.transform = ''
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--b-default)' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="p-1.5 rounded"
          style={{ color: 'var(--t-low)' }}
          aria-label="Copy"
        >
          {copied ? <Check size={13} style={{ color: 'var(--c-green)' }} /> : <Copy size={13} />}
        </button>
      </div>
      <pre
        className="px-4 py-4 overflow-x-auto"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.65,
          color: 'var(--t-hi)',
          minHeight: 200,
        }}
      >
        <SyntaxedCode raw={code} />
      </pre>
      <Link
        to={link.to}
        className="block px-4 py-3 transition-colors"
        style={{
          borderTop: '1px solid var(--b-default)',
          fontSize: 12,
          color: 'var(--brand)',
        }}
      >
        {link.label} →
      </Link>
    </div>
  )
}

function SyntaxedCode({ raw }: { raw: string }) {
  // Lightweight tokeniser — colours keywords, strings, numbers, comments.
  const tokens = useMemo(() => {
    const out: { text: string; cls: string }[] = []
    const re = /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(#.*$)|(\/\/.*$)|(\b(?:resource|output|var|true|false|null|export|import|const|let)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z_]{2,}\b)/gm
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(raw))) {
      if (m.index > last) out.push({ text: raw.slice(last, m.index), cls: '' })
      const cls =
        m[1] || m[2] ? 'sx-str' :
        m[3] || m[4] ? 'sx-com' :
        m[5]         ? 'sx-kw'  :
        m[6]         ? 'sx-num' :
        m[7]         ? 'sx-env' : ''
      out.push({ text: m[0], cls })
      last = m.index + m[0].length
    }
    if (last < raw.length) out.push({ text: raw.slice(last), cls: '' })
    return out
  }, [raw])

  return (
    <>
      <style>{`
        .sx-str { color: var(--c-cyan); }
        .sx-com { color: var(--t-low); font-style: italic; }
        .sx-kw  { color: var(--brand); }
        .sx-num { color: var(--c-amber); }
        .sx-env { color: var(--c-purple); }
      `}</style>
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={t.cls}>{t.text}</span>
        ))}
      </code>
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   2.9 — MarketplaceSection
   ════════════════════════════════════════════════════════════ */
const APPS = [
  { name: 'WordPress',   emoji: '📝', cat: 'cms',          tint: 'var(--c-blue-d)'   },
  { name: 'Ghost',       emoji: '👻', cat: 'cms',          tint: 'var(--c-purple-d)' },
  { name: 'Nextcloud',   emoji: '☁',  cat: 'productivity', tint: 'var(--c-cyan-d)'   },
  { name: 'GitLab CE',   emoji: '🦊', cat: 'dev-tools',    tint: 'var(--c-amber-d)'  },
  { name: 'VS Code',     emoji: '💻', cat: 'dev-tools',    tint: 'var(--c-blue-d)'   },
  { name: 'Jupyter',     emoji: '📊', cat: 'data',         tint: 'var(--c-amber-d)'  },
  { name: 'Docker CE',   emoji: '🐳', cat: 'containers',   tint: 'var(--c-blue-d)'   },
  { name: 'Node.js',     emoji: '🟢', cat: 'runtime',      tint: 'var(--c-green-d)'  },
  { name: 'LAMP Stack',  emoji: '⚡', cat: 'stack',        tint: 'var(--c-amber-d)'  },
  { name: 'Minecraft',   emoji: '⛏',  cat: 'gaming',       tint: 'var(--c-green-d)'  },
  { name: 'PostgreSQL',  emoji: '🐘', cat: 'database',     tint: 'var(--c-blue-d)'   },
  { name: 'Redis',       emoji: '🔴', cat: 'cache',        tint: 'var(--c-red-d)'    },
]

function MarketplaceSection() {
  return (
    <section
      className="py-20 px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="MARKETPLACE"
          title="One-click app deployment"
          subtitle="Deploy WordPress, Docker, GitLab, and more in under 60 seconds"
        />

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {APPS.map((a) => (
            <Link
              key={a.name}
              to={`/dashboard/marketplace?app=${a.name.toLowerCase()}`}
              className="nl-card nl-card-hover group p-4 text-center cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center text-[20px]"
                style={{ background: a.tint }}
              >
                {a.emoji}
              </div>
              <div className="mt-3" style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
              <div className="mt-0.5 text-[11px] capitalize" style={{ color: 'var(--t-low)' }}>{a.cat}</div>
              <div
                className="mt-3 inline-flex items-center justify-center h-7 px-3 rounded text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'var(--brand-d)',
                  color: 'var(--brand)',
                  border: '1px solid var(--brand-b)',
                }}
              >
                Deploy →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/dashboard/marketplace"
            style={{ fontSize: 13, color: 'var(--brand)' }}
          >
            View all apps →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.10 — TrustSection
   ════════════════════════════════════════════════════════════ */
const COMPLIANCE = [
  { Icon: BadgeCheck, title: 'SOC 2 Type II',    sub: 'Annual third-party audit' },
  { Icon: Shield,     title: 'ISO 27001',         sub: 'Information security' },
  { Icon: Lock,       title: 'GDPR compliant',    sub: 'Full data subject rights' },
  { Icon: Award,      title: 'PCI DSS Ready',     sub: 'Card-data tokenisation' },
  { Icon: Eye,        title: 'HIPAA Ready',       sub: 'BAA available on request' },
  { Icon: Sla,        title: '99.99% SLA',        sub: 'Backed by service credits' },
]

function TrustSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Enterprise-grade security &amp; compliance
          </h2>
          <p className="mt-4" style={{ fontSize: 14, color: 'var(--t-med)' }}>
            Audited yearly. Encrypted everywhere. Designed for regulated workloads.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {COMPLIANCE.map((c) => (
              <div key={c.title} className="nl-card p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                  >
                    <c.Icon size={14} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.title}</div>
                    <div className="mt-0.5" style={{ fontSize: 11, color: 'var(--t-low)' }}>{c.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PlatformLiveStats />
      </div>
    </section>
  )
}

interface PlatformStats {
  serversDeployedToday: number
  activeServers: number
  regionsOnline: number
  lastDeploySeconds: number | null
  totalUsers: number
  uptimePercent: number
}

function PlatformLiveStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  useEffect(() => {
    const fetchStats = () => {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
      fetch(`${apiUrl}/platform/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.data && setStats(j.data))
        .catch(() => undefined)
    }
    fetchStats()
    const t = window.setInterval(fetchStats, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="nl-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full nl-pulse-dot" style={{ background: 'var(--c-green)' }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Platform status</span>
        </div>
        <Link to="/status" style={{ fontSize: 12, color: 'var(--brand)' }}>View status →</Link>
      </div>

      <div className="space-y-3">
        <StatRow label="Servers deployed today"        value={stats ? stats.serversDeployedToday.toLocaleString('en-IN') : '—'} />
        <StatRow label="Active servers"                value={stats ? stats.activeServers.toLocaleString('en-IN')        : '—'} />
        <StatRow label="Regions online"                value={stats ? `${stats.regionsOnline}/15`                         : '—'} />
        <StatRow label="Last deploy"                   value={stats?.lastDeploySeconds ? `${stats.lastDeploySeconds}s` : '—'} />
        <StatRow label="Uptime (30 days)"              value={stats ? `${stats.uptimePercent.toFixed(2)}%`                : '—'} />
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--b-subtle)' }}>
      <span style={{ fontSize: 12, color: 'var(--t-low)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--t-hi)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   2.11 — TestimonialsSection
   ════════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    quote: 'The 30-second deploy time is not marketing copy. I timed it. NetLayer beats every other provider I\'ve used on raw speed.',
    name: 'Rahul Sharma', title: 'CTO', company: 'TechStartup India',
  },
  {
    quote: 'Finally an Indian cloud provider that doesn\'t compromise on performance. The Mumbai region latency is exceptional.',
    name: 'Priya Nair', title: 'DevOps Lead', company: 'FinTech Corp',
  },
  {
    quote: 'The Terraform provider and CLI work exactly as documented. That alone puts NetLayer ahead of half the market.',
    name: 'Amit Patel', title: 'SRE', company: 'SaaS Company',
  },
]

function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-1)' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }}>
          What developers say
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="nl-card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5" style={{ color: 'var(--c-amber)' }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
              </div>
              <blockquote
                style={{ fontSize: 14, color: 'var(--t-med)', lineHeight: 1.6, fontStyle: 'italic' }}
              >
                "{t.quote}"
              </blockquote>
              <figcaption className="flex items-center gap-3 mt-auto pt-4" style={{ borderTop: '1px solid var(--b-subtle)' }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{ background: 'var(--brand-d)', color: 'var(--brand)', border: '1px solid var(--brand-b)' }}
                >
                  {t.name.split(' ').map((p) => p[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--t-hi)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t-low)' }}>{t.title} · {t.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.12 — CTASection
   ════════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section
      className="relative overflow-hidden text-center py-24 px-4 sm:px-6"
      style={{
        background: `radial-gradient(ellipse 60% 80% at 50% 50%, var(--brand-d), transparent 70%), var(--nl-0)`,
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '-10%', width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'var(--brand)',
          opacity: 0.05,
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%', right: '-10%', width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'var(--brand)',
          opacity: 0.05,
          filter: 'blur(100px)',
        }}
      />

      <h2
        className="relative"
        style={{
          fontSize: 'clamp(32px, 5vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-.02em',
          lineHeight: 1.15,
        }}
      >
        Start building in 60 seconds
      </h2>
      <p className="relative mt-4 max-w-xl mx-auto" style={{ fontSize: 16, color: 'var(--t-med)' }}>
        Deploy your first server free. ₹3,500 in credits for new accounts.
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/register" className="nl-btn-primary !h-12 !px-6 !text-[15px]">
          Create free account <ArrowRight size={15} />
        </Link>
        <a href="mailto:sales@netlayer.com" className="nl-btn-ghost !h-12 !px-6 !text-[15px]">
          Talk to sales
        </a>
      </div>
      <p className="relative mt-5 text-[12px]" style={{ color: 'var(--t-low)' }}>
        No credit card required
      </p>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   2.13 — LandingFooter
   ════════════════════════════════════════════════════════════ */
function LandingFooter() {
  return (
    <footer
      className="px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        paddingTop: 'var(--sp-16)',
        paddingBottom: 'var(--sp-8)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" aria-hidden>
              <polygon points="16,3 27,9 27,22 16,28 5,22 5,9" stroke="var(--brand)" strokeWidth="1.5" fill="none" />
              <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="var(--brand-d)" stroke="var(--brand)" strokeWidth="1" />
              <circle cx="16" cy="16" r="2.5" fill="var(--brand)" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600 }}>NetLayer Cloud</span>
          </Link>
          <p className="mt-4" style={{ fontSize: 12, color: 'var(--t-low)', lineHeight: 1.6 }}>
            Production-grade VPS hosting for developers and teams.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <FooterIcon Icon={Twitter}      href="https://twitter.com/netlayer" />
            <FooterIcon Icon={Github}       href="https://github.com/Netlayer-global/Netlayer-cloud" />
            <FooterIcon Icon={Linkedin}     href="https://linkedin.com/company/netlayer" />
            <FooterIcon Icon={MessageCircle} href="https://discord.gg/netlayer" />
          </div>
        </div>

        <FooterCol title="Products" links={[
          ['Cloud VPS', '/pricing#compute'], ['Bare Metal', '/pricing#bare'], ['GPU Cloud', '/pricing#gpu'],
          ['Kubernetes', '/kubernetes'], ['Block Storage', '/pricing#block'], ['Object Storage', '/pricing#object'],
          ['Managed DB', '/pricing#db'], ['Load Balancers', '/pricing#lb'],
        ]} />

        <FooterCol title="Company" links={[
          ['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'],
          ['Press', '/about#press'], ['Legal', '/legal/terms'],
          ['Privacy', '/legal/privacy'], ['Terms', '/legal/terms'],
        ]} />

        <FooterCol title="Resources" links={[
          ['Documentation', '/docs'], ['API Reference', '/docs#api'], ['Changelog', '/blog'],
          ['Status', '/status'], ['Community', 'https://discord.gg/netlayer'],
          ['Support', 'mailto:support@netlayer.com'], ['Abuse Report', '/abuse-report'], ['SLA', '/legal/terms'],
        ]} />
      </div>

      <div
        className="max-w-7xl mx-auto mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3"
        style={{ borderTop: '1px solid var(--b-subtle)' }}
      >
        <p style={{ fontSize: 11, color: 'var(--t-low)' }}>
          © 2024 NetLayer Cloud Pvt. Ltd. All rights reserved.
        </p>
        <p style={{ fontSize: 11, color: 'var(--t-low)' }}>
          Made in India 🇮🇳 · Serving globally
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3
        className="text-[10px] uppercase tracking-[.18em] mb-4"
        style={{ color: 'var(--t-low)' }}
      >
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            {to.startsWith('http') || to.startsWith('mailto:') ? (
              <a
                href={to}
                target={to.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                style={{ fontSize: 12, color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              >
                {label}
              </a>
            ) : (
              <Link
                to={to}
                style={{ fontSize: 12, color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              >
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterIcon({ Icon, href }: { Icon: any; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
      style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', color: 'var(--t-low)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--t-hi)'
        e.currentTarget.style.borderColor = 'var(--b-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--t-low)'
        e.currentTarget.style.borderColor = 'var(--b-default)'
      }}
      aria-label="Social link"
    >
      <Icon size={14} />
    </a>
  )
}

/* ════════════════════════════════════════════════════════════
   Default export — full landing page
   ════════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div className="nl-v3">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <ProductsSection />
      <PerformanceSection />
      <GlobalNetworkSection />
      <PricingSection />
      <DeveloperSection />
      <MarketplaceSection />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

// Re-export LandingNav + LandingFooter for the supporting public pages
// (Pricing, Network, Status, Docs, About, Blog) so they share the same chrome.
export { LandingNav, LandingFooter }

// Lint silencing — Box / Container / Plug / Mail / FileText / Activity are
// unused in landing today but kept imported so future sections can grab
// them without re-importing.
void Box; void Container; void Plug; void Mail; void FileText; void Activity
void Boxes; void Monitor; void Search; void ChevronRight
