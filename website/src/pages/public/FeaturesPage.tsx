import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, HardDrive, Wifi, ShieldCheck, Cpu, Lock, Network, Globe2,
  Camera, Database, Cloud, ArrowRight,
} from 'lucide-react'
import { LandingNav, LandingFooter, PageHero, CtaBand } from '../../components/landing-v3'
import { useSeo } from '../../hooks/useSeo'

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

interface Feature {
  Icon: any
  title: string
  desc: string
  accent: string
}

const FEATURES: Feature[] = [
  { Icon: Zap,         title: '30-second deploys',      desc: 'Linked-clone images and pre-warmed pools across every region.', accent: 'var(--a-lime)' },
  { Icon: HardDrive,   title: 'NVMe SSD on every plan', desc: 'No tiered HDD pricing — all storage is fast by default.',       accent: 'var(--a-cyan)' },
  { Icon: Wifi,        title: '25 Gbps networking',     desc: 'Per-host uplinks with line-rate throughput on every flow.',     accent: 'var(--a-violet)' },
  { Icon: ShieldCheck, title: 'Free DDoS protection',   desc: 'Always-on hardware DDoS scrubbing on every IP.',                accent: 'var(--a-blue)' },
  { Icon: Cpu,         title: 'KVM hypervisor',         desc: 'Strong isolation, full virtualization, no shared kernels.',     accent: 'var(--a-lime)' },
  { Icon: Lock,        title: 'Full root access',       desc: 'You bring the OS, we get out of your way.',                     accent: 'var(--a-cyan)' },
  { Icon: Network,     title: 'Private VPC',            desc: 'Isolated software-defined networks free on every region.',      accent: 'var(--a-violet)' },
  { Icon: Globe2,      title: 'Free IPv6',              desc: '/64 IPv6 block on every server, IPv4 + IPv6 dual stack.',       accent: 'var(--a-blue)' },
  { Icon: Camera,      title: 'Snapshots',              desc: 'Point-in-time disk snapshots, restore in seconds.',             accent: 'var(--a-lime)' },
  { Icon: HardDrive,   title: 'Block storage',          desc: 'Detachable NVMe volumes that survive server lifecycle.',        accent: 'var(--a-cyan)' },
  { Icon: Cloud,       title: 'Object storage',         desc: 'S3-compatible buckets with optional public access.',            accent: 'var(--a-violet)' },
  { Icon: Database,    title: 'Managed databases',      desc: 'Postgres, MySQL, Redis with automated backups and failover.',   accent: 'var(--a-blue)' },
]

const BENCH = [
  { label: 'NVMe Sequential Read',  value: '14.2 GB/s', pct: 92 },
  { label: 'NVMe Sequential Write', value: '8.7 GB/s',  pct: 71 },
  { label: 'Network Throughput',    value: '25 Gbps',   pct: 98 },
  { label: 'CPU Single-Thread',     value: '5.8 GHz',   pct: 82 },
  { label: 'Deploy Speed',          value: '15 seconds', pct: 96 },
]

export default function FeaturesPage() {
  useSeo({
    title: 'Features',
    description: 'Compute, storage, network, and managed services — built for developers who want maximum control and minimum surprise.',
    path: '/features',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Features"
        title="All the cloud,"
        accent="none of the bloat."
        subtitle="Compute, storage, network, and managed services — built for developers who want maximum control and minimum surprise."
      >
        <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary">Start free <ArrowRight size={16} /></a>
        <Link to="/pricing" className="nl-btn-ghost">View pricing</Link>
      </PageHero>

      {/* Benchmarks */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Benchmarks</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)', marginBottom: 16 }}>
              Built on bare-metal performance
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t-med)', lineHeight: 1.6 }}>
              AMD EPYC Gen4 + all-NVMe SSD across every plan. Numbers from internal fio + iperf3 runs.
            </p>
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(24px,3vw,36px)' }}>
            {BENCH.map((b, i) => (
              <Bar key={b.label} label={b.label} value={b.value} pct={b.pct} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* All features grid */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Everything included</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>All features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: (i % 4) * 0.05 }}
                style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 24 }}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + f.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + f.accent + ' 28%, transparent)', marginBottom: 16 }}
                >
                  <f.Icon size={20} style={{ color: f.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)', marginBottom: 7 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.6 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Try it free" subtitle="₹3,500 in starter credits. No card required." primaryLabel="Start free" />
      <LandingFooter />
    </div>
  )
}

function Bar({ label, value, pct, delay }: { label: string; value: string; pct: number; delay: number }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 13, color: 'var(--t-med)' }}>{label}</span>
        <span className="nl-mono" style={{ fontSize: 12.5, color: 'var(--brand)' }}>{value}</span>
      </div>
      <div style={{ height: 7, borderRadius: 'var(--r-full)', background: 'var(--nl-4)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: '0%' }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 'var(--r-full)', background: 'linear-gradient(90deg, var(--a-lime), var(--a-cyan))' }}
        />
      </div>
    </div>
  )
}
