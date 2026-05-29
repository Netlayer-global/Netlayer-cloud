/**
 * Region grid — every NetLayer region as a small card.
 *
 * 15 active regions today + 6 "coming soon" tagged ones. All on one page
 * keeps the visual punch ("look how big our footprint is") without the
 * SVG world-map weight. Each card shows a flag emoji + city + country
 * code + simulated latency.
 */

const ACTIVE = [
  ['Mumbai',     'IN', '🇮🇳', 12],
  ['Delhi NCR',  'IN', '🇮🇳', 14],
  ['Bangalore',  'IN', '🇮🇳', 18],
  ['Singapore',  'SG', '🇸🇬', 22],
  ['Tokyo',      'JP', '🇯🇵', 38],
  ['Seoul',      'KR', '🇰🇷', 36],
  ['Sydney',     'AU', '🇦🇺', 64],
  ['Frankfurt',  'DE', '🇩🇪', 88],
  ['London',     'GB', '🇬🇧', 92],
  ['Paris',      'FR', '🇫🇷', 90],
  ['Amsterdam',  'NL', '🇳🇱', 90],
  ['New York',   'US', '🇺🇸', 110],
  ['Los Angeles','US', '🇺🇸', 130],
  ['São Paulo',  'BR', '🇧🇷', 162],
  ['Dubai',      'AE', '🇦🇪', 30],
] as const

const COMING = [
  ['Hyderabad',  'IN', '🇮🇳'],
  ['Chennai',    'IN', '🇮🇳'],
  ['Hong Kong',  'HK', '🇭🇰'],
  ['Stockholm',  'SE', '🇸🇪'],
  ['Toronto',    'CA', '🇨🇦'],
  ['Cape Town',  'ZA', '🇿🇦'],
] as const

export function GlobalNetworkSection() {
  return (
    <section
      id="network"
      className="py-16 lg:py-24"
      style={{ background: 'var(--nl-0)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-[11px] uppercase tracking-[.22em] mb-3" style={{ color: 'var(--brand)' }}>
            Network
          </div>
          <h2
            className="tracking-tight leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, color: 'var(--t-hi)' }}
          >
            Build locally,{' '}
            <span style={{ color: 'var(--brand)' }}>ship to anywhere.</span>
          </h2>
          <p className="mt-5 text-[15px]" style={{ color: 'var(--t-med)' }}>
            15 active regions across 5 continents. Private VLAN, 25 Gbps
            backbone, and DDoS protection in every datacenter.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ACTIVE.map(([city, country, flag, latency]) => (
            <RegionCard
              key={String(city)}
              city={String(city)}
              country={String(country)}
              flag={String(flag)}
              latency={Number(latency)}
            />
          ))}
        </div>

        <div className="mt-8 text-[11px] uppercase tracking-[.18em] text-center" style={{ color: 'var(--t-low)' }}>
          Coming soon
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {COMING.map(([city, country, flag]) => (
            <span
              key={String(city)}
              className="inline-flex items-center gap-2 px-3 h-8 rounded-full text-[12px]"
              style={{
                background: 'var(--nl-1)',
                border: '1px dashed var(--b-strong)',
                color: 'var(--t-med)',
              }}
            >
              <span>{flag}</span>
              {city}
              <span style={{ color: 'var(--t-off)' }}>·</span>
              <span style={{ color: 'var(--t-off)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{country}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function RegionCard({
  city, country, flag, latency,
}: { city: string; country: string; flag: string; latency: number }) {
  return (
    <div
      className="rounded-md p-3.5 cursor-default transition-colors"
      style={{
        background: 'var(--nl-1)',
        border: '1px solid var(--b-default)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-default)')}
    >
      <div className="flex items-center justify-between">
        <span className="text-[20px] leading-none">{flag}</span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--t-off)' }}>{country}</span>
      </div>
      <div className="mt-3 text-[14px]" style={{ color: 'var(--t-hi)', fontWeight: 500 }}>{city}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--t-low)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
        {latency}ms latency
      </div>
    </div>
  )
}
