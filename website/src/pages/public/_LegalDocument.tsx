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
 * Full-width band with a centered title header, then a two-column body:
 * a sticky table of contents on the left and formatted prose on the right.
 * Stacks to a single column on mobile. Premium type + theme tokens.
 */
export function LegalDocument({ title, lastUpdated, sections }: Props) {
  return (
    <main>
      {/* header band */}
      <section style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(120px,16vh,170px) clamp(20px,4vw,72px) clamp(32px,4vw,48px)' }}>
          <h1 className="nl-display" style={{ fontSize: 'clamp(34px,4.5vw,56px)', color: 'var(--t-hi)', lineHeight: 1.1 }}>
            {title}
          </h1>
          <p className="nl-mono" style={{ marginTop: 12, fontSize: 12.5, color: 'var(--t-low)' }}>
            Last updated {lastUpdated}
          </p>
        </div>
      </section>

      {/* body */}
      <section style={{ background: 'var(--nl-0)' }}>
        <div className="nl-container" style={{ padding: 'clamp(40px,6vw,72px) clamp(20px,4vw,72px) clamp(56px,8vw,96px)' }}>
          <div className="grid lg:grid-cols-[240px_1fr] gap-10 lg:gap-16">
            <nav className="lg:sticky lg:top-24 self-start">
              <div className="nl-eyebrow" style={{ marginBottom: 14, color: 'var(--brand)' }}>On this page</div>
              <ul className="flex flex-col gap-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="transition-colors"
                      style={{ fontSize: 13, color: 'var(--t-med)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <article style={{ maxWidth: 760 }}>
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24" style={{ marginBottom: 36 }}>
                  <h2 className="nl-head" style={{ fontSize: 21, color: 'var(--t-hi)', marginBottom: 14 }}>
                    {s.title}
                  </h2>
                  <div className="flex flex-col gap-3" style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--t-med)' }}>
                    {s.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
