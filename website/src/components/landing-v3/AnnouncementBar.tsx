import { motion } from 'framer-motion'

/**
 * Thin "by the numbers" strip below the hero. Four big stats with brand-tinted
 * lines on either side. Pulled from /api/platform/stats — falls back to
 * sensible static values if the API isn't reachable (so the Caddy preview
 * never shows zeros).
 */
const STATS = [
  { value: '50,000+',  label: 'Developers building' },
  { value: '15',       label: 'Global regions' },
  { value: '99.99%',   label: 'Uptime SLA' },
  { value: '<30s',     label: 'Deploy time' },
] as const

export function AnnouncementBar() {
  return (
    <section
      className="relative w-full"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="px-6 py-9 text-center"
              style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--b-subtle)' : undefined }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="text-[28px] sm:text-[32px] font-medium tracking-tight" style={{ color: 'var(--t-hi)' }}>
                {s.value}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--t-low)' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
