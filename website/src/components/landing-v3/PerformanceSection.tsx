import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Check, Gauge, ReceiptIndianRupee } from 'lucide-react'

/**
 * Performance — DigitalOcean-style alternating feature rows. Each row pairs
 * a copy block (eyebrow, heading, paragraph, checklist, link) with a clean
 * visual card. Rows alternate sides on desktop. Lime palette, VPS copy,
 * theme-aware.
 */

type Row = {
  eyebrow: string
  title: string
  accent: string
  tone: 'cyan' | 'violet' | 'amber'
  body: string
  points: string[]
  href: string
  visual: 'metrics' | 'billing' | 'speed'
}

const TONE = {
  cyan:   { c: 'var(--a-cyan)',   d: 'var(--a-cyan-d)',   b: 'var(--a-cyan-b)' },
  violet: { c: 'var(--a-violet)', d: 'var(--a-violet-d)', b: 'var(--a-violet-b)' },
  amber:  { c: 'var(--a-amber)',  d: 'var(--a-amber-d)',  b: 'var(--a-amber-b)' },
} as const

const ROWS: Row[] = [
  {
    eyebrow: 'Observability',
    title: 'Real-time visibility into',
    accent: 'every server.',
    tone: 'cyan',
    body: 'CPU, RAM, disk, and bandwidth for each server — live, not in a monthly PDF that lands three weeks late. Incidents are flagged the moment they happen, with full diagnostic context.',
    points: ['Per-second metric resolution', 'Auto-incident detection', 'Alerting via webhooks & email'],
    href: '/features',
    visual: 'metrics',
  },
  {
    eyebrow: 'Billing',
    title: 'Transparent pricing,',
    accent: 'GST-native invoices.',
    tone: 'violet',
    body: 'Flat, predictable rates with per-second metering. Download GST-compliant invoices with the correct CGST/SGST/IGST split, manage subscriptions, and top up your wallet — all self-service.',
    points: ['Sequential GST invoice numbering', 'GSTR-1 export built in', 'No surprise egress bills'],
    href: '/pricing',
    visual: 'billing',
  },
  {
    eyebrow: 'Speed',
    title: 'Deploy in seconds,',
    accent: 'scale in one click.',
    tone: 'amber',
    body: 'A linked-clone pipeline with pre-cached golden images means servers boot before your coffee cools. Resize live, snapshot anytime, and automate the whole flow through one clean API.',
    points: ['~30-second average boot', 'Live vertical resize', 'REST API + Terraform provider'],
    href: '/docs',
    visual: 'speed',
  },
]

