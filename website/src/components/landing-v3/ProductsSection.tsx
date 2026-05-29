import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Cpu, MonitorCog, Server } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Tabbed product showcase — Cloud Compute / Bare Metal / GPU.
 * Three tabs, each shows three plan cards with NetLayer pricing.
 * Click any card to jump to /pricing#<slug>.
 */
type Card = {
  family: 'Compute' | 'BareMetal' | 'GPU'
  title: string
  description: string
  price: string
  href: string
}

const TABS = [
  { key: 'compute',  label: 'Cloud Compute' },
  { key: 'bare',     label: 'Bare Metal' },
  { key: 'gpu',      label: 'GPU Instances' },
] as const

type TabKey = typeof TABS[number]['key']

const CARDS: Record<TabKey, Card[]> = {
  compute: [
    { family: 'Compute', title: 'c2.medium', description: '2 vCPU · 4 GB RAM · 80 GB NVMe. Burst-friendly for staging and side-projects.', price: '₹399/mo · ₹0.54/hr', href: '/pricing#compute' },
    { family: 'Compute', title: 'c3.large',  description: '4 vCPU · 8 GB RAM · 160 GB NVMe. Sized right for production workloads.', price: '₹799/mo · ₹1.09/hr', href: '/pricing#compute' },
    { family: 'Compute', title: 'c4.2xlarge', description: '16 vCPU · 32 GB RAM · 640 GB NVMe. Single-tenant CPU performance for big jobs.', price: '₹2,999/mo · ₹4.10/hr', href: '/pricing#compute' },
  ],
  bare: [
    { family: 'BareMetal', title: 'bm.epyc-1', description: 'AMD EPYC 7402P · 16C/32T · 64 GB RAM · 2× NVMe. RAID-0/1.', price: '₹14,999/mo', href: '/pricing#bare' },
    { family: 'BareMetal', title: 'bm.epyc-2', description: 'AMD EPYC 7543P · 32C/64T · 128 GB RAM · 4× NVMe. RAID-0/1/10.', price: '₹24,999/mo', href: '/pricing#bare' },
    { family: 'BareMetal', title: 'bm.epyc-3', description: 'Dual EPYC 7763 · 128C/256T · 512 GB RAM · 8× NVMe. RAID-10.', price: '₹89,999/mo', href: '/pricing#bare' },
  ],
  gpu: [
    { family: 'GPU', title: 'NVIDIA L40 (48 GB)', description: 'Single L40 with 48 GB VRAM. AI inference + 3D rendering.', price: '₹89,999/mo', href: '/pricing#gpu' },
    { family: 'GPU', title: 'NVIDIA A100 (80 GB)', description: 'Single A100 80 GB SXM4 for training and large-context inference.', price: '₹129,999/mo', href: '/pricing#gpu' },
    { family: 'GPU', title: 'NVIDIA H100 (80 GB)', description: 'H100 SXM5 for state-of-the-art models. NVLink ready.', price: 'Contact sales', href: '/pricing#gpu' },
  ],
}

export function ProductsSection() {
  const [tab, setTab] = useState<TabKey>('compute')

  return (
    <section
      id="products"
      className="py-16 lg:py-24"
      style={{ background: 'var(--nl-0)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-[11px] uppercase tracking-[.22em] mb-3" style={{ color: 'var(--brand)' }}>
            Platform
          </div>
          <h2
            className="tracking-tight leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, color: 'var(--t-hi)' }}
          >
            Compute that fits the workload
          </h2>
          <p className="mt-5 text-[15px]" style={{ color: 'var(--t-med)' }}>
            From small VMs to dedicated bare-metal — same console, same API, same SLA.
          </p>
        </div>

        <div className="mt-10 lg:mt-14 flex justify-center gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-5 lg:px-6 h-11 text-[13.5px] lg:text-[14px] transition-colors cursor-pointer border-b-2'
              )}
              style={{
                color: tab === t.key ? 'var(--brand)' : 'var(--t-med)',
                borderColor: tab === t.key ? 'var(--brand)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4 lg:gap-5">
          {CARDS[tab].map((c) => (
            <ProductCard key={c.title} card={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCard({ card }: { card: Card }) {
  return (
    <Link
      to={card.href}
      className="group flex flex-col p-6 lg:p-7 rounded-lg transition-all cursor-pointer"
      style={{
        background: 'var(--nl-1)',
        border: '1px solid var(--b-default)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-b)'
        e.currentTarget.style.background = 'var(--nl-2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--b-default)'
        e.currentTarget.style.background = 'var(--nl-1)'
      }}
    >
      <div className="h-9 flex items-center" style={{ color: 'var(--t-low)' }}>
        {card.family === 'Compute' && <Cpu size={18} />}
        {card.family === 'BareMetal' && <Server size={18} />}
        {card.family === 'GPU' && <MonitorCog size={18} />}
        <span className="ml-2 text-[10.5px] uppercase tracking-[0.18em]">
          {card.family === 'BareMetal' ? 'Bare metal' : card.family}
        </span>
      </div>
      <h3
        className="mt-3 text-[22px] leading-tight"
        style={{ color: 'var(--t-hi)', fontWeight: 500, letterSpacing: '-0.01em' }}
      >
        {card.title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] flex-1" style={{ color: 'var(--t-med)' }}>
        {card.description}
      </p>
      <p className="mt-6 text-[13px]" style={{ color: 'var(--t-low)' }}>
        Pricing starts at{' '}
        <span style={{ color: 'var(--brand)', fontWeight: 500 }}>{card.price}</span>
      </p>
      <span
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition-all"
        style={{ color: 'var(--brand)' }}
      >
        Learn more
        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  )
}
