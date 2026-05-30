/**
 * 3-column big-number stats grid (Fireblox style: huge Bebas numerals on
 * hairline-divided cells). VPS metrics, lime accents.
 */
const STATS = [
  { num: '15+',     label: 'Global regions' },
  { num: '50,000+', label: 'Developers building' },
  { num: '99.99%',  label: 'Uptime SLA' },
] as const

export function AnnouncementBar() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 nl-grid-surface"
      style={{ borderTop: '1px solid var(--b-subtle)' }}
    >
      {STATS.map((s) => (
        <div key={s.label} className="nl-cell" style={{ padding: 'clamp(40px,6vw,58px) clamp(24px,5vw,52px)' }}>
          <div
            className="nl-display"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,7vw,92px)', color: 'var(--t-hi)', marginBottom: 10 }}
          >
            {s.num}
          </div>
          <div
            style={{
              fontSize: 11.5, fontWeight: 600, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--t-low)',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
