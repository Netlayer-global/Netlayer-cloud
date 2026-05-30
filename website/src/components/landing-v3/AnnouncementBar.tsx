/**
 * 3-cell stats band (VAULTEX style): large serif numerals with a mono
 * label, and a lime underline that grows on hover. Hairline-divided cells,
 * VPS metrics, theme-aware.
 */
const STATS = [
  { num: '15+',     label: 'Global regions', sub: 'India + 4 continents' },
  { num: '50,000+', label: 'Developers building', sub: 'and counting' },
  { num: '99.99%',  label: 'Uptime SLA', sub: 'credited automatically' },
] as const

export function AnnouncementBar() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 nl-grid-surface"
      style={{ borderTop: '1px solid var(--b-subtle)', borderBottom: '1px solid var(--b-subtle)' }}
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          className="nl-cell group cursor-default"
          style={{ padding: 'clamp(40px,6vw,62px) clamp(24px,5vw,52px)', transition: 'background var(--ease-med)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-0)')}
        >
          <div
            className="nl-display"
            style={{ fontSize: 'clamp(48px,6.5vw,84px)', color: 'var(--t-hi)', marginBottom: 16 }}
          >
            {s.num}
          </div>
          <div className="inline-block nl-underline">
            <div
              className="nl-mono"
              style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t-hi)' }}
            >
              {s.label}
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--t-low)', marginTop: 10 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
