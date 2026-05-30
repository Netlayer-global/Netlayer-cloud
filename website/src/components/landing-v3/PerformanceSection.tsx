import { Link } from 'react-router-dom'

/**
 * Two-col intro with an orbiting lime orb visual (right), then a 6-item
 * "advantage" hairline list. Fireblox structure, lime palette, VPS copy.
 */
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
      {/* intro two-col with orb */}
      <section
        style={{ padding: 'clamp(64px,9vw,100px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="nl-eyebrow" style={{ marginBottom: 20 }}>The platform</div>
            <h2 className="nl-head" style={{ fontSize: 'clamp(34px,5vw,68px)', color: 'var(--t-hi)', marginBottom: 24 }}>
              The control plane behind your servers.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t-med)', lineHeight: 1.8, maxWidth: 560 }}>
              Most hosts hand you a panel and disappear. NetLayer gives you real-time
              visibility into every server, every invoice, every SLA — through a
              console your team actually wants to open.
            </p>
            <Link to="/features" className="nl-btn-ghost" style={{ marginTop: 32 }}>
              Explore the platform
            </Link>
          </div>

          {/* orbiting orb */}
          <div className="relative flex items-center justify-center" style={{ height: 340 }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 320, height: 320, border: '1px solid var(--b-default)',
                animation: 'nl-orbit-spin 18s linear infinite',
              }}
            >
              <span className="absolute rounded-full" style={{ top: -3.5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, background: 'var(--brand)', boxShadow: '0 0 10px var(--brand)' }} />
            </div>
            <div
              className="absolute rounded-full"
              style={{
                width: 400, height: 400, border: '1px solid var(--b-default)',
                animation: 'nl-orbit-spin 27s linear infinite reverse',
              }}
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
      <section style={{ padding: 'clamp(50px,7vw,70px) clamp(20px,5vw,52px) 0', background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-eyebrow" style={{ marginBottom: 20 }}>The advantage</div>
        <h2 className="nl-head" style={{ fontSize: 'clamp(28px,4vw,52px)', color: 'var(--t-hi)' }}>
          Everything visible. Everything controlled.
        </h2>
      </section>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 nl-grid-surface"
        style={{ marginTop: 'clamp(32px,5vw,52px)', borderTop: '1px solid var(--b-subtle)' }}
      >
        {ADV.map((a) => (
          <div
            key={a.title}
            className="nl-cell"
            style={{ padding: 'clamp(34px,4vw,42px) clamp(28px,4vw,40px)' }}
          >
            <span className="block" style={{ width: 28, height: 2, background: 'var(--brand)', marginBottom: 22 }} />
            <div className="nl-head" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 10, letterSpacing: '.05em' }}>
              {a.title}
            </div>
            <p style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.7 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
