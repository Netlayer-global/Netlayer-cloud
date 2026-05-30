/**
 * Keyword marquee strip — faint giant serif words scrolling, with lime
 * mono separators between them. Pure decoration / brand rhythm. VAULTEX
 * premium type (Playfair display).
 */
const WORDS = ['COMPUTE', 'BARE METAL', 'GPU', 'STORAGE', 'NETWORK', 'KUBERNETES', 'DATABASES']

export function StatsBar() {
  const run = [...WORDS, ...WORDS]
  return (
    <div
      className="overflow-hidden"
      style={{
        borderBottom: '1px solid var(--b-subtle)',
        padding: '22px 0',
        background: 'var(--nl-0)',
      }}
    >
      <div className="nl-marquee-track">
        {run.map((w, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span
              className="nl-display"
              style={{
                fontSize: 44,
                fontStyle: 'italic',
                padding: '0 30px',
                color: 'color-mix(in srgb, var(--t-hi) 9%, transparent)',
              }}
            >
              {w}
            </span>
            <span
              className="nl-mono"
              style={{
                fontSize: 18,
                padding: '0 4px',
                color: 'color-mix(in srgb, var(--brand) 50%, transparent)',
              }}
            >
              ✳
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
