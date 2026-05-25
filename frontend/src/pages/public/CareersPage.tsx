import { motion } from 'framer-motion'
import { ArrowRight, Coffee, Globe, IndianRupee } from 'lucide-react'
import { LandingNav, LandingFooter } from '../Landing'

const PERKS = [
  { Icon: Globe,       title: 'Remote-first',           desc: 'Work from anywhere in any timezone with at-least-2h overlap.' },
  { Icon: IndianRupee, title: 'Top-of-market salary',   desc: 'Bay-area benchmarks for senior IC and engineering management.' },
  { Icon: Coffee,      title: 'Equity + retreats',      desc: 'Meaningful stock options. Annual offsite. Real coffee budget.' },
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
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />
      <Hero />
      <Perks />
      <Jobs />
      <LandingFooter />
    </div>
  )
}

function Hero() {
  return (
    <section className="pt-28 pb-12 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <span
          className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
          style={{ border: '1px solid var(--brand-b)', background: 'var(--brand-d)', color: 'var(--brand)' }}
        >
          Careers
        </span>
        <h1 className="mt-6 font-semibold tracking-tight" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}>
          Build the future of cloud<br />infrastructure
        </h1>
        <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
          Small team. Big problems. Direct ownership of features used by tens of thousands of developers.
        </p>
      </motion.div>
    </section>
  )
}

function Perks() {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PERKS.map((p) => (
          <div key={p.title} className="nl-card p-5">
            <p.Icon size={18} style={{ color: 'var(--brand)' }} />
            <div className="mt-3 text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{p.title}</div>
            <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--t-med)' }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Jobs() {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Open roles</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Currently hiring</h2>
      </div>
      <div className="space-y-3">
        {JOBS.map((j) => (
          <a
            key={j.title}
            href={`mailto:careers@netlayer.com?subject=Application: ${encodeURIComponent(j.title)}`}
            className="nl-card nl-card-hover p-5 cursor-pointer flex items-start justify-between gap-4 group"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold" style={{ color: 'var(--t-hi)' }}>{j.title}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--nl-3)', color: 'var(--t-low)' }}>
                  {j.type}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--t-low)' }}>· {j.location}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>{j.desc}</p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 mt-1 transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--brand)' }}
            />
          </a>
        ))}
      </div>
      <p className="mt-8 text-center text-xs" style={{ color: 'var(--t-low)' }}>
        Don't see a fit? Email{' '}
        <a href="mailto:careers@netlayer.com" style={{ color: 'var(--brand)' }} className="underline underline-offset-4">
          careers@netlayer.com
        </a>{' '}
        — we read everything.
      </p>
    </section>
  )
}
