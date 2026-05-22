import { TopNav } from '../../components/landing/TopNav'
import { GlobalNetwork } from '../../components/landing/GlobalNetwork'
import { CTA } from '../../components/landing/CTA'
import { Footer } from '../../components/landing/Footer'
import { Globe, Shield, Zap, Network as NetworkIcon, ArrowDownToLine } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { catalogAPI } from '../../api/endpoints'

const NETWORK_FACTS = [
  { icon: Zap,          title: '< 5ms',    sub: 'Average latency within region',         color: 'text-[#0070f3]' },
  { icon: Shield,       title: '2 Tbps+',  sub: 'DDoS scrubbing capacity',               color: 'text-[#00d4ff]' },
  { icon: Globe,        title: 'IPv4 + IPv6', sub: 'Dual-stack on every server',         color: 'text-purple-400' },
  { icon: NetworkIcon,  title: 'BGP-EVPN', sub: 'VXLAN overlay for tenant isolation',   color: 'text-amber-400' },
]

const PEERING = [
  { ix: 'NIXI Mumbai',     city: 'Mumbai',     v4: 'AS400000', capacity: '100G' },
  { ix: 'DE-CIX Mumbai',   city: 'Mumbai',     v4: 'AS400000', capacity: '100G' },
  { ix: 'AMS-IX Amsterdam', city: 'Amsterdam', v4: 'AS400000', capacity: '200G' },
  { ix: 'DE-CIX Frankfurt', city: 'Frankfurt', v4: 'AS400000', capacity: '400G' },
  { ix: 'LINX London',     city: 'London',     v4: 'AS400000', capacity: '200G' },
  { ix: 'Equinix Ashburn', city: 'New York',   v4: 'AS400000', capacity: '200G' },
  { ix: 'JPNAP Tokyo',     city: 'Tokyo',      v4: 'AS400000', capacity: '100G' },
  { ix: 'Equinix Singapore', city: 'Singapore', v4: 'AS400000', capacity: '100G' },
]

export default function NetworkPage() {
  const { data: regions = [] } = useQuery({
    queryKey: ['public-regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-20">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 mb-6">
            <Globe size={12} className="text-[#00d4ff]" /> 15 regions · 4 continents
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
            Global infrastructure,
            <br />
            <span className="bg-gradient-to-r from-[#0070f3] via-[#00a0ff] to-[#00d4ff] bg-clip-text text-transparent">
              local performance
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
            Multi-100G uplinks per PoP. Dual transit at every site. Anycast for the edge, dedicated routes for compute.
          </p>
        </header>

        <GlobalNetwork />

        {/* Network facts */}
        <section className="py-16 border-y border-white/[0.06] bg-white/[0.015]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {NETWORK_FACTS.map((f) => (
              <div key={f.title} className="flex flex-col">
                <f.icon className={`${f.color} mb-3`} size={24} />
                <div className="text-2xl font-semibold text-white">{f.title}</div>
                <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{f.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* All regions table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">All 15 regions</h2>
              <p className="mt-3 text-gray-400">
                Every region offers identical compute, storage, and managed-DB plans.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3 text-right">Avg latency</th>
                    <th className="px-4 py-3">Plans</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r: any) => (
                    <tr key={r.id} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-4 py-3">
                        <span className="text-xl mr-2">{r.flag}</span>
                        <span className="text-white">{r.city}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{r.country}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">
                        {r.latencyMs}ms
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">All plans</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#00d4ff]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                          Operational
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BGP / Peering */}
        <section className="py-20 bg-white/[0.015] border-y border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#0070f3] font-semibold mb-3">Peering</div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  We peer with everyone that matters
                </h2>
                <p className="mt-4 text-gray-400 leading-relaxed">
                  NetLayer operates ASN <span className="font-mono text-white">AS400000</span>, peering at major
                  internet exchanges and with all Tier-1 carriers. Your traffic stays on direct paths instead
                  of bouncing through the public internet.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><ArrowDownToLine size={14} className="text-[#0070f3]" /> Two upstream transits per region</li>
                  <li className="flex items-center gap-2"><ArrowDownToLine size={14} className="text-[#0070f3]" /> Public peering at every IX listed</li>
                  <li className="flex items-center gap-2"><ArrowDownToLine size={14} className="text-[#0070f3]" /> Private interconnects on request</li>
                  <li className="flex items-center gap-2"><ArrowDownToLine size={14} className="text-[#0070f3]" /> Looking glass at lg.netlayer.com</li>
                </ul>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">IX</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3 text-right">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PEERING.map((p) => (
                      <tr key={p.ix} className="border-b border-white/[0.04] last:border-b-0">
                        <td className="px-4 py-3 text-white">{p.ix}</td>
                        <td className="px-4 py-3 text-gray-400">{p.city}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-[#00d4ff]">{p.capacity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </div>
  )
}
