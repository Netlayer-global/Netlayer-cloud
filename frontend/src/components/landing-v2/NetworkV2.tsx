import { motion } from 'framer-motion'

interface Region {
  city: string
  country: string
  flag: string
  latency: number
  // Approx % position over a 2:1 world-map SVG
  x: number
  y: number
}

const REGIONS: Region[] = [
  { city: 'Mumbai',      country: 'IN', flag: '🇮🇳', latency: 12, x: 68.5, y: 50 },
  { city: 'Delhi',       country: 'IN', flag: '🇮🇳', latency: 14, x: 70,   y: 44 },
  { city: 'Singapore',   country: 'SG', flag: '🇸🇬', latency: 22, x: 76,   y: 56 },
  { city: 'Tokyo',       country: 'JP', flag: '🇯🇵', latency: 38, x: 87.5, y: 42 },
  { city: 'Seoul',       country: 'KR', flag: '🇰🇷', latency: 36, x: 85.5, y: 41 },
  { city: 'Sydney',      country: 'AU', flag: '🇦🇺', latency: 64, x: 89,   y: 76 },
  { city: 'Frankfurt',   country: 'DE', flag: '🇩🇪', latency: 88, x: 51,   y: 36 },
  { city: 'London',      country: 'GB', flag: '🇬🇧', latency: 92, x: 47,   y: 33 },
  { city: 'Paris',       country: 'FR', flag: '🇫🇷', latency: 90, x: 49,   y: 36 },
  { city: 'Amsterdam',   country: 'NL', flag: '🇳🇱', latency: 90, x: 50,   y: 33 },
  { city: 'New York',    country: 'US', flag: '🇺🇸', latency: 110, x: 26,  y: 38 },
  { city: 'Chicago',     country: 'US', flag: '🇺🇸', latency: 112, x: 23,  y: 39 },
  { city: 'Los Angeles', country: 'US', flag: '🇺🇸', latency: 130, x: 15,  y: 41 },
  { city: 'São Paulo',   country: 'BR', flag: '🇧🇷', latency: 162, x: 33,  y: 71 },
  { city: 'Dubai',       country: 'AE', flag: '🇦🇪', latency: 30, x: 60.5, y: 47 },
]

export function NetworkV2() {
  return (
    <section className="relative py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--nl-brand-2)] mb-4">
            Global network
          </p>
          <h2 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] nl-gradient-text">
            15 regions.
            <br />
            5 continents. Sub-10ms in-region.
          </h2>
          <p className="mt-6 text-[17px] text-[var(--nl-text-soft)] leading-[1.55]">
            Anycast routing keeps your traffic on the shortest path. 25 Gbps uplinks at every PoP.
          </p>
        </motion.div>

        {/* World map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 aspect-[2/1] w-full max-w-5xl mx-auto"
        >
          {/* SVG world outline (dotted continents) */}
          <svg
            viewBox="0 0 1000 500"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern id="dotPattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.8" fill="rgba(255,255,255,0.18)" />
              </pattern>
            </defs>
            {/* Simplified continent silhouettes (own design — abstract blobs, not copied from any source) */}
            <g fill="url(#dotPattern)">
              {/* North America */}
              <path d="M 80,160 C 110,100 200,90 260,130 C 290,160 295,210 270,240 L 230,260 L 180,260 L 130,230 L 100,200 Z" />
              {/* South America */}
              <path d="M 280,300 C 310,290 350,310 360,360 L 350,420 L 310,440 L 290,400 L 285,350 Z" />
              {/* Europe */}
              <path d="M 470,140 C 490,120 540,125 555,150 L 545,185 L 510,195 L 480,180 Z" />
              {/* Africa */}
              <path d="M 490,210 C 530,200 570,220 580,260 L 575,330 L 545,360 L 510,340 L 495,290 Z" />
              {/* Middle East / India */}
              <path d="M 600,200 C 630,195 670,210 685,240 L 690,275 L 660,290 L 625,275 L 605,240 Z" />
              {/* Asia */}
              <path d="M 690,140 C 740,115 830,120 870,160 C 890,200 880,250 850,260 L 800,255 L 750,235 L 710,200 Z" />
              {/* Australia */}
              <path d="M 830,360 C 860,350 905,365 915,390 L 905,415 L 870,420 L 840,400 Z" />
            </g>
          </svg>

          {/* Region pins */}
          {REGIONS.map((r, i) => (
            <RegionPin key={r.city} region={r} delay={i * 0.06} />
          ))}

          {/* Connection arcs */}
          <svg
            viewBox="0 0 1000 500"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f8bff" stopOpacity="0" />
                <stop offset="50%" stopColor="#4ad7ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#4f8bff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* A few real-feeling routes between major regions */}
            {[
              [REGIONS[0], REGIONS[2]],   // Mumbai → Singapore
              [REGIONS[2], REGIONS[3]],   // Singapore → Tokyo
              [REGIONS[6], REGIONS[10]],  // Frankfurt → New York
              [REGIONS[7], REGIONS[10]],  // London → New York
              [REGIONS[10], REGIONS[12]], // NY → LA
              [REGIONS[14], REGIONS[0]],  // Dubai → Mumbai
            ].map(([a, b], i) => (
              <ConnectionArc key={i} a={a} b={b} delay={i * 0.4} />
            ))}
          </svg>
        </motion.div>

        {/* Region pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {REGIONS.map((r, i) => (
            <motion.span
              key={r.city}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full nl-glass text-[12px] hover:border-[var(--nl-border-strong)] hover:text-white transition-all cursor-default"
            >
              <span className="text-[14px]">{r.flag}</span>
              <span className="text-[var(--nl-text-soft)]">{r.city}</span>
              <span className="text-[var(--nl-text-muted)] nl-mono text-[10.5px]">{r.latency}ms</span>
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}

function RegionPin({ region, delay }: { region: Region; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="absolute group cursor-default"
      style={{ left: `${region.x}%`, top: `${region.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {/* Pulse rings */}
      <span className="absolute -inset-2 rounded-full bg-[var(--nl-brand)] opacity-30 nl-pulse" style={{ animationDelay: `${delay * 0.5}s` }} />
      {/* Core dot */}
      <span className="relative block w-2 h-2 rounded-full bg-[var(--nl-brand-2)] shadow-[0_0_12px_rgba(74,215,255,0.8)]" />

      {/* Tooltip */}
      <div className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="nl-glass-strong rounded-lg px-3 py-2 whitespace-nowrap text-[11px] shadow-2xl">
          <div className="text-white font-medium flex items-center gap-1">
            <span>{region.flag}</span> {region.city}
          </div>
          <div className="text-[var(--nl-text-muted)] mt-0.5">{region.latency}ms p50 latency</div>
        </div>
      </div>
    </motion.div>
  )
}

function ConnectionArc({ a, b, delay }: { a: Region; b: Region; delay: number }) {
  const x1 = (a.x / 100) * 1000
  const y1 = (a.y / 100) * 500
  const x2 = (b.x / 100) * 1000
  const y2 = (b.y / 100) * 500
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15
  const path = `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`
  return (
    <motion.path
      d={path}
      stroke="url(#arcGrad)"
      strokeWidth="1.2"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.6, delay, ease: 'easeInOut' }}
    />
  )
}
