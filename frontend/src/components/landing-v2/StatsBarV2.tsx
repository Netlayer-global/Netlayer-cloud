import { motion } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'

const STATS = [
  { value: 500_000, suffix: '+',  label: 'Servers deployed' },
  { value: 15,                    suffix: '',   label: 'Global regions' },
  { value: 99.99,                 suffix: '%',  label: 'Uptime SLA',     decimals: 2 },
  { value: 31,                    suffix: 's',  label: 'Avg deploy time' },
] as const

export function StatsBarV2() {
  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-px nl-glass rounded-2xl overflow-hidden"
      >
        {STATS.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </motion.div>
    </section>
  )
}

function Stat({ value, suffix, label, decimals = 0 }: { value: number; suffix: string; label: string; decimals?: number }) {
  const display = useCountUp(value, 1800, decimals)
  return (
    <div className="bg-[var(--nl-surface)] px-6 py-9 text-center group hover:bg-[var(--nl-surface-2)] transition-colors">
      <div className="text-[40px] sm:text-[44px] font-semibold tracking-tight">
        <span className="nl-gradient-text-blue">{display}{suffix}</span>
      </div>
      <div className="mt-2 text-[12.5px] text-[var(--nl-text-muted)] uppercase tracking-[0.15em]">
        {label}
      </div>
    </div>
  )
}
