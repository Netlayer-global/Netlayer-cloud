/**
 * Node coverage grid (Fireblox node-map style). Each region cell shows a
 * pulsing lime status dot + city + "Operational". VPS regions.
 */
const REGIONS = [
  'Mumbai', 'Delhi NCR', 'Bangalore', 'Singapore', 'Tokyo',
  'Seoul', 'Sydney', 'Frankfurt', 'London', 'Paris',
  'Amsterdam', 'New York', 'Los Angeles', 'São Paulo', 'Dubai',
]

export function GlobalNetworkSection() {
  return (
    <section
      id="network"
      style={{ padding: 'clamp(64px,9vw,100px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}
    >
      <div className="nl-eyebrow" style={{ marginBottom: 24 }}>Global network · 15 regions</div>
      <h2 className="nl-display" style={{ fontSize: 'clamp(32px,4.5vw,60px)', color: 'var(--t-hi)', marginBottom: 12 }}>
        Fifteen regions.{' '}
        <span className="nl-stroke-brand" style={{ fontStyle: 'italic' }}>One platform.</span>
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--t-med)', lineHeight: 1.7, maxWidth: 520 }}>
        We run dedicated KVM nodes in every region so your servers get native-speed
        networking — no noisy-neighbour public infrastructure.
      </p>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 nl-grid-surface"
        style={{ marginTop: 56, border: '1px solid var(--b-subtle)' }}
      >
        {REGIONS.map((r) => (
          <div
            key={r}
            className="nl-cell text-center cursor-default transition-colors"
            style={{ padding: '34px 24px' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-0)')}
          >
            <span
              className="nl-status-dot block rounded-full"
              style={{ width: 7, height: 7, background: 'var(--c-green)', margin: '0 auto 14px', boxShadow: '0 0 8px var(--c-green)' }}
            />
            <div className="nl-head" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 7 }}>
              {r}
            </div>
            <div className="nl-mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c-green)' }}>
              Operational
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
