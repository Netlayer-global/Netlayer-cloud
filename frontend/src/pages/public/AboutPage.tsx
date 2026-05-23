import { Target, Heart, Zap, Users, Globe, Award } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { CTA } from '../../components/landing/CTA'
import { Footer } from '../../components/landing/Footer'

const VALUES = [
  { icon: Target,  title: 'Developer-first',     desc: 'We obsess over the API surface, the CLI ergonomics, and the deploy time. If a developer can\'t move fast, nothing else matters.' },
  { icon: Heart,   title: 'Honest pricing',      desc: 'No surprise egress charges, no hidden line items. The price you see is the price you pay.' },
  { icon: Zap,     title: 'Real performance',    desc: 'NVMe on every plan, 25 Gbps networking, AMD EPYC and Xeon hosts. Benchmarks beat the hyperscalers on price-per-performance.' },
  { icon: Globe,   title: 'Global by default',   desc: '15 regions across 5 continents at launch. Anycast routing and BGP peering keep latency under 10ms in most metros.' },
  { icon: Users,   title: 'Real humans on call', desc: 'Support is staffed 24/7 by engineers who can read your stack trace, not a script.' },
  { icon: Award,   title: 'Built to last',       desc: '99.99% uptime SLA backed by credits. We win when our customers stay.' },
]

const TIMELINE = [
  { year: '2024',  text: 'Founded with a focus on the underserved Indian and South-Asian developer market.' },
  { year: '2025',  text: 'Public beta opens. First 1,000 servers deployed in the first month.' },
  { year: '2026',  text: 'GA launch with 15 regions, GPU instances, and Kubernetes preview. Crossed 50,000+ developers using the platform.' },
  { year: 'Next',  text: 'Edge compute, managed K8s GA, multi-region VPC, dedicated bare-metal pools.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <span className="inline-block px-3 h-7 leading-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300">
          About NetLayer
        </span>
        <h1 className="mt-6 text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
          We're building the cloud
          <br />
          <span className="bg-gradient-to-r from-[#0070f3] via-[#00a0ff] to-[#00d4ff] bg-clip-text text-transparent">
            developers actually want.
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          NetLayer Cloud was born out of frustration with the hyperscaler experience: bloated consoles,
          mystery pricing, and support tickets that loop forever. We built the platform we wanted to use:
          fast, honest, and run by people who ship.
        </p>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <h2 className="text-[32px] font-semibold tracking-tight mb-12 text-center">What we believe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#0070f3]/10 border border-[#0070f3]/30 flex items-center justify-center mb-3">
                <v.icon size={16} className="text-[#0070f3]" />
              </div>
              <h3 className="text-base font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <h2 className="text-[32px] font-semibold tracking-tight mb-12 text-center">The story so far</h2>
        <div className="space-y-6">
          {TIMELINE.map((t, idx) => (
            <div key={t.year} className="flex gap-5">
              <div className="shrink-0 w-20 text-sm text-[#00d4ff] font-mono pt-1">{t.year}</div>
              <div className={`flex-1 ${idx < TIMELINE.length - 1 ? 'pb-6 border-l border-white/[0.06] pl-5 -ml-3' : 'pl-5 -ml-3'}`}>
                <p className="text-gray-300 leading-relaxed">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  )
}
