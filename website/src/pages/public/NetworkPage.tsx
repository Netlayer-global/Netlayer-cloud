import { useQuery } from '@tanstack/react-query'
import { Activity, Network, Shield, Wifi, Zap } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero, CtaBand } from '../../components/landing-v3'
import { catalogAPI } from '../../api/endpoints'
import type { Region } from '../../types'
import { useSeo } from '../../hooks/useSeo'

const SPECS = [
  { Icon: Wifi,     label: '25 Gbps',     desc: 'Per-host uplinks',      accent: 'var(--a-lime)' },
  { Icon: Activity, label: '< 1 ms',      desc: 'Intra-region latency',  accent: 'var(--a-cyan)' },
  { Icon: Network,  label: 'BGP Anycast', desc: '15 PoPs, IPv4 + IPv6',  accent: 'var(--a-violet)' },
  { Icon: Shield,   label: 'L3/4/7',      desc: 'Hardware DDoS protection', accent: 'var(--a-blue)' },
]

const FEATURES = [
  '25 Gbps redundant uplinks at every PoP',
  'Tier-1 IP transit (Cogent, Telia, Lumen, Tata)',
  'Hardware DDoS scrubbing in-line on every flow',
  'IPv4 + IPv6 dual-stack on every server',
  'Anycast DNS resolved at the closest PoP',
  'Zero egress fees between regions in the same continent',
  'Free private networks (VPCs) within a region',
  'BGP communities exposed to bring-your-own-IP customers',
]

const CONTINENT_GROUPS: Record<string, string[]> = {
  Asia: ['mumbai', 'delhi', 'singapore', 'tokyo', 'seoul'],
  Oceania: ['sydney'],
  Europe: ['frankfurt', 'london', 'paris', 'amsterdam'],
  'North America': ['new-york', 'chicago', 'los-angeles'],
  'South America': ['sao-paulo'],
  'Middle East': ['dubai'],
}

export default function NetworkPage() {
  useSeo({
    title: 'Global Network',
    description: '15 regions across 5 continents. Hardware-protected, anycast-routed, and built on a tier-1 backbone — so every workload is close to its users.',
    path: '/network',
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data as Region[]),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Global network"
        title="Global network."
        accent="Local performance."
        subtitle="15 regions across 5 continents. Hardware-protected, anycast-routed, and built on a tier-1 backbone — so every workload is close to its users."
      />

      {/* Specs row */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(40px,6vw,64px) clamp(20px,4vw,72px)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPECS.map((s) => (
              <div key={s.label} className="text-center" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(22px,2.6vw,28px)' }}>
                <s.Icon size={22} style={{ color: s.accent }} className="mx-auto mb-3" />
                <div className="nl-display" style={{ fontSize: 24, color: 'var(--t-hi)' }}>{s.label}</div>
                <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--t-low)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Region cards */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Regions</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>
              {regions.length || '15'} datacenters worldwide
            </h2>
          </div>

          {Object.entries(CONTINENT_GROUPS).map(([continent, slugs]) => {
            const group = slugs
              .map((slug) => regions.find((r) => r.slug === slug))
              .filter((r): r is Region => !!r)
            if (group.length === 0) return null
            return (
              <div key={continent} style={{ marginBottom: 32 }}>
                <div className="nl-mono" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14, color: 'var(--t-low)' }}>
                  {continent}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.map((r) => <RegionCard key={r.id} region={r} />)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Backbone features + diagram */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Backbone</div>
              <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,44px)', color: 'var(--t-hi)', marginBottom: 16 }}>
                Built on tier-1 transit
              </h2>
              <p style={{ fontSize: 15, color: 'var(--t-med)', lineHeight: 1.7, marginBottom: 24 }}>
                Our backbone is composed of redundant 100 GbE waves into multiple tier-1 carriers
                at every PoP. Routes update via BGP within seconds when paths degrade.
              </p>
              <ul className="flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3" style={{ fontSize: 14, color: 'var(--t-med)' }}>
                    <Zap size={15} style={{ color: 'var(--brand)' }} className="shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ArchitectureDiagram />
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Deploy in any region in 30 seconds" subtitle="Pick a region close to your users — pay only for what you use." primaryLabel="Start free" />
      <LandingFooter />
    </div>
  )
}

function RegionCard({ region }: { region: Region }) {
  const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string
  return (
    <a
      href={`${DASHBOARD_URL}/register?region=${region.slug}`}
      className="block cursor-pointer transition-all"
      style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 16 }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-b)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b-default)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 24 }}>{region.flag}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-hi)' }}>{region.city}</div>
          <div style={{ fontSize: 11, color: 'var(--t-low)' }}>{region.country}</div>
        </div>
      </div>
      <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
        <span
          className="inline-flex items-center gap-1 px-2 h-5 rounded"
          style={{ background: 'var(--c-green-d)', color: 'var(--c-green)' }}
        >
          <span className="rounded-full" style={{ width: 4, height: 4, background: 'var(--c-green)' }} />
          {region.latencyMs ?? 20} ms
        </span>
        <span style={{ color: 'var(--brand)' }}>Deploy →</span>
      </div>
    </a>
  )
}

/**
 * Pure-CSS architecture diagram. Three layers (Edge → Spine → Hosts) connected
 * by simple lines. Avoids needing an SVG asset and stays themable.
 */
function ArchitectureDiagram() {
  const layer = (label: string, items: string[]) => (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--t-low)' }}>{label}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((it) => (
          <div
            key={it}
            className="text-xs px-3 h-8 inline-flex items-center rounded-md"
            style={{
              background: 'var(--nl-2)',
              border: '1px solid var(--b-default)',
              color: 'var(--t-hi)',
            }}
          >
            {it}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 24 }}>
      {layer('Edge / Anycast', ['BGP', 'IPv6', 'DDoS'])}
      <Connector />
      {layer('Spine (100 GbE)', ['Cogent', 'Telia', 'Lumen', 'Tata'])}
      <Connector />
      {layer('Hosts (25 Gbps)', ['EPYC nodes', 'Ceph storage'])}
    </div>
  )
}

function Connector() {
  return (
    <div className="my-3 flex justify-center">
      <div
        style={{
          width: '60%',
          height: '24px',
          background:
            'linear-gradient(to bottom, var(--brand) 0%, var(--brand) 50%, transparent 50%, transparent 100%)',
          backgroundSize: '2px 4px',
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, var(--brand) 0%, var(--brand) 50%, transparent 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
