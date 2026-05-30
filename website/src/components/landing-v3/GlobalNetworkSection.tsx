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
      <div className="nl-eyebrow" style={{ marginBottom: 20 }}>Global network</div>
      <h2 className="nl-head" style={{ fontSize: 'clamp(28px,4vw,52px)', color: 'var(--t-hi)', marginBottom: 8 }}>
        Fifteen regions. One platform.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--t-med)', lineHeight: 1.7, maxWidth: 520 }}>
        We run dedicated KVM nodes in every region so your servers get native-speed
        networking — no noisy-neighbour public infrastructure.
      </p>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 nl-grid-surface"
        style={{ marginTop: 52 }}
      >
        {REGIONS.map((r) => (
          <div
            key={r}
            className="nl-cell text-center cursor-default transition-colors"
            style={{ padding: '32px 24px' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-0)')}
          >
            <span
              className="nl-status-dot block rounded-full"
              style={{ width: 6, height: 6, background: 'var(--c-green)', margin: '0 auto 12px', boxShadow: '0 0 8px var(--c-green)' }}
            />
            <div className="nl-head" style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 6, letterSpacing: '.06em' }}>
              {r}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c-green)' }}>
              Operational
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
