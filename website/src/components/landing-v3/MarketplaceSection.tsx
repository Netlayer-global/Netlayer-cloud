/**
 * Live console mockup (Fireblox dashboard-preview style). A faux NetLayer
 * console: top nav, KPI row, and a live server-health table. Lime accents,
 * green status, VPS data.
 */
const KPIS = [
  { label: 'Active servers', val: '248', tone: '' },
  { label: 'Servers at risk', val: '0', tone: 'red' },
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
    <div style={{ padding: 'clamp(60px,8vw,80px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}>
      <div className="nl-eyebrow" style={{ marginBottom: 12 }}>Live console</div>
      <h2 className="nl-head" style={{ fontSize: 'clamp(28px,4vw,52px)', color: 'var(--t-hi)', marginBottom: 8 }}>
        Every server. Every metric. One console.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--t-med)', maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
        Monitor, deploy, resize, and raise tickets in real time — no waiting on a
        support queue for a status update.
      </p>

      {/* mock window */}
      <div style={{ border: '1px solid var(--b-strong)', background: 'var(--nl-1)', overflow: 'hidden', borderRadius: 'var(--r-md)' }}>
        {/* header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '16px 24px', borderBottom: '1px solid var(--b-default)', background: 'var(--nl-2)' }}
        >
          <div className="flex items-center gap-2.5" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--t-hi)' }}>
            <span
              className="nl-display flex items-center justify-center"
              style={{ width: 24, height: 24, background: 'var(--brand)', color: 'var(--brand-fg)', fontFamily: 'var(--font-display)', fontSize: 15 }}
            >
              N
            </span>
            NetLayer Console
          </div>
          <div className="hidden sm:flex gap-6">
            {['Servers', 'Network', 'Storage', 'Billing'].map((t, i) => (
              <span
                key={t}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
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
            <div key={k.label} className="nl-cell" style={{ background: 'var(--nl-1)', padding: '28px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--t-low)', marginBottom: 10 }}>
                {k.label}
              </div>
              <div className="nl-display" style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, color: toneColor(k.tone) }}>
                {k.val}
              </div>
            </div>
          ))}
        </div>

        {/* table */}
        <div style={{ padding: 24, borderTop: '1px solid var(--b-default)', background: 'var(--nl-1)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
              Server health
            </span>
            <span
              style={{
                fontSize: 9, padding: '2px 8px', letterSpacing: '.08em',
                background: 'var(--c-green-d)', border: '1px solid color-mix(in srgb, var(--c-green) 30%, transparent)', color: 'var(--c-green)',
              }}
            >
              LIVE
            </span>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr>
                  {['Server', 'Region', 'Plan', 'CPU', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
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
                    <td className="nl-head" style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-hi)', padding: '12px', borderBottom: '1px solid var(--b-subtle)', letterSpacing: '.03em' }}>
                      {r.id}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--t-med)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>{r.region}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '3px 9px', border: '1px solid var(--b-strong)', color: 'var(--t-med)' }}>
                        {r.plan}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--t-med)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>{r.cpu}</td>
                    <td style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-green)', padding: '12px', borderBottom: '1px solid var(--b-subtle)' }}>
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
