import { SectionHeader } from './SectionHeader'

/**
 * GlobalNetworkSection — SVG world map with pulsing region pins and
 * connection arcs between major hubs. Below the map is a compact pill
 * list of all 15 regions with simulated latency numbers.
 */

interface RegionPin {
  city: string
  country: string
  flag: string
  lat: number
  lng: number
  latency: number
}

const REGIONS: RegionPin[] = [
  { city: 'Mumbai',      country: 'IN', flag: '🇮🇳', lat: 19.08,  lng: 72.88,  latency: 12 },
  { city: 'Delhi',       country: 'IN', flag: '🇮🇳', lat: 28.61,  lng: 77.21,  latency: 14 },
  { city: 'Singapore',   country: 'SG', flag: '🇸🇬', lat: 1.35,   lng: 103.82, latency: 22 },
  { city: 'Tokyo',       country: 'JP', flag: '🇯🇵', lat: 35.68,  lng: 139.69, latency: 38 },
  { city: 'Seoul',       country: 'KR', flag: '🇰🇷', lat: 37.56,  lng: 126.97, latency: 36 },
  { city: 'Sydney',      country: 'AU', flag: '🇦🇺', lat: -33.87, lng: 151.21, latency: 64 },
  { city: 'Frankfurt',   country: 'DE', flag: '🇩🇪', lat: 50.11,  lng: 8.68,   latency: 88 },
  { city: 'London',      country: 'GB', flag: '🇬🇧', lat: 51.51,  lng: -0.13,  latency: 92 },
  { city: 'Paris',       country: 'FR', flag: '🇫🇷', lat: 48.86,  lng: 2.35,   latency: 90 },
  { city: 'Amsterdam',   country: 'NL', flag: '🇳🇱', lat: 52.37,  lng: 4.90,   latency: 90 },
  { city: 'New York',    country: 'US', flag: '🇺🇸', lat: 40.71,  lng: -74.01, latency: 110 },
  { city: 'Chicago',     country: 'US', flag: '🇺🇸', lat: 41.88,  lng: -87.63, latency: 112 },
  { city: 'Los Angeles', country: 'US', flag: '🇺🇸', lat: 34.05,  lng: -118.24,latency: 130 },
  { city: 'São Paulo',   country: 'BR', flag: '🇧🇷', lat: -23.55, lng: -46.63, latency: 162 },
  { city: 'Dubai',       country: 'AE', flag: '🇦🇪', lat: 25.20,  lng: 55.27,  latency: 30 },
]

const projectToSvg = (lat: number, lng: number) => {
  // Equirectangular projection into 800x400 viewbox
  const x = ((lng + 180) / 360) * 800
  const y = ((90 - lat) / 180) * 400
  return { x, y }
}

export function GlobalNetworkSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="NETWORK"
          title="15 regions across 5 continents"
          subtitle="Deploy close to your users. Every region has private networking and DDoS protection."
        />

        <div className="mt-14 relative w-full max-w-5xl mx-auto" style={{ aspectRatio: '2/1' }}>
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.6" fill="var(--b-strong)" />
              </pattern>
            </defs>
            {/* Simplified continent silhouettes (own design — abstract, not copied) */}
            <g fill="url(#dotGrid)">
              <path d="M 65,135 C 100,80 200,75 250,115 C 285,148 290,200 270,232 L 230,255 L 175,255 L 120,225 L 90,190 Z" />
              <path d="M 235,275 C 270,265 320,295 320,350 L 305,395 L 270,400 L 248,360 L 240,310 Z" />
              <path d="M 360,110 C 390,90 440,95 460,120 L 450,160 L 415,170 L 380,155 Z" />
              <path d="M 395,180 C 435,170 470,200 480,250 L 470,330 L 440,365 L 410,345 L 395,290 Z" />
              <path d="M 480,170 C 510,160 555,180 575,210 L 580,250 L 555,265 L 520,255 L 500,220 Z" />
              <path d="M 545,100 C 605,75 700,80 745,125 C 770,165 760,225 725,235 L 660,225 L 605,205 L 565,170 Z" />
              <path d="M 660,330 C 695,320 740,335 750,360 L 740,395 L 700,400 L 670,375 Z" />
            </g>

            {/* Connection arcs between hubs */}
            {[
              [REGIONS[0], REGIONS[2]],   // Mumbai → Singapore
              [REGIONS[2], REGIONS[3]],   // Singapore → Tokyo
              [REGIONS[6], REGIONS[10]],  // Frankfurt → NY
              [REGIONS[10], REGIONS[12]], // NY → LA
              [REGIONS[14], REGIONS[0]],  // Dubai → Mumbai
            ].map(([a, b], idx) => {
              const p1 = projectToSvg(a.lat, a.lng)
              const p2 = projectToSvg(b.lat, b.lng)
              const mx = (p1.x + p2.x) / 2
              const my = Math.min(p1.y, p2.y) - Math.abs(p2.x - p1.x) * 0.18
              return (
                <path
                  key={idx}
                  d={`M ${p1.x} ${p1.y} Q ${mx} ${my}, ${p2.x} ${p2.y}`}
                  stroke="var(--brand)"
                  strokeWidth="0.6"
                  strokeOpacity="0.25"
                  fill="none"
                />
              )
            })}

            {/* Region pins */}
            {REGIONS.map((r, i) => {
              const { x, y } = projectToSvg(r.lat, r.lng)
              return (
                <g key={r.city}>
                  <circle
                    cx={x} cy={y} r="12"
                    fill="none"
                    stroke="var(--brand)"
                    strokeOpacity="0.5"
                    style={{
                      animation: `nl-pulse-ring 2.4s cubic-bezier(.16,1,.3,1) infinite ${i * 0.15}s`,
                      transformOrigin: `${x}px ${y}px`,
                    }}
                  />
                  <circle cx={x} cy={y} r="8" fill="var(--brand-d)" stroke="var(--brand-b)" strokeWidth="1" />
                  <circle cx={x} cy={y} r="3.5" fill="var(--brand)" />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {REGIONS.map((r) => (
            <div
              key={r.city}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full"
              style={{
                background: 'var(--nl-2)',
                border: '1px solid var(--b-default)',
                fontSize: 12,
                color: 'var(--t-med)',
                cursor: 'default',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-default)')}
            >
              <span>{r.flag}</span>
              {r.city}
              <span style={{ color: 'var(--t-low)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {r.latency}ms
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
