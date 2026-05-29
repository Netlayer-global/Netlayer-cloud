import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Cpu, Server, MonitorCog, Hexagon,
  HardDrive, Database, Network, Boxes,
} from 'lucide-react'

/**
 * ProductsSection — modern bento-grid product showcase.
 *
 * An asymmetric grid where the two flagship products (Cloud Compute and GPU
 * Cloud) take wide feature tiles, and the rest of the platform fills smaller
 * cards. Each tile links into the relevant pricing anchor. Cards lift and
 * gain a lime border-glow on hover.
 *
 * Original copy throughout; the layout idea (a single grid spanning the whole
 * product line) is a common SaaS pattern rendered here in the lime-on-dark
 * NetLayer style.
 */

const BRAND = '#c8f135'

interface Tile {
  icon: typeof Cpu
  eyebrow: string
  title: string
  desc: string
  price: string
  to: string
  span: string // grid column span classes
  feature?: boolean
  badge?: string
}

const TILES: Tile[] = [
  {
    icon: Cpu,
    eyebrow: 'Cloud Compute',
    title: 'Virtual servers, deployed in seconds',
    desc: 'Real KVM virtualization on AMD EPYC and Intel Xeon with local NVMe. Pick a flavor, a region, and an OS — your server is online before your coffee.',
    price: 'from ₹149/mo',
    to: '/pricing#compute',
    span: 'lg:col-span-2 lg:row-span-1',
    feature: true,
  },
  {
    icon: MonitorCog,
    eyebrow: 'GPU Cloud',
    title: 'Accelerated compute for AI',
    desc: 'NVIDIA L40, A100, and H100 cards with NVLink. Train, fine-tune, and serve models without the capex.',
    price: 'from ₹1,999/mo',
    to: '/pricing#gpu',
    span: 'lg:col-span-1 lg:row-span-2',
    feature: true,
    badge: 'Popular',
  },
  {
    icon: Server,
    eyebrow: 'Bare Metal',
    title: 'Dedicated servers',
    desc: 'Single-tenant hardware, full control, zero noisy neighbours.',
    price: 'from ₹999/mo',
    to: '/pricing#bare',
    span: 'lg:col-span-1',
  },
  {
    icon: Hexagon,
    eyebrow: 'Kubernetes',
    title: 'Managed clusters',
    desc: 'Production-ready control plane, autoscaling node pools, one-click upgrades.',
    price: 'Preview',
    to: '/kubernetes',
    span: 'lg:col-span-1',
    badge: 'Preview',
  },
  {
    icon: HardDrive,
    eyebrow: 'Block Storage',
    title: 'Expandable NVMe volumes',
    desc: 'Attach fast, resizable storage to any server in seconds.',
    price: 'from ₹40/GB',
    to: '/pricing#block',
    span: 'lg:col-span-1',
  },
  {
    icon: Boxes,
    eyebrow: 'Object Storage',
    title: 'S3-compatible buckets',
    desc: 'Durable, global object store with a familiar API.',
    price: 'from ₹5/GB',
    to: '/pricing#object',
    span: 'lg:col-span-1',
  },
  {
    icon: Database,
    eyebrow: 'Managed Databases',
    title: 'Postgres, MySQL & Redis',
    desc: 'Automated backups, failover, and patching — you just connect.',
    price: 'from ₹499/mo',
    to: '/pricing#db',
    span: 'lg:col-span-1',
  },
  {
    icon: Network,
    eyebrow: 'Load Balancers',
    title: 'Highly available routing',
    desc: 'Distribute traffic across servers with health checks and TLS.',
    price: 'from ₹299/mo',
    to: '/pricing#lb',
    span: 'lg:col-span-1',
  },
]

export function ProductsSection() {
  return (
    <section id="products" className="py-20 lg:py-28" style={{ background: 'var(--nl-0)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: BRAND }}>
            One platform
          </div>
          <h2
            className="mt-3 font-semibold tracking-tight text-white"
            style={{ fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            Everything you need to ship,
            <br className="hidden sm:block" /> nothing you don't.
          </h2>
          <p className="mt-4 text-[15px]" style={{ color: 'var(--t-med)' }}>
            Compute, storage, networking, and data services share one console, one
            API, and one bill. Mix and match — scale each piece independently.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(220px,auto)]">
          {TILES.map((tile, i) => (
            <BentoTile key={tile.eyebrow} tile={tile} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BentoTile({ tile, index }: { tile: Tile; index: number }) {
  const Icon = tile.icon
  return (
    <motion.div
      className={tile.span}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={tile.to}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300"
        style={{
          background: tile.feature
            ? 'linear-gradient(160deg, var(--nl-3), var(--nl-1) 70%)'
            : 'var(--nl-1)',
          border: '1px solid var(--b-default)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--brand-b)'
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 0 32px rgba(200,241,53,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--b-default)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* glow accent for feature tiles */}
        {tile.feature && (
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-50 transition-opacity duration-300 group-hover:opacity-80"
            style={{ background: 'radial-gradient(circle, rgba(200,241,53,0.18), transparent 65%)', filter: 'blur(8px)' }}
          />
        )}

        <div className="relative flex items-center justify-between">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: BRAND }}
          >
            <Icon size={20} />
          </span>
          {tile.badge && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
              style={{ background: 'var(--brand-d)', color: BRAND, border: '1px solid var(--brand-b)' }}
            >
              {tile.badge}
            </span>
          )}
        </div>

        <div className="relative mt-5 flex-1">
          <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--t-low)' }}>
            {tile.eyebrow}
          </div>
          <h3
            className="mt-1.5 font-semibold text-white"
            style={{ fontSize: tile.feature ? 'clamp(18px,2vw,24px)' : '17px', letterSpacing: '-0.01em', lineHeight: 1.2 }}
          >
            {tile.title}
          </h3>
          <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--t-med)' }}>
            {tile.desc}
          </p>
        </div>

        <div className="relative mt-5 flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: BRAND }}>
            {tile.price}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[12.5px] transition-colors"
            style={{ color: 'var(--t-low)' }}
          >
            Explore
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: BRAND }} />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
