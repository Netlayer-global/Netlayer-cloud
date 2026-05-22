import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Plan {
  category: string
  size: string
  slug: string
  cpu: string
  ram: string
  disk: string
  bw: string
  price: number
  hourly: string
  popular?: boolean
}

const COMPUTE_PLANS: Plan[] = [
  { category: 'Nano',    size: 'c2.small',    slug: 'c2-small',    cpu: '1 vCPU',  ram: '2 GB',   disk: '40 GB NVMe',   bw: '1 TB',  price: 149,  hourly: '0.20' },
  { category: 'Micro',   size: 'c2.medium',   slug: 'c2-medium',   cpu: '2 vCPU',  ram: '4 GB',   disk: '80 GB NVMe',   bw: '2 TB',  price: 299,  hourly: '0.41' },
  { category: 'Small',   size: 'c3.large',    slug: 'c3-large',    cpu: '4 vCPU',  ram: '8 GB',   disk: '160 GB NVMe',  bw: '3 TB',  price: 599,  hourly: '0.82', popular: true },
  { category: 'Medium',  size: 'c3.xlarge',   slug: 'c3-xlarge',   cpu: '8 vCPU',  ram: '16 GB',  disk: '320 GB NVMe',  bw: '5 TB',  price: 1099, hourly: '1.51' },
  { category: 'Large',   size: 'c4.2xlarge',  slug: 'c4-2xlarge',  cpu: '16 vCPU', ram: '32 GB',  disk: '640 GB NVMe',  bw: '8 TB',  price: 1999, hourly: '2.74' },
  { category: 'XLarge',  size: 'c4.4xlarge',  slug: 'c4-4xlarge',  cpu: '32 vCPU', ram: '64 GB',  disk: '1.28 TB NVMe', bw: '10 TB', price: 3999, hourly: '5.48' },
]

const BAREMETAL_PLANS: Plan[] = [
  { category: 'BM Small',  size: 'bm.entry',   slug: 'bm-entry',   cpu: '6 cores',  ram: '32 GB',  disk: '2× 480 GB NVMe',  bw: '20 TB', price: 999,  hourly: '1.37' },
  { category: 'BM Medium', size: 'bm.mid',     slug: 'bm-mid',     cpu: '12 cores', ram: '64 GB',  disk: '2× 960 GB NVMe',  bw: '30 TB', price: 1999, hourly: '2.74', popular: true },
  { category: 'BM Large',  size: 'bm.large',   slug: 'bm-large',   cpu: '24 cores', ram: '128 GB', disk: '2× 1.92 TB NVMe', bw: '40 TB', price: 3999, hourly: '5.48' },
  { category: 'BM XL',     size: 'bm.xl',      slug: 'bm-xl',      cpu: '48 cores', ram: '256 GB', disk: '4× 1.92 TB NVMe', bw: '50 TB', price: 7999, hourly: '10.96' },
]

const STORAGE_PLANS: Plan[] = [
  { category: 'Block 100',  size: 'block.100',  slug: 'block-100',  cpu: '—', ram: '—', disk: '100 GB NVMe',  bw: 'unlimited', price: 40,   hourly: '0.05' },
  { category: 'Block 500',  size: 'block.500',  slug: 'block-500',  cpu: '—', ram: '—', disk: '500 GB NVMe',  bw: 'unlimited', price: 199,  hourly: '0.27' },
  { category: 'Block 1TB',  size: 'block.1tb',  slug: 'block-1tb',  cpu: '—', ram: '—', disk: '1 TB NVMe',    bw: 'unlimited', price: 399,  hourly: '0.55', popular: true },
  { category: 'Object 1TB', size: 'obj.1tb',    slug: 'obj-1tb',    cpu: '—', ram: '—', disk: '1 TB Object',  bw: 'unmetered', price: 199,  hourly: '0.27' },
  { category: 'Object 5TB', size: 'obj.5tb',    slug: 'obj-5tb',    cpu: '—', ram: '—', disk: '5 TB Object',  bw: 'unmetered', price: 899,  hourly: '1.23' },
]

const TABS = [
  { key: 'compute', label: 'Cloud Compute', plans: COMPUTE_PLANS },
  { key: 'baremetal', label: 'Bare Metal',  plans: BAREMETAL_PLANS },
  { key: 'storage', label: 'Storage',       plans: STORAGE_PLANS },
] as const

export function Pricing() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('compute')
  const active = TABS.find((t) => t.key === tab)!

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[#0070f3]/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Pay-as-you-go. Hourly billing. No surprises. All plans include free IPv6, DDoS protection, and full root access.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-[#111] border border-white/[0.06] rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 sm:px-5 h-9 text-[13.5px] rounded-md transition-all cursor-pointer',
                  tab === t.key
                    ? 'bg-[#1a1a1a] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.plans.map((p) => (
            <PlanCard key={p.slug} plan={p} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          All plans include: <span className="text-gray-300">Free IPv6</span> ·{' '}
          <span className="text-gray-300">DDoS Protection</span> ·{' '}
          <span className="text-gray-300">Private Networking</span> ·{' '}
          <span className="text-gray-300">Full Root Access</span>
        </p>
      </div>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        'relative bg-[#111] border rounded-xl p-6 transition-all hover:bg-white/[0.02]',
        plan.popular
          ? 'border-[#0070f3] shadow-[0_0_40px_rgba(0,112,243,0.25)]'
          : 'border-white/[0.06] hover:border-white/[0.15]'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white">
          <Zap size={10} fill="white" />
          Most Popular
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wider text-gray-500">{plan.category}</span>
      </div>
      <div className="text-base font-semibold text-white font-mono">{plan.size}</div>

      <div className="mt-5 mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-white">₹{plan.price.toLocaleString()}</span>
          <span className="text-sm text-gray-500">/mo</span>
        </div>
        <div className="text-xs text-gray-600 mt-1">or ₹{plan.hourly}/hr · billed hourly</div>
      </div>

      <ul className="space-y-2 text-sm text-gray-300 mb-6">
        <PlanRow label={plan.cpu} />
        <PlanRow label={plan.ram} />
        <PlanRow label={plan.disk} />
        <PlanRow label={`${plan.bw} bandwidth`} />
      </ul>

      <Link
        to={`/register?plan=${plan.slug}`}
        className={cn(
          'block text-center h-10 rounded-lg text-[13.5px] font-medium leading-10 transition-all cursor-pointer',
          plan.popular
            ? 'bg-gradient-to-r from-[#0070f3] to-[#0090ff] text-white hover:from-[#0080ff] hover:to-[#00a0ff] shadow-[0_4px_14px_rgba(0,112,243,0.4)]'
            : 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]'
        )}
      >
        Deploy This Plan →
      </Link>
    </div>
  )
}

function PlanRow({ label }: { label: string }) {
  if (label === '—') return null
  return (
    <li className="flex items-center gap-2">
      <Check size={13} className="text-[#0070f3] shrink-0" strokeWidth={2.5} />
      <span>{label}</span>
    </li>
  )
}
