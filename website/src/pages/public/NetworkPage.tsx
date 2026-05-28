import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, Globe, Network, Shield, Wifi, Zap } from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'
import { catalogAPI } from '../../api/endpoints'
import type { Region } from '../../types'

const SPECS = [
  { Icon: Wifi,     label: '25 Gbps',     desc: 'Per-host uplinks' },
  { Icon: Activity, label: '< 1 ms',      desc: 'Intra-region latency' },
  { Icon: Network,  label: 'BGP Anycast', desc: '15 PoPs, IPv4 + IPv6' },
  { Icon: Shield,   label: 'L3/4/7',      desc: 'Hardware DDoS protection' },
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
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data as Region[]),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{ border: '1px solid var(--brand-b)', background: 'var(--brand-d)', color: 'var(--brand)' }}
          >
            Global network
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            Global network. Local performance.
          </h1>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            15 regions across 5 continents. Hardware-protected, anycast-routed, and built on a
            tier-1 backbone — so every workload is close to its users.
          </p>
        </motion.div>
      </section>

      {/* Specs row */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {SPECS.map((s) => (
            <div key={s.label} className="nl-card p-5 text-center">
              <s.Icon size={20} style={{ color: 'var(--brand)' }} className="mx-auto mb-2" />
              <div className="text-xl font-semibold tracking-tight">{s.label}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--t-low)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Region cards */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
            Regions
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {regions.length || '15'} datacenters worldwide
          </h2>
        </div>

        {Object.entries(CONTINENT_GROUPS).map(([continent, slugs]) => {
          const group = slugs
            .map((slug) => regions.find((r) => r.slug === slug))
            .filter((r): r is Region => !!r)
          if (group.length === 0) return null
          return (
            <div key={continent} className="mb-8">
              <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'var(--t-low)' }}>
                {continent}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.map((r) => <RegionCard key={r.id} region={r} />)}
              </div>
            </div>
          )
        })}
      </section>

      {/* Backbone features + diagram */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: '1px solid var(--b-subtle)' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
              Backbone
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built on tier-1 transit
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>
              Our backbone is composed of redundant 100 GbE waves into multiple tier-1 carriers
              at every PoP. Routes update via BGP within seconds when paths degrade.
            </p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--t-med)' }}>
                  <Zap size={14} style={{ color: 'var(--brand)' }} className="shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Deploy in any region in 30 seconds</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-med)' }}>
          Pick a region close to your users — pay only for what you use.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register" className="nl-btn-primary">Start free</Link>
          <Link to="/pricing" className="nl-btn-ghost">View pricing →</Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function RegionCard({ region }: { region: Region }) {
  return (
    <Link
      to={`/register?region=${region.slug}`}
      className="block nl-card nl-card-hover p-4 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{region.flag}</span>
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{region.city}</div>
          <div className="text-[11px]" style={{ color: 'var(--t-low)' }}>{region.country}</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span
          className="inline-flex items-center gap-1 px-1.5 h-5 rounded"
          style={{ background: 'var(--c-green-d)', color: 'var(--c-green)' }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--c-green)' }} />
          {region.latencyMs ?? 20} ms
        </span>
        <span style={{ color: 'var(--brand)' }}>Deploy →</span>
      </div>
    </Link>
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
    <div className="nl-card p-6" style={{ background: 'var(--nl-1)' }}>
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
