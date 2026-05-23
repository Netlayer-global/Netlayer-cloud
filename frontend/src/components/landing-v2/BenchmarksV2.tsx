import { motion } from 'framer-motion'
import { Zap, Cpu, HardDrive, Network } from 'lucide-react'

const BENCHMARKS = [
  { icon: HardDrive, label: 'Sequential read',      metric: '14.2 GB/s', value: 100, sub: 'NVMe Gen4' },
  { icon: HardDrive, label: 'Sequential write',     metric: '8.7 GB/s',  value: 70,  sub: 'NVMe Gen4' },
  { icon: Zap,       label: 'Random 4K IOPS',       metric: '1.2M',      value: 100, sub: '4K random reads' },
  { icon: Network,   label: 'Network throughput',   metric: '25 Gbps',   value: 100, sub: 'Per-server uplink' },
  { icon: Cpu,       label: 'CPU single-core',      metric: '4.5 GHz',   value: 95,  sub: 'AMD EPYC Gen4' },
  { icon: Cpu,       label: 'Deploy time (median)', metric: '31s',       value: 100, sub: 'cold image build' },
]

const COMPARISONS = [
  { feature: 'NVMe on entry plan',     netlayer: 'Standard',     aws: '$0.10/GB-mo', do: 'Standard',    vultr: 'Standard' },
  { feature: '25 Gbps networking',     netlayer: 'Standard',     aws: 'Premium tier', do: '10 Gbps max', vultr: '10 Gbps' },
  { feature: 'Free DDoS protection',   netlayer: '✓',            aws: '$3,000/mo',   do: '✓',            vultr: '✓' },
  { feature: 'No egress charges',      netlayer: '✓',            aws: '$0.09/GB',    do: 'Limited',      vultr: 'Bundled' },
  { feature: 'Indian data residency',  netlayer: 'Mumbai+Delhi', aws: 'Mumbai',      do: 'Bangalore',    vultr: 'Mumbai' },
  { feature: 'Live migration',         netlayer: '✓',            aws: 'Limited',     do: '—',            vultr: '—' },
]

export function BenchmarksV2() {
  return (
    <section className="py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl"
      >
        <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--nl-brand-2)] mb-4">
          Built different
        </p>
        <h2 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] nl-gradient-text">
          Performance you can
          <br />
          measure on day one.
        </h2>
        <p className="mt-6 text-[17px] text-[var(--nl-text-soft)] leading-[1.55]">
          NVMe on every plan. AMD EPYC Gen4 + Intel Xeon. 25 Gbps networking. No virtualisation tax.
        </p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark bars */}
        <div className="nl-glass rounded-2xl p-7">
          <h3 className="text-[15px] font-semibold text-white mb-1">Real-world benchmarks</h3>
          <p className="text-[12.5px] text-[var(--nl-text-muted)] mb-6">From an idle c3.large in Mumbai, May 2026</p>
          <div className="space-y-5">
            {BENCHMARKS.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--nl-text-soft)]">
                    <b.icon size={13} className="text-[var(--nl-brand-2)]" />
                    {b.label}
                  </div>
                  <div className="nl-mono text-[13px] text-white font-medium">{b.metric}</div>
                </div>
                <div className="h-1 bg-white/[0.04] rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.value}%` }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded bg-gradient-to-r from-[var(--nl-brand)] to-[var(--nl-brand-2)]"
                  />
                </div>
                <p className="text-[10.5px] text-[var(--nl-text-muted)] mt-1">{b.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="nl-glass rounded-2xl p-7 overflow-hidden">
          <h3 className="text-[15px] font-semibold text-white mb-1">vs the hyperscalers</h3>
          <p className="text-[12.5px] text-[var(--nl-text-muted)] mb-6">Public pricing snapshot, like-for-like configurations</p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[480px] text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-[var(--nl-text-muted)] border-b border-[var(--nl-border)]">
                  <th className="pb-3 px-2 font-medium">Feature</th>
                  <th className="pb-3 px-2 font-medium text-[var(--nl-brand-2)]">NetLayer</th>
                  <th className="pb-3 px-2 font-medium">AWS</th>
                  <th className="pb-3 px-2 font-medium">DO</th>
                  <th className="pb-3 px-2 font-medium">Vultr</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((c, i) => (
                  <tr key={c.feature} className={i < COMPARISONS.length - 1 ? 'border-b border-[var(--nl-border)]/50' : ''}>
                    <td className="py-3 px-2 text-[var(--nl-text-soft)]">{c.feature}</td>
                    <td className="py-3 px-2 text-white nl-mono">{c.netlayer}</td>
                    <td className="py-3 px-2 text-[var(--nl-text-muted)] nl-mono">{c.aws}</td>
                    <td className="py-3 px-2 text-[var(--nl-text-muted)] nl-mono">{c.do}</td>
                    <td className="py-3 px-2 text-[var(--nl-text-muted)] nl-mono">{c.vultr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
