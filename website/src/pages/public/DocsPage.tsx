import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, BookOpen, Code, Terminal, Server, Key, CreditCard, Network,
  Hexagon, Database, GitMerge, Globe, Box,
} from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'

interface Card {
  Icon: any
  title: string
  desc: string
  to: string
}

const GETTING_STARTED: Card[] = [
  { Icon: Server,     title: 'Deploy your first server',  desc: 'Step-by-step from sign-up to ssh.',          to: '/register' },
  { Icon: Key,        title: 'Add an SSH key',            desc: 'Sign requests without passwords.',           to: '/dashboard/ssh-keys' },
  { Icon: Network,    title: 'Private network (VPC)',     desc: 'Isolated networks for multi-server stacks.', to: '/dashboard/vpc' },
  { Icon: CreditCard, title: 'Add credit & billing',      desc: 'Top up via Razorpay or Stripe.',             to: '/dashboard/billing' },
]

const DEV_RESOURCES: Card[] = [
  { Icon: Code,     title: 'REST API',  desc: 'Full reference with examples.',          to: '/api/docs' },
  { Icon: Terminal, title: 'CLI tool',  desc: 'Manage everything from your terminal.',  to: '/docs#cli' },
  { Icon: BookOpen, title: 'Terraform', desc: 'Infrastructure as code.',                to: '/docs#terraform' },
]

const POPULAR: Card[] = [
  { Icon: Hexagon,   title: 'Kubernetes',     desc: 'Managed K8s clusters.',          to: '/kubernetes' },
  { Icon: Database,  title: 'Object storage', desc: 'S3-compatible buckets.',         to: '/dashboard/storage/object' },
  { Icon: GitMerge,  title: 'Load balancer',  desc: 'HTTP/TCP balancers with health checks.', to: '/dashboard/load-balancers' },
  { Icon: Database,  title: 'Managed DB',     desc: 'Postgres, MySQL, Redis.',        to: '/dashboard/databases' },
  { Icon: Network,   title: 'VPC',            desc: 'Private networks.',              to: '/dashboard/vpc' },
  { Icon: Globe,     title: 'DNS',            desc: 'Authoritative DNS hosting.',     to: '/dashboard/dns' },
]

export default function DocsPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{ border: '1px solid var(--brand-b)', background: 'var(--brand-d)', color: 'var(--brand)' }}
          >
            Documentation
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            Everything you need to ship
          </h1>
          <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: 'var(--t-med)' }}>
            Guides, API reference, and example code for every NetLayer product.
          </p>

          <div
            className="mt-8 max-w-md mx-auto flex items-center gap-3 px-4 h-11 rounded-lg"
            style={{
              background: 'var(--nl-2)',
              border: '1px solid var(--b-default)',
            }}
          >
            <Search size={16} style={{ color: 'var(--t-low)' }} />
            <input
              type="search"
              placeholder="Search docs (coming soon)…"
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: 'var(--t-hi)' }}
              disabled
            />
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--nl-1)', border: '1px solid var(--b-default)', color: 'var(--t-low)' }}
            >
              ⌘K
            </kbd>
          </div>
        </motion.div>
      </section>

      <Section
        tag="GETTING STARTED"
        title="Start here"
        cards={GETTING_STARTED}
        cols={4}
      />
      <Section
        tag="API & DEVELOPER"
        title="Build with our APIs"
        cards={DEV_RESOURCES}
        cols={3}
      />
      <Section
        tag="POPULAR GUIDES"
        title="Common workloads"
        cards={POPULAR}
        cols={3}
      />

      <section className="py-20 px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Need a hand?</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-med)' }}>
          Open a ticket from your dashboard, or email{' '}
          <a href="mailto:support@netlayer.com" style={{ color: 'var(--brand)' }} className="underline underline-offset-4">
            support@netlayer.com
          </a>
        </p>
      </section>

      <LandingFooter />
    </div>
  )
}

function Section({ tag, title, cards, cols }: { tag: string; title: string; cards: Card[]; cols: number }) {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>{tag}</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 4 ? 200 : 240}px, 1fr))` }}
      >
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="nl-card nl-card-hover p-5 cursor-pointer block"
          >
            <c.Icon size={18} style={{ color: 'var(--brand)' }} />
            <div className="mt-3 text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{c.title}</div>
            <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--t-med)' }}>{c.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
