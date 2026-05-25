import { motion } from 'framer-motion'

interface Section {
  id: string
  title: string
  body: string[]
}

interface Props {
  title: string
  lastUpdated: string
  sections: Section[]
}

/**
 * Shared layout for the privacy policy and terms of service pages.
 *
 * Two-column on desktop: a sticky table of contents on the left,
 * formatted prose on the right. Stacks to a single column on mobile.
 */
export function LegalDocument({ title, lastUpdated, sections }: Props) {
  return (
    <main className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          className="font-semibold tracking-tight"
          style={{ fontSize: 'clamp(36px, 4vw, 48px)', lineHeight: 1.1 }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-low)' }}>
          Last updated {lastUpdated}
        </p>
      </motion.div>

      <div className="mt-10 grid lg:grid-cols-[220px_1fr] gap-10">
        <nav className="lg:sticky lg:top-24 self-start">
          <div
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{ color: 'var(--t-low)' }}
          >
            On this page
          </div>
          <ul className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-xs hover:text-[color:var(--brand)] transition-colors"
                  style={{ color: 'var(--t-med)' }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-8 scroll-mt-24">
              <h2
                className="text-xl font-semibold tracking-tight mb-3"
                style={{ color: 'var(--t-hi)' }}
              >
                {s.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>
                {s.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
