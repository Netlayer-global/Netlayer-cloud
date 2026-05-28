import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, HardDrive, Wifi, ShieldCheck, Cpu, Lock, Network, Globe2,
  Camera, Database, Cloud, GitMerge,
} from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'

interface Feature {
  Icon: any
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  { Icon: Zap,         title: '30-second deploys',      desc: 'Linked-clone images and pre-warmed pools across every region.' },
  { Icon: HardDrive,   title: 'NVMe SSD on every plan', desc: 'No tiered HDD pricing — all storage is fast by default.' },
  { Icon: Wifi,        title: '25 Gbps networking',     desc: 'Per-host uplinks with line-rate throughput on every flow.' },
  { Icon: ShieldCheck, title: 'Free DDoS protection',   desc: 'Always-on hardware DDoS scrubbing on every IP.' },
  { Icon: Cpu,         title: 'KVM hypervisor',         desc: 'Strong isolation, full virtualization, no shared kernels.' },
  { Icon: Lock,        title: 'Full root access',       desc: 'You bring the OS, we get out of your way.' },
  { Icon: Network,     title: 'Private VPC',            desc: 'Isolated software-defined networks free on every region.' },
  { Icon: Globe2,      title: 'Free IPv6',              desc: '/64 IPv6 block on every server, IPv4 + IPv6 dual stack.' },
  { Icon: Camera,      title: 'Snapshots',              desc: 'Point-in-time disk snapshots, restore in seconds.' },
  { Icon: HardDrive,   title: 'Block storage',          desc: 'Detachable NVMe volumes that survive server lifecycle.' },
  { Icon: Cloud,       title: 'Object storage',         desc: 'S3-compatible buckets with optional public access.' },
  { Icon: Database,    title: 'Managed databases',      desc: 'Postgres, MySQL, Redis with automated backups and failover.' },
]

export default function FeaturesPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{ border: '1px solid var(--brand-b)', background: 'var(--brand-d)', color: 'var(--brand)' }}
          >
            Features
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            All the cloud, none of the bloat
          </h1>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            Compute, storage, network, and managed services — built for developers who want
            maximum control and minimum surprise.
          </p>
        </motion.div>
      </section>

      {/* Performance benchmarks */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
            Benchmarks
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built on bare metal performance</h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--t-med)' }}>
            AMD EPYC Gen4 + all-NVMe SSD across every plan. Numbers from internal fio + iperf3 runs.
          </p>
        </div>
        <div className="nl-card p-6 max-w-3xl mx-auto">
          {[
            { label: 'NVMe Sequential Read',  value: '14.2 GB/s', pct: 92 },
            { label: 'NVMe Sequential Write', value: '8.7 GB/s',  pct: 71 },
            { label: 'Network Throughput',    value: '25 Gbps',   pct: 98 },
            { label: 'CPU Single-Thread',     value: '5.8 GHz',   pct: 82 },
            { label: 'Deploy Speed',          value: '15 seconds', pct: 96 },
          ].map((b, i) => (
            <Bar key={b.label} label={b.label} value={b.value} pct={b.pct} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* All features grid */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
            Everything included
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">All features</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: (i % 6) * 0.05 }}
              className="nl-card p-5"
            >
              <f.Icon size={18} style={{ color: 'var(--brand)' }} />
              <div className="mt-3 text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{f.title}</div>
              <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--t-med)' }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Try it free</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-med)' }}>
          ₹3,500 in starter credits. No card required.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register" className="nl-btn-primary">Start free</Link>
          <Link to="/pricing" className="nl-btn-ghost">View pricing →</Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function Bar({ label, value, pct, delay }: { label: string; value: string; pct: number; delay: number }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--t-med)' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: 'var(--brand)' }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--b-default)' }}>
        <motion.div
          initial={{ width: '0%' }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--brand), #a8e620)' }}
        />
      </div>
    </div>
  )
}
