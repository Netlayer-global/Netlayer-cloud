import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'

/**
 * Split intro (VAULTEX style): serif headline + checklist feature list on
 * the left, an orbiting lime orb visual on the right. Then a 6-item
 * "advantage" hairline grid. Lime palette, VPS copy, theme-aware.
 */
const FEATURES = [
  'Real-time CPU, RAM, disk & bandwidth per server',
  'Auto-incident detection with full diagnostics',
  'Self-service GST invoices & subscription control',
  '30-second deploys from pre-cached golden images',
]

const ADV = [
  { title: 'Live metrics', desc: 'CPU, RAM, disk, bandwidth — per server, in real time. Not in a monthly PDF that lands three weeks late.' },
  { title: 'Auto-incident detection', desc: 'A node hiccup or runaway VM is flagged instantly with full diagnostic context — before you notice.' },
  { title: 'Self-service billing', desc: 'Download GST invoices, manage subscriptions, top up wallet — your finance team never chases anyone.' },
  { title: '30-second deploys', desc: 'Linked-clone pipeline with pre-cached golden images means servers boot before your coffee cools.' },
  { title: 'India-GST native', desc: 'Sequential invoice numbering, CGST/SGST/IGST split, and GSTR-1 export built in from day one.' },
  { title: 'Developer API', desc: 'Pull server status, metrics, and billing into your own tooling via a clean REST API + Terraform provider.' },
]

export function PerformanceSection() {
  return (
    <>
      {/* split intro */}
      <section
        style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="nl-eyebrow" style={{ marginBottom: 24 }}>The platform</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(34px,5vw,68px)', color: 'var(--t-hi)', marginBottom: 24 }}>
              The control plane{' '}
              <span className="nl-stroke-brand" style={{ fontStyle: 'italic' }}>behind</span>{' '}
              your servers.
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t-med)', lineHeight: 1.8, maxWidth: 540 }}>
              Most hosts hand you a panel and disappear. NetLayer gives you real-time
              visibility into every server, every invoice, every SLA — through a
              console your team actually wants to open.
            </p>

            <ul className="mt-8 flex flex-col gap-3.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span
                    className="inline-flex items-center justify-center shrink-0"
                    style={{ width: 20, height: 20, borderRadius: 'var(--r-full)', background: 'var(--brand-d)', border: '1px solid var(--brand-b)', marginTop: 2 }}
                  >
                    <Check size={12} style={{ color: 'var(--brand)' }} />
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--t-hi)' }}>{f}</span>
                </li>
              ))}
            </ul>

            <Link to="/features" className="nl-btn-ghost" style={{ marginTop: 34 }}>
              Explore the platform <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* orbiting orb */}
          <div className="relative flex items-center justify-center" style={{ height: 360 }}>
            <div
              className="absolute rounded-full"
              style={{ width: 320, height: 320, border: '1px solid var(--b-default)', animation: 'nl-orbit-spin 18s linear infinite' }}
            >
              <span className="absolute rounded-full" style={{ top: -3.5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, background: 'var(--brand)', boxShadow: '0 0 10px var(--brand)' }} />
            </div>
            <div
              className="absolute rounded-full"
              style={{ width: 420, height: 420, border: '1px solid var(--b-default)', animation: 'nl-orbit-spin 27s linear infinite reverse' }}
            >
              <span className="absolute rounded-full" style={{ top: -3.5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, background: 'var(--c-cyan)', boxShadow: '0 0 10px var(--c-cyan)' }} />
            </div>
            <div
              className="rounded-full"
              style={{
                width: 230, height: 230,
                background: 'radial-gradient(circle at 38% 33%, rgba(200,241,53,.5) 0%, rgba(40,70,0,.85) 58%, #000 100%)',
                boxShadow: '0 0 90px rgba(132,204,22,.25)',
              }}
            />
          </div>
        </div>
      </section>

      {/* advantage hairline list */}
      <section style={{ padding: 'clamp(54px,7vw,80px) clamp(20px,5vw,52px) 0', background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-eyebrow" style={{ marginBottom: 24 }}>The advantage</div>
        <h2 className="nl-display" style={{ fontSize: 'clamp(30px,4vw,56px)', color: 'var(--t-hi)' }}>
          Everything visible. Everything controlled.
        </h2>
      </section>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 nl-grid-surface"
        style={{ marginTop: 'clamp(36px,5vw,56px)', borderTop: '1px solid var(--b-subtle)', borderBottom: '1px solid var(--b-subtle)' }}
      >
        {ADV.map((a, i) => (
          <div
            key={a.title}
            className="nl-cell"
            style={{ padding: 'clamp(34px,4vw,44px) clamp(28px,4vw,40px)' }}
          >
            <span className="nl-mono block" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--t-off)', marginBottom: 18 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="nl-head" style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 10 }}>
              {a.title}
            </div>
            <p style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.7 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
