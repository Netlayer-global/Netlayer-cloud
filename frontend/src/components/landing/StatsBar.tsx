import { useCountUp } from '../../hooks/useCountUp'
import { useInView } from '../../hooks/useInView'

interface Stat {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  label: string
}

const STATS: Stat[] = [
  { value: 500_000, suffix: '+',  label: 'Servers deployed' },
  { value: 15,                    label: 'Global regions' },
  { value: 99.99, decimals: 2, suffix: '%', label: 'Uptime SLA' },
  { value: 0.0027, decimals: 4, prefix: '$', label: 'per hour' },
]

export function StatsBar() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  return (
    <section ref={ref} className="border-y border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} enabled={inView} />
        ))}
      </div>
    </section>
  )
}

function StatCard({ stat, enabled }: { stat: Stat; enabled: boolean }) {
  const v = useCountUp({ to: stat.value, decimals: stat.decimals ?? 0, enabled, duration: 1800 })
  const formatted = stat.decimals
    ? v.toFixed(stat.decimals)
    : Math.floor(v).toLocaleString()
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">{stat.label}</div>
    </div>
  )
}