function Visual({ kind }: { kind: Row['visual'] }) {
  const shell: React.CSSProperties = {
    borderRadius: 'var(--r-2xl)', border: '1px solid var(--b-default)',
    background: 'var(--nl-2)', boxShadow: 'var(--shadow-md)', padding: 28, position: 'relative', overflow: 'hidden',
  }
  const glow = (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{ top: '-20%', right: '-10%', width: '55%', height: '80%', background: 'radial-gradient(ellipse at 60% 40%, rgba(200,241,53,.14) 0%, transparent 66%)', filter: 'blur(36px)' }}
    />
  )

  if (kind === 'metrics') {
    const bars = [42, 68, 35, 80, 55, 72, 48, 90, 61]
    return (
      <div style={shell}>
        {glow}
        <div className="relative flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span className="inline-flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-hi)' }}>
            <Activity size={15} style={{ color: 'var(--brand)' }} /> Live metrics
          </span>
          <span className="nl-mono" style={{ fontSize: 11, color: 'var(--c-green)' }}>● streaming</span>
        </div>
        <div className="relative flex items-end gap-2" style={{ height: 150 }}>
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 7 ? 'var(--brand)' : 'var(--nl-5)' }} />
          ))}
        </div>
        <div className="relative grid grid-cols-3 gap-2" style={{ marginTop: 18 }}>
          {[['CPU', '34%'], ['RAM', '5.1 GB'], ['NET', '128 Mb/s']].map(([k, v]) => (
            <div key={k} style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--b-subtle)', background: 'var(--nl-1)', padding: '10px 12px' }}>
              <div className="nl-mono" style={{ fontSize: 9.5, color: 'var(--t-low)' }}>{k}</div>
              <div className="nl-head" style={{ fontSize: 15, color: 'var(--t-hi)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (kind === 'billing') {
    return (
      <div style={shell}>
        {glow}
        <div className="relative flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ReceiptIndianRupee size={15} style={{ color: 'var(--brand)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-hi)' }}>Invoice NL/2026-27/000482</span>
        </div>
        <div className="relative flex flex-col gap-2.5">
          {[['Cloud VPS · c3.large × 3', '₹4,320'], ['Block storage · 500 GB', '₹1,250'], ['Bandwidth · 1.2 TB', '₹0'], ['CGST 9%', '₹502'], ['SGST 9%', '₹502']].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between" style={{ fontSize: 13, color: 'var(--t-med)' }}>
              <span>{k}</span><span className="nl-mono" style={{ color: 'var(--t-hi)' }}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--b-default)', paddingTop: 12, marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-hi)' }}>Total</span>
            <span className="nl-display" style={{ fontSize: 22, color: 'var(--brand)' }}>₹7,076</span>
          </div>
        </div>
      </div>
    )
  }

  // speed
  return (
    <div style={shell}>
      {glow}
      <div className="relative flex items-center gap-2" style={{ marginBottom: 20 }}>
        <Gauge size={15} style={{ color: 'var(--brand)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-hi)' }}>Deployment timeline</span>
      </div>
      <div className="relative flex flex-col gap-3">
        {[['Image pull', '4s', 100], ['Provision VM', '11s', 100], ['Network attach', '6s', 100], ['Boot & cloud-init', '9s', 72]].map(([k, t, pct]) => (
          <div key={k as string}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--t-med)' }}>{k}</span>
              <span className="nl-mono" style={{ fontSize: 11, color: 'var(--t-low)' }}>{t}</span>
            </div>
            <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--nl-4)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: (pct as number) === 100 ? 'var(--brand)' : 'color-mix(in srgb, var(--brand) 55%, transparent)' }} />
            </div>
          </div>
        ))}
        <div className="nl-mono" style={{ fontSize: 11, color: 'var(--c-green)', marginTop: 4 }}>✓ Live in 30s</div>
      </div>
    </div>
  )
}

export function PerformanceSection() {
  return (
    <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container flex flex-col" style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,4vw,72px)', gap: 'clamp(56px,8vw,104px)' }}>
        {ROWS.map((row, i) => {
          const t = TONE[row.tone]
          return (
          <div key={row.title} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* copy */}
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <div className="nl-eyebrow" style={{ marginBottom: 18, color: t.c }}>{row.eyebrow}</div>
              <h2 className="nl-display" style={{ fontSize: 'clamp(28px,3.6vw,46px)', color: 'var(--t-hi)', marginBottom: 18 }}>
                {row.title} <span style={{ color: t.c }}>{row.accent}</span>
              </h2>
              <p style={{ fontSize: 15.5, color: 'var(--t-med)', lineHeight: 1.7, maxWidth: 500, marginBottom: 22 }}>{row.body}</p>
              <ul className="flex flex-col gap-2.5" style={{ marginBottom: 26 }}>
                {row.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-3" style={{ fontSize: 14, color: 'var(--t-hi)' }}>
                    <span className="inline-flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 'var(--r-full)', background: t.d, border: `1px solid ${t.b}` }}>
                      <Check size={12} style={{ color: t.c }} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                to={row.href}
                className="inline-flex items-center gap-2 nl-mono transition-colors"
                style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: t.c }}
              >
                Learn more <ArrowRight size={14} />
              </Link>
            </div>

            {/* visual */}
            <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
              <Visual kind={row.visual} />
            </div>
          </div>
        )})}
      </div>
    </section>
  )
}
