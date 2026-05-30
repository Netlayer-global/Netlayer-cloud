/**
 * Keyword marquee strip — faint giant Bebas words scrolling, with lime
 * dashes between them. Pure decoration / brand rhythm, like Fireblox.
 */
const WORDS = ['COMPUTE', 'BARE METAL', 'GPU', 'STORAGE', 'NETWORK', 'KUBERNETES', 'DATABASES']

export function StatsBar() {
  const run = [...WORDS, ...WORDS]
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
        padding: '18px 0',
        background: 'var(--nl-0)',
      }}
    >
      <div className="nl-marquee-track">
        {run.map((w, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span
              className="nl-display"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 36,
                padding: '0 26px',
                letterSpacing: '.05em',
                color: 'color-mix(in srgb, var(--t-hi) 8%, transparent)',
              }}
            >
              {w}
            </span>
            <span
              className="nl-display"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 36,
                padding: '0 4px',
                color: 'color-mix(in srgb, var(--brand) 35%, transparent)',
              }}
            >
              ——
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
