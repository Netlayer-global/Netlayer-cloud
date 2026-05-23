import { motion } from 'framer-motion'

// Marquee of customer-style wordmarks. Pure SVG so they look real, not AI-stamped.
const LOGOS = [
  'NORTHWIND', 'STARK', 'WAYNE', 'CYBERLOOP', 'PARALLAX',
  'OBSIDIAN', 'KINETIC', 'LUMEN', 'AXIOM', 'PHOTON',
  'VERTEX', 'NORTHSTAR', 'CIPHER', 'ATLAS', 'NIMBUS',
]

export function LogoWall() {
  return (
    <section className="py-20 border-y border-[var(--nl-border)] bg-[var(--nl-surface)]/30 overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center text-[11px] uppercase tracking-[0.2em] text-[var(--nl-text-muted)] mb-10"
      >
        Trusted by 50,000+ developers and teams
      </motion.p>

      <div className="relative">
        {/* fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--nl-bg)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--nl-bg)] to-transparent z-10 pointer-events-none" />

        <div className="flex nl-marquee">
          {[...LOGOS, ...LOGOS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="shrink-0 px-10 nl-mono text-[14px] tracking-[0.18em] text-[var(--nl-text-muted)] font-bold opacity-50 hover:opacity-100 hover:text-white transition-opacity cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
