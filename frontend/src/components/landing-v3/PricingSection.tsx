import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Cpu, HardDrive, MemoryStick, Wifi } from 'lucide-react'

/**
 * Public pricing block. Used as the pricing section on the landing page
 * AND rendered standalone on `/pricing` (with `standalone` prop set so the
 * vertical borders don't double up against the page background).
 *
 * Re-exported from `pages/Landing.tsx` for backwards compatibility.
 */

interface PlanShape {
  slug: string
  cpu: number
  ram: number
  disk: number
  bw: number
  monthly: number
  hourly: number
  popular?: boolean
}

const PLANS: PlanShape[] = [
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
