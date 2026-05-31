import { Link } from 'react-router-dom'
import { Heart, Globe, Shield, Zap } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import { useSeo } from '../../hooks/useSeo'

const VALUES = [
  { Icon: Zap,    title: 'Performance first',      desc: 'Every plan ships on bare-metal-grade hardware. No exceptions.', accent: 'var(--a-lime)' },
  { Icon: Heart,  title: 'Developer-focused',      desc: 'We dogfood the platform we build. If it isn\'t great for engineers, we don\'t ship it.', accent: 'var(--a-cyan)' },
  { Icon: Shield, title: 'Transparency',           desc: 'Public status page, public roadmap, public postmortems for any incident.', accent: 'var(--a-violet)' },
  { Icon: Globe,  title: 'Built in India, global', desc: 'HQ in Mumbai. PoPs across 15 cities. We serve workloads everywhere.', accent: 'var(--a-blue)' },
]

const STATS = [
  { value: '50K+',   label: 'Developers', accent: 'var(--a-lime)' },
  { value: '15',     label: 'Regions',    accent: 'var(--a-cyan)' },
  { value: '99.99%', label: 'Uptime SLA', accent: 'var(--a-violet)' },
  { value: '2024',   label: 'Founded',    accent: 'var(--a-blue)' },
]

const TEAM = ['AS', 'RP', 'VI', 'NK']

export default function AboutPage() {
  useSeo({
    title: 'About',
    description: 'NetLayer Cloud was started in 2024 by a team who wanted speed, transparency, and developer ergonomics from their cloud — so they built it.',
    path: '/about',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="About us"
        title="We're building the cloud"
        accent="we always wanted."
        subtitle="NetLayer Cloud was started in 2024 by a team who'd run too many production workloads on too many slow, opaque clouds. We wanted speed, transparency, and developer ergonomics — so we built it."
      />

      {/* Mission + stats */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Our mission</div>
              <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)', marginBottom: 20 }}>
                Make great infrastructure feel obvious
              </h2>
              <p style={{ fontSize: 15.5, color: 'var(--t-med)', lineHeight: 1.75, marginBottom: 16 }}>
                Most clouds optimise for the enterprise procurement process. We optimise for the
                developer who needs a server <em>right now</em>. Every product decision starts with
                "would I want this if I were the customer?"
              </p>
              <p style={{ fontSize: 15.5, color: 'var(--t-med)', lineHeight: 1.75 }}>
                We charge fair prices. We don't lock you in. We publish our SLAs and stand behind
                them. And we're quietly proud that we deploy faster than anyone else.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(24px,3vw,32px)' }}>
                  <div className="nl-display tabular-nums" style={{ fontSize: 'clamp(32px,4vw,44px)', color: s.accent }}>{s.value}</div>
                  <div className="nl-mono" style={{ marginTop: 8, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Values</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>What we care about</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(28px,3vw,36px)' }}>
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 46, height: 46, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + v.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + v.accent + ' 28%, transparent)', marginBottom: 18 }}
                >
                  <v.Icon size={21} style={{ color: v.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 18, color: 'var(--t-hi)', marginBottom: 9 }}>{v.title}</div>
                <div style={{ fontSize: 14, color: 'var(--t-med)', lineHeight: 1.7 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container text-center" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Team</div>
          <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)', marginBottom: 16 }}>Built by engineers, for engineers</h2>
          <p style={{ fontSize: 15.5, color: 'var(--t-med)', maxWidth: 540, margin: '0 auto 36px' }}>
            A small team based in Mumbai with a global remote-first culture.
          </p>
          <div className="flex justify-center gap-4">
            {TEAM.map((init) => (
              <div
                key={init}
                className="flex items-center justify-center nl-head"
                style={{ width: 56, height: 56, borderRadius: 'var(--r-full)', background: 'linear-gradient(135deg, var(--a-lime), var(--a-cyan))', color: 'var(--brand-fg)', fontSize: 16 }}
              >
                {init}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring CTA */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
          <div
            className="text-center"
            style={{ maxWidth: 720, margin: '0 auto', borderRadius: 'var(--r-2xl)', padding: 'clamp(36px,5vw,56px)', background: 'linear-gradient(135deg, var(--brand-d), transparent)', border: '1px solid var(--brand-b)' }}
          >
            <h3 className="nl-display" style={{ fontSize: 'clamp(24px,3vw,34px)', color: 'var(--t-hi)', marginBottom: 12 }}>We're hiring</h3>
            <p style={{ fontSize: 15, color: 'var(--t-med)', maxWidth: 420, margin: '0 auto 24px' }}>
              Backend, frontend, infra, SRE — if you've operated production at scale, we'd love to talk.
            </p>
            <Link to="/careers" className="nl-btn-primary inline-flex">View openings →</Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
