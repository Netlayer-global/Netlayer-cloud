/**
 * TickerStrip — VAULTEX crypto-ticker adapted to live server/region metrics.
 *
 * A continuous monospace marquee of region status + key fleet numbers,
 * each with a tiny coloured delta. Pure brand rhythm; sits directly under
 * the hero. Theme-aware via CSS tokens.
 */
type Tick = { label: string; value: string; delta: string; up: boolean }

const TICKS: Tick[] = [
  { label: 'MUM', value: '99.99%', delta: '+0.01', up: true },
  { label: 'DEL', value: '24.6ms', delta: '-1.2', up: true },
  { label: 'BLR', value: '99.98%', delta: '+0.00', up: true },
  { label: 'SGP', value: '38.1ms', delta: '-0.4', up: true },
  { label: 'FRA', value: '99.99%', delta: '+0.02', up: true },
  { label: 'LON', value: '42.0ms', delta: '+0.6', up: false },
  { label: 'NYC', value: '99.97%', delta: '+0.01', up: true },
  { label: 'TYO', value: '36.7ms', delta: '-0.9', up: true },
  { label: 'SYD', value: '99.99%', delta: '+0.00', up: true },
  { label: 'DXB', value: '29.4ms', delta: '-2.1', up: true },
]

export function TickerStrip() {
  const run = [...TICKS, ...TICKS]
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
        background: 'var(--nl-1)',
        padding: '12px 0',
      }}
    >
      <div className="nl-ticker-track">
        {run.map((t, i) => (
          <span key={i} className="inline-flex items-center" style={{ padding: '0 22px', borderRight: '1px solid var(--b-subtle)' }}>
            <span className="nl-mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--t-low)', marginRight: 10 }}>
              {t.label}
            </span>
            <span className="nl-mono" style={{ fontSize: 12, color: 'var(--t-hi)', marginRight: 8 }}>
              {t.value}
            </span>
            <span
              className="nl-mono"
              style={{ fontSize: 10.5, color: t.up ? 'var(--c-green)' : 'var(--c-red)' }}
            >
              {t.up ? '▲' : '▼'} {t.delta}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
