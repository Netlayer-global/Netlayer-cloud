import { useState } from 'react'
import { cn } from '../../lib/utils'

interface RegionPin {
  slug: string
  city: string
  country: string
  flag: string
  x: number   // 0-1000 in SVG coordinate space
  y: number   // 0-500
  latency: number
  available: boolean
}

// Approximate equirectangular projection coordinates (SVG 1000x500)
const REGIONS: RegionPin[] = [
  // Asia
  { slug: 'mumbai',    city: 'Mumbai',    country: 'India',     flag: '🇮🇳', x: 720, y: 240, latency: 12,  available: true },
  { slug: 'delhi',     city: 'Delhi',     country: 'India',     flag: '🇮🇳', x: 730, y: 215, latency: 18,  available: true },
  { slug: 'singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', x: 800, y: 280, latency: 45,  available: true },
  { slug: 'tokyo',     city: 'Tokyo',     country: 'Japan',     flag: '🇯🇵', x: 880, y: 220, latency: 70,  available: true },
  { slug: 'seoul',     city: 'Seoul',     country: 'Korea',     flag: '🇰🇷', x: 860, y: 215, latency: 75,  available: true },
  { slug: 'sydney',    city: 'Sydney',    country: 'Australia', flag: '🇦🇺', x: 900, y: 380, latency: 130, available: true },
  // Europe
  { slug: 'frankfurt', city: 'Frankfurt', country: 'Germany',     flag: '🇩🇪', x: 540, y: 195, latency: 110, available: true },
  { slug: 'london',    city: 'London',    country: 'UK',          flag: '🇬🇧', x: 510, y: 185, latency: 115, available: true },
  { slug: 'paris',     city: 'Paris',     country: 'France',      flag: '🇫🇷', x: 525, y: 195, latency: 112, available: true },
  { slug: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', x: 530, y: 180, latency: 108, available: true },
  // Americas
  { slug: 'new-york',     city: 'New York',    country: 'USA',    flag: '🇺🇸', x: 290, y: 215, latency: 180, available: true },
  { slug: 'chicago',      city: 'Chicago',     country: 'USA',    flag: '🇺🇸', x: 245, y: 210, latency: 195, available: true },
  { slug: 'los-angeles',  city: 'Los Angeles', country: 'USA',    flag: '🇺🇸', x: 175, y: 230, latency: 220, available: true },
  { slug: 'sao-paulo',    city: 'São Paulo',   country: 'Brazil', flag: '🇧🇷', x: 340, y: 380, latency: 290, available: true },
  // Middle East
  { slug: 'dubai',     city: 'Dubai',     country: 'UAE',       flag: '🇦🇪', x: 640, y: 245, latency: 95,  available: true },
]

export function GlobalNetwork() {
  const [active, setActive] = useState<RegionPin | null>(null)

  return (
    <section id="network" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Deploy close to your users
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            15 regions across 4 continents. Pick the one closest to your customers and ship.
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <svg
            viewBox="0 0 1000 500"
            className="relative w-full h-[300px] sm:h-[420px] lg:h-[500px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Equator + tropics for visual reference */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 5" />
            <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 5" />
            <line x1="0" y1="300" x2="1000" y2="300" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 5" />
            {/* Continent placeholders — hand-drawn rough shapes */}
            <ContinentPath />
            {/* Pins */}
            {REGIONS.map((r) => (
              <Pin key={r.slug} region={r} active={active?.slug === r.slug} onClick={() => setActive(r)} />
            ))}
          </svg>

          {/* Detail card */}
          {active && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 bg-[#0a0a0a] border border-white/[0.1] rounded-lg p-4 max-w-xs shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{active.flag}</span>
                <div>
                  <div className="font-semibold text-white">{active.city}</div>
                  <div className="text-xs text-gray-500">{active.country}</div>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="ml-auto text-gray-500 hover:text-white text-lg leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-white/[0.06]">
                <div className="flex justify-between">
                  <span>Avg latency from CDN</span>
                  <span className="text-white">{active.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>All plans available</span>
                  <span className="text-[#00d4ff]">✓</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Region chips below map */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 overflow-x-auto">
          {REGIONS.map((r) => (
            <button
              key={r.slug}
              onClick={() => setActive(r)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border bg-[#0d0d0d] cursor-pointer transition-colors',
                active?.slug === r.slug
                  ? 'border-[#0070f3] bg-[#0070f3]/5'
                  : 'border-white/[0.06] hover:border-white/[0.15]'
              )}
            >
              <span className="text-base">{r.flag}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs text-white truncate">{r.city}</div>
                <div className="text-[10px] text-gray-500">{r.latency}ms</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pin({ region, active, onClick }: { region: RegionPin; active: boolean; onClick: () => void }) {
  return (
    <g transform={`translate(${region.x},${region.y})`} onClick={onClick} className="cursor-pointer">
      {/* Pulse animation */}
      <circle r="14" fill="rgba(0,112,243,0.18)">
        <animate attributeName="r" from="6" to="20" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="6" fill="#0070f3" stroke="#00d4ff" strokeWidth={active ? 3 : 1.5} />
      <circle r="2" fill="white" />
    </g>
  )
}

/** Hand-traced rough continent silhouettes — close enough for an artistic backdrop. */
function ContinentPath() {
  return (
    <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1">
      {/* North America */}
      <path d="M 80 150 Q 130 130 200 145 Q 280 155 320 200 Q 290 250 240 270 Q 180 270 130 230 Q 95 195 80 150 Z" />
      {/* South America */}
      <path d="M 290 290 Q 320 300 340 360 Q 350 420 320 450 Q 290 440 280 400 Q 280 340 290 290 Z" />
      {/* Europe */}
      <path d="M 480 160 Q 520 150 570 170 Q 580 200 555 215 Q 510 220 485 200 Q 470 180 480 160 Z" />
      {/* Africa */}
      <path d="M 510 230 Q 560 230 590 270 Q 600 340 570 400 Q 530 410 505 360 Q 495 290 510 230 Z" />
      {/* Asia */}
      <path d="M 590 165 Q 700 155 820 180 Q 880 220 870 270 Q 800 290 720 270 Q 640 250 605 215 Q 580 190 590 165 Z" />
      {/* Australia */}
      <path d="M 850 360 Q 900 350 930 380 Q 920 410 880 410 Q 850 400 850 360 Z" />
    </g>
  )
}
