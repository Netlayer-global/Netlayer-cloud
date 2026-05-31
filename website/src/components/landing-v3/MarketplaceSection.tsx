/**
 * Refined console mockup (VAULTEX dashboard-preview shell). A faux NetLayer
 * console: window chrome with traffic-light dots, KPI cards, and a live
 * server-health table. Lime accents, green status, VPS data, mono numerals.
 */
const KPIS = [
  { label: 'Active servers', val: '248', tone: '' },
  { label: 'Servers at risk', val: '0', tone: 'green' },
  { label: 'Current SLA', val: '99.99%', tone: 'green' },
  { label: 'Open tickets', val: '2', tone: '' },
]

const ROWS = [
  { id: 'web-prod-01', region: 'Mumbai', plan: 'c3.large', cpu: '34%', status: 'Running' },
  { id: 'db-primary', region: 'Delhi NCR', plan: 'bm.epyc-2', cpu: '61%', status: 'Running' },
  { id: 'cache-redis', region: 'Bangalore', plan: 'c2.medium', cpu: '12%', status: 'Running' },
  { id: 'gpu-train-04', region: 'Mumbai', plan: 'NVIDIA A100', cpu: '88%', status: 'Running' },
  { id: 'edge-proxy', region: 'Singapore', plan: 'c2.small', cpu: '7%', status: 'Running' },
]

const toneColor = (t: string) =>
  t === 'red' ? 'var(--c-red)' : t === 'green' ? 'var(--c-green)' : 'var(--t-hi)'

export function MarketplaceSection() {
  return (
    <div style={{ padding: 'clamp(64px,9vw,100px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}>
      <div className="nl-eyebrow" style={{ marginBottom: 18 }}>Live console</div>
      <h2 className="nl-display" style={{ fontSize: 'clamp(32px,4.5vw,60px)', color: 'var(--t-hi)', marginBottom: 12, maxWidth: 720 }}>
        Every server. Every metric.{' '}
        <span style={{ color: 'var(--brand)' }}>One console.</span>
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--t-med)', maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
        Monitor, deploy, resize, and raise tickets in real time — no waiting on a
        support queue for a status update.
      </p>

      {/* mock window */}
      <div style={{ border: '1px solid var(--b-strong)', background: 'var(--nl-1)', overflow: 'hidden', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)' }}>
        {/* window chrome */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '14px 20px', borderBottom: '1px solid var(--b-default)', background: 'var(--nl-2)' }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 11, height: 11, background: 'var(--c-red)' }} />
            <span className="rounded-full" style={{ width: 11, height: 11, background: 'var(--c-amber)' }} />
            <span className="rounded-full" style={{ width: 11, height: 11, background: 'var(--c-green)' }} />
          </div>
          <div className="nl-mono flex items-center gap-2" style={{ fontSize: 11, letterSpacing: '.06em', color: 'var(--t-low)' }}>
            <span
              className="inline-flex items-center justify-center"
              style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--brand)', color: 'var(--brand-fg)', fontWeight: 700, fontSize: 11 }}
            >
              N
            </span>
            console.netlayer.cloud
          </div>
          <div className="hidden sm:flex gap-5">
            {['Servers', 'Network', 'Billing'].map((t, i) => (
              <span
                key={t}
                className="nl-mono"
                style={{
                  fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: i === 0 ? 'var(--t-hi)' : 'var(--t-low)',
                  borderBottom: i === 0 ? '1px solid var(--brand)' : '1px solid transparent',
                  paddingBottom: 4,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 nl-grid-surface">
          {KPIS.map((k) => (
            <div key={k.label} className="nl-cell" style={{ background: 'var(--nl-1)', padding: '26px 24px' }}>
              <div className="nl-mono" style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)', marginBottom: 12 }}>
                {k.label}
              </div>
              <div className="nl-display" style={{ fontSize: 40, lineHeight: 1, color: toneColor(k.tone) }}>
                {k.val}
              </div>
            </div>
          ))}
        </div>

        {/* table */}
        <div style={{ padding: 24, borderTop: '1px solid var(--b-default)', background: 'var(--nl-1)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <span className="nl-mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
              Server health
            </span>
            <span
              className="nl-mono"
              style={{
                fontSize: 9, padding: '2px 8px', letterSpacing: '.08em', borderRadius: 'var(--r-full)',
                background: 'var(--c-green-d)', border: '1px solid color-mix(in srgb, var(--c-green) 30%, transparent)', color: 'var(--c-green)',
              }}
            >
              ● LIVE
            </span>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr>
                  {['Server', 'Region', 'Plan', 'CPU', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="nl-mono"
                      style={{
                        fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                        color: 'var(--t-off)', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--b-default)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.id}>
                    <td className="nl-mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t-hi)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>
                      {r.id}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--t-med)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>{r.region}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>
                      <span className="nl-mono" style={{ fontSize: 10, letterSpacing: '.04em', padding: '3px 9px', borderRadius: 'var(--r-full)', border: '1px solid var(--b-strong)', color: 'var(--t-med)' }}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="nl-mono" style={{ fontSize: 12.5, color: 'var(--t-med)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>{r.cpu}</td>
                    <td style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-green)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>
                      ● {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
