import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Proof cards (DigitalOcean style): three rounded stat cards, each with a
 * big lime metric, a short customer-style story, a plain wordmark, and a
 * "Read more" link. Sits under the partner logo strip. Lime palette,
 * theme-aware, original copy (no real customer names/logos).
 */
const PROOF = [
  {
    stat: '40%',
    unit: 'lower spend',
    tone: 'var(--a-cyan)',
    story: 'A fast-growing fintech moved 200+ production VMs to NetLayer and cut its monthly infrastructure bill by 40% — with no change to performance.',
    by: 'Series-B fintech',
  },
  {
    stat: '3×',
    unit: 'faster deploys',
    tone: 'var(--a-violet)',
    story: 'A SaaS team replaced its hand-rolled provisioning with our API and golden images, taking environment spin-up from minutes to under thirty seconds.',
    by: 'Developer tooling startup',
  },
  {
    stat: '99.99%',
    unit: 'measured uptime',
    tone: 'var(--a-lime)',
    story: 'An e-commerce platform ran a full festive-season peak across three Indian regions on NetLayer bare metal with zero unplanned downtime.',
    by: 'D2C commerce brand',
  },
]

export function AnnouncementBar() {
  return (
    <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
        <h2 className="nl-display" style={{ fontSize: 'clamp(26px,3.4vw,42px)', color: 'var(--t-hi)', maxWidth: 620, marginBottom: 'clamp(36px,5vw,56px)' }}>
          From first server to peak-season scale, teams build on NetLayer.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROOF.map((p) => (
            <div
              key={p.by}
              className="flex flex-col"
              style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(28px,3vw,36px)' }}
            >
              <div className="flex items-baseline gap-2" style={{ marginBottom: 18 }}>
                <span className="nl-display" style={{ fontSize: 'clamp(44px,5vw,60px)', color: p.tone }}>{p.stat}</span>
                <span className="nl-mono" style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-low)' }}>{p.unit}</span>
              </div>
              <p style={{ fontSize: 14.5, color: 'var(--t-med)', lineHeight: 1.7, marginBottom: 22, flex: 1 }}>{p.story}</p>
              <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--b-subtle)', paddingTop: 18 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-hi)' }}>{p.by}</span>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 nl-mono transition-colors"
                  style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: p.tone }}
                >
                  Read more <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
