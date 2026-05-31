import { ArrowRight, Coffee, Globe, IndianRupee } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import { useSeo } from '../../hooks/useSeo'

const PERKS = [
  { Icon: Globe,       title: 'Remote-first',         desc: 'Work from anywhere in any timezone with at-least-2h overlap.', accent: 'var(--a-cyan)' },
  { Icon: IndianRupee, title: 'Top-of-market salary', desc: 'Bay-area benchmarks for senior IC and engineering management.', accent: 'var(--a-lime)' },
  { Icon: Coffee,      title: 'Equity + retreats',    desc: 'Meaningful stock options. Annual offsite. Real coffee budget.', accent: 'var(--a-violet)' },
]

const JOBS = [
  {
    title: 'Senior Backend Engineer',
    type: 'Full-time',
    location: 'Mumbai or Remote (IST ± 4h)',
    desc: 'Distributed systems, Postgres, gRPC, Go/Node. Owns the control plane and workflow engine.',
  },
  {
    title: 'Frontend Engineer',
    type: 'Full-time',
    location: 'Remote',
    desc: 'React + TypeScript + Tailwind. Build the dashboard and public sites our customers see every day.',
  },
  {
    title: 'DevOps / SRE',
    type: 'Full-time',
    location: 'Mumbai (hybrid)',
    desc: 'Linux, Proxmox, Kubernetes, Ceph, Prometheus. Pager duty across regions; postmortems are a love letter.',
  },
]

export default function CareersPage() {
  useSeo({
    title: 'Careers',
    description: 'Small team, big problems. Build cloud infrastructure used by tens of thousands of developers. Remote-first, top-of-market pay.',
    path: '/careers',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Careers"
        title="Build the future of"
        accent="cloud infrastructure."
        subtitle="Small team. Big problems. Direct ownership of features used by tens of thousands of developers."
      />

      {/* Perks */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PERKS.map((p) => (
              <div key={p.title} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(24px,3vw,32px)' }}>
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 46, height: 46, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + p.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + p.accent + ' 28%, transparent)', marginBottom: 16 }}
                >
                  <p.Icon size={21} style={{ color: p.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 17, color: 'var(--t-hi)', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Open roles</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>Currently hiring</h2>
          </div>
          <div className="flex flex-col gap-3" style={{ maxWidth: 820, margin: '0 auto' }}>
            {JOBS.map((j) => (
              <a
                key={j.title}
                href={`mailto:careers@netlayer.com?subject=Application: ${encodeURIComponent(j.title)}`}
                className="group flex items-start justify-between gap-4 cursor-pointer transition-all"
                style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(22px,2.6vw,28px)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-b)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b-default)' }}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="nl-head" style={{ fontSize: 17, color: 'var(--t-hi)' }}>{j.title}</h3>
                    <span className="nl-mono" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--nl-3)', color: 'var(--t-low)' }}>{j.type}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--t-low)' }}>· {j.location}</span>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 14, color: 'var(--t-med)', lineHeight: 1.65 }}>{j.desc}</p>
                </div>
                <ArrowRight size={17} className="shrink-0 mt-1 transition-transform group-hover:translate-x-1" style={{ color: 'var(--brand)' }} />
              </a>
            ))}
          </div>
          <p className="text-center" style={{ marginTop: 32, fontSize: 13, color: 'var(--t-low)' }}>
            Don't see a fit? Email{' '}
            <a href="mailto:careers@netlayer.com" style={{ color: 'var(--brand)' }} className="underline underline-offset-4">careers@netlayer.com</a>{' '}— we read everything.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
