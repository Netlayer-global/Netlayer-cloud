import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Globe, Shield, Zap } from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'

const VALUES = [
  { Icon: Zap,    title: 'Performance first',   desc: 'Every plan ships on bare-metal-grade hardware. No exceptions.' },
  { Icon: Heart,  title: 'Developer-focused',   desc: 'We dogfood the platform we build. If it isn\'t great for engineers, we don\'t ship it.' },
  { Icon: Shield, title: 'Transparency',        desc: 'Public status page, public roadmap, public postmortems for any incident.' },
  { Icon: Globe,  title: 'Built in India, global', desc: 'HQ in Mumbai. PoPs across 15 cities. We serve workloads everywhere.' },
]

const STATS = [
  { value: '50K+',  label: 'Developers' },
  { value: '15',    label: 'Regions' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '2024',  label: 'Founded' },
]

const TEAM = ['AS', 'RP', 'VI', 'NK']

export default function AboutPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}>
            We're building the cloud<br />we always wanted
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            NetLayer Cloud was started in 2024 by a team who'd run too many production
            workloads on too many slow, opaque clouds. We wanted speed, transparency, and
            developer ergonomics — so we built it.
          </p>
        </motion.div>
      </section>

      {/* Mission + stats */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Our mission</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Make great infrastructure feel obvious
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>
              Most clouds optimise for the enterprise procurement process. We optimise for the
              developer who needs a server <em>right now</em>. Every product decision starts with
              "would I want this if I were the customer?"
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>
              We charge fair prices. We don't lock you in. We publish our SLAs and stand behind
              them. And we're quietly proud that we deploy faster than anyone else.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="nl-card p-5 text-center">
                <div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--brand)' }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Values</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">What we care about</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VALUES.map((v) => (
            <div key={v.title} className="nl-card p-6">
              <v.Icon size={20} style={{ color: 'var(--brand)' }} />
              <div className="mt-3 text-base font-medium" style={{ color: 'var(--t-hi)' }}>{v.title}</div>
              <div className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Team</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built by engineers, for engineers</h2>
        <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: 'var(--t-med)' }}>
          A small team based in Mumbai with a global remote-first culture.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {TEAM.map((init) => (
            <div
              key={init}
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, var(--brand), #a8e620)',
                color: 'var(--nl-0)',
              }}
            >
              {init}
            </div>
          ))}
        </div>
      </section>

      {/* Hiring CTA */}
      <section className="py-12 px-4 sm:px-6">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--brand-d), transparent)',
            border: '1px solid var(--brand-b)',
          }}
        >
          <h3 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--t-hi)' }}>
            We're hiring
          </h3>
          <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--t-med)' }}>
            Backend, frontend, infra, SRE — if you've operated production at scale, we'd love to talk.
          </p>
          <Link to="/careers" className="nl-btn-primary mt-5 inline-flex">
            View openings →
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
