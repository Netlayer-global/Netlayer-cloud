import { Link } from 'react-router-dom'
import {
  Search, BookOpen, Code, Terminal, Server, Key, CreditCard, Network,
  Hexagon, Database, GitMerge, Globe,
} from 'lucide-react'
import { LandingNav, LandingFooter, PageHero, CtaBand } from '../../components/landing-v3'
import { useSeo } from '../../hooks/useSeo'

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

interface Card {
  Icon: any
  title: string
  desc: string
  to: string
  accent: string
}

const GETTING_STARTED: Card[] = [
  { Icon: Server,     title: 'Deploy your first server',  desc: 'Step-by-step from sign-up to ssh.',          to: `${DASHBOARD_URL}/register`,        accent: 'var(--a-lime)' },
  { Icon: Key,        title: 'Add an SSH key',            desc: 'Sign requests without passwords.',           to: `${DASHBOARD_URL}/dashboard/ssh-keys`, accent: 'var(--a-cyan)' },
  { Icon: Network,    title: 'Private network (VPC)',     desc: 'Isolated networks for multi-server stacks.', to: `${DASHBOARD_URL}/dashboard/vpc`,    accent: 'var(--a-violet)' },
  { Icon: CreditCard, title: 'Add credit & billing',      desc: 'Top up via Razorpay or Stripe.',             to: `${DASHBOARD_URL}/dashboard/billing`, accent: 'var(--a-blue)' },
]

const DEV_RESOURCES: Card[] = [
  { Icon: Code,     title: 'REST API',  desc: 'Full reference with examples.',          to: `${DASHBOARD_URL}/dashboard`, accent: 'var(--a-lime)' },
  { Icon: Terminal, title: 'CLI tool',  desc: 'Manage everything from your terminal.',  to: `${DASHBOARD_URL}/dashboard`, accent: 'var(--a-cyan)' },
  { Icon: BookOpen, title: 'Terraform', desc: 'Infrastructure as code.',                to: `${DASHBOARD_URL}/dashboard`, accent: 'var(--a-violet)' },
]

const POPULAR: Card[] = [
  { Icon: Hexagon,   title: 'Kubernetes',     desc: 'Managed K8s clusters.',                   to: '/kubernetes',                          accent: 'var(--a-violet)' },
  { Icon: Database,  title: 'Object storage', desc: 'S3-compatible buckets.',                  to: `${DASHBOARD_URL}/dashboard/storage`,   accent: 'var(--a-cyan)' },
  { Icon: GitMerge,  title: 'Load balancer',  desc: 'HTTP/TCP balancers with health checks.',  to: `${DASHBOARD_URL}/dashboard`,           accent: 'var(--a-blue)' },
  { Icon: Database,  title: 'Managed DB',     desc: 'Postgres, MySQL, Redis.',                 to: `${DASHBOARD_URL}/dashboard/databases`, accent: 'var(--a-lime)' },
  { Icon: Network,   title: 'VPC',            desc: 'Private networks.',                       to: `${DASHBOARD_URL}/dashboard/vpc`,       accent: 'var(--a-cyan)' },
  { Icon: Globe,     title: 'DNS',            desc: 'Authoritative DNS hosting.',              to: `${DASHBOARD_URL}/dashboard/dns`,       accent: 'var(--a-violet)' },
]

export default function DocsPage() {
  useSeo({
    title: 'Documentation',
    description: 'Guides, API reference, and example code for every NetLayer product.',
    path: '/docs',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Documentation"
        title="Everything you need"
        accent="to ship."
        subtitle="Guides, API reference, and example code for every NetLayer product."
      >
        <div
          className="flex items-center gap-3 px-4 h-12 w-full max-w-md"
          style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', borderRadius: 'var(--r-lg)' }}
        >
          <Search size={16} style={{ color: 'var(--t-low)' }} />
          <input
            type="search"
            placeholder="Search docs (coming soon)…"
            className="flex-1 bg-transparent border-none outline-none"
            style={{ color: 'var(--t-hi)', fontSize: 14 }}
            disabled
          />
          <kbd className="nl-mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--nl-1)', border: '1px solid var(--b-default)', color: 'var(--t-low)' }}>⌘K</kbd>
        </div>
      </PageHero>

      <Section tag="Getting started" title="Start here" cards={GETTING_STARTED} bg="var(--nl-1)" />
      <Section tag="API & developer" title="Build with our APIs" cards={DEV_RESOURCES} bg="var(--nl-0)" />
      <Section tag="Popular guides" title="Common workloads" cards={POPULAR} bg="var(--nl-1)" />

      <CtaBand title="Need a hand?" subtitle="Open a ticket from your dashboard, or email support@netlayer.com — we reply fast." primaryLabel="Open dashboard" secondaryLabel="Contact us" secondaryTo="/contact" />
      <LandingFooter />
    </div>
  )
}

function Section({ tag, title, cards, bg }: { tag: string; title: string; cards: Card[]; bg: string }) {
  return (
    <section style={{ background: bg, borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
        <div style={{ marginBottom: 'clamp(24px,3vw,36px)' }}>
          <div className="nl-eyebrow" style={{ marginBottom: 12, color: 'var(--brand)' }}>{tag}</div>
          <h2 className="nl-display" style={{ fontSize: 'clamp(24px,3vw,38px)', color: 'var(--t-hi)' }}>{title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => {
            const external = c.to.startsWith('http')
            const inner = (
              <>
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + c.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + c.accent + ' 28%, transparent)', marginBottom: 16 }}
                >
                  <c.Icon size={20} style={{ color: c.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)', marginBottom: 7 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.6 }}>{c.desc}</div>
              </>
            )
            const style: React.CSSProperties = { borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 24, display: 'block' }
            return external ? (
              <a key={c.title} href={c.to} className="nl-card-hover cursor-pointer" style={style}>{inner}</a>
            ) : (
              <Link key={c.title} to={c.to} className="nl-card-hover cursor-pointer" style={style}>{inner}</Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
