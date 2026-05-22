import {
  Zap, Shield, Globe, HardDrive, Activity, Lock, Cpu, Cloud, Network, Code2,
  CreditCard, Phone, Database, Layers, GitBranch, FileText, Server, Wrench, Check,
} from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { CTA } from '../../components/landing/CTA'
import { Footer } from '../../components/landing/Footer'

interface Feature {
  icon: any
  title: string
  desc: string
  color: string
  bg: string
}

const SECTIONS: Array<{ title: string; features: Feature[] }> = [
  {
    title: 'Compute',
    features: [
      { icon: Zap,    title: '60-second deploy',         desc: 'Provision a fresh VM in under a minute.',                   color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
      { icon: Cpu,    title: 'Bare metal & VMs',          desc: 'Pick virtualised or dedicated hardware per workload.',       color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { icon: HardDrive, title: 'NVMe SSD on every plan', desc: 'No spinning disks, ever. Even on entry tier.',              color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
      { icon: Server, title: 'Live migration',           desc: 'Zero-downtime moves between hosts during maintenance.',     color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ],
  },
  {
    title: 'Networking',
    features: [
      { icon: Shield, title: 'Free DDoS protection',     desc: '2 Tbps+ scrubbing capacity included on every server.',      color: 'text-green-400', bg: 'bg-green-500/10' },
      { icon: Globe,  title: 'IPv6 by default',          desc: 'Dual-stack from day one. No extra forms, no waiting.',       color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
      { icon: Network, title: 'Private VPC',             desc: 'Tenant-isolated overlay networks via VXLAN/EVPN.',           color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { icon: Layers, title: 'Anycast edge',             desc: 'Single-IP multi-region routing for global apps.',           color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ],
  },
  {
    title: 'Storage',
    features: [
      { icon: Database,  title: 'Block volumes',          desc: 'Persistent NVMe attached to any server, resize online.',  color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
      { icon: Cloud,     title: 'S3-compatible object',   desc: 'Drop-in replacement for AWS S3 in your code.',            color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { icon: GitBranch, title: 'Snapshots',              desc: 'Per-VM, per-volume, scheduled or on-demand.',             color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { icon: HardDrive, title: 'Cross-region backup',    desc: 'Replicate snapshots to a different region for DR.',       color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
    ],
  },
  {
    title: 'Security',
    features: [
      { icon: Lock,    title: 'Hardware-isolated tenants', desc: 'KVM + AppArmor + per-tenant uid mapping.',                color: 'text-green-400', bg: 'bg-green-500/10' },
      { icon: Shield,  title: 'Distributed firewall',     desc: 'nftables synced from your dashboard, applied per VM.',     color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
      { icon: Wrench,  title: '2FA + WebAuthn',           desc: 'Account, API key, and admin endpoints all 2FA-aware.',     color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { icon: FileText, title: 'Tamper-evident audit',    desc: 'Every privileged action append-only with hash chain.',     color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ],
  },
  {
    title: 'Developer experience',
    features: [
      { icon: Code2,    title: 'API + 4 SDKs',             desc: 'TypeScript, Python, Go, plus a Terraform provider.',       color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
      { icon: Activity, title: 'Prometheus metrics',       desc: 'Every VM exports node-exporter, ready to scrape.',         color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { icon: Server,   title: 'Webhooks',                 desc: 'Get notified of every server state change in your app.',   color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
      { icon: Cpu,      title: 'CLI with autocomplete',    desc: 'A single static binary that feels like git.',              color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ],
  },
  {
    title: 'Billing & support',
    features: [
      { icon: CreditCard, title: 'Hourly billing',         desc: 'Pay for the seconds you used. Cap at the monthly price.',  color: 'text-green-400', bg: 'bg-green-500/10' },
      { icon: FileText,   title: 'GST + VAT invoices',     desc: 'Compliant invoices for India, EU, UK, Singapore.',         color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
      { icon: Phone,      title: '24/7 support',           desc: 'Real engineers, real fast. P1 response under 5 minutes.',  color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { icon: Shield,     title: 'No contracts',           desc: 'Pay-as-you-go. Cancel anytime, no penalties.',             color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ],
  },
]

const COMPETITOR_CHECKLIST = [
  { feature: 'Hourly billing',                we: true, them: 'partial' },
  { feature: 'Free DDoS protection',          we: true, them: 'paid'    },
  { feature: 'Free IPv6',                     we: true, them: 'limited' },
  { feature: 'Free private networking',       we: true, them: 'paid'    },
  { feature: 'GST invoice (India)',           we: true, them: 'no'      },
  { feature: 'Razorpay support (INR)',        we: true, them: 'no'      },
  { feature: 'Bare metal in <5 min',          we: true, them: 'days'    },
  { feature: 'Per-VM live migration',         we: true, them: 'partial' },
  { feature: 'S3-compatible object storage',  we: true, them: true      },
  { feature: 'Managed Kubernetes',            we: true, them: true      },
  { feature: 'Webhooks for VM events',        we: true, them: 'partial' },
  { feature: 'Single-region edge LB',         we: true, them: true      },
] as const

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 mb-6">
              All plans · No upgrades · No add-ons
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              Everything included.
              <br />
              <span className="bg-gradient-to-r from-[#0070f3] via-[#00a0ff] to-[#00d4ff] bg-clip-text text-transparent">
                Nothing held back.
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-400">
              Every feature on this page is on every plan, including the entry tier.
            </p>
          </header>

          {SECTIONS.map((section) => (
            <section key={section.title} className="mb-16">
              <h2 className="text-xs uppercase tracking-widest text-[#0070f3] font-semibold mb-5">
                {section.title}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {section.features.map((f) => (
                  <div
                    key={f.title}
                    className="bg-[#111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.15] transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${f.bg} ${f.color} flex items-center justify-center mb-3`}>
                      <f.icon size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Quick comparison */}
          <section className="my-20">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-2">
              How NetLayer compares
            </h2>
            <p className="text-sm text-gray-400 text-center mb-8">
              Side-by-side with the cloud providers we hear about most.
            </p>
            <div className="rounded-xl border border-white/[0.06] bg-[#111] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Feature</th>
                    <th className="px-4 py-3 text-center text-[#0070f3]">NetLayer</th>
                    <th className="px-4 py-3 text-center text-gray-400">Other clouds</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITOR_CHECKLIST.map((row) => (
                    <tr key={row.feature} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-4 py-3 text-gray-300">{row.feature}</td>
                      <td className="px-4 py-3 text-center bg-[#0070f3]/[0.04]">
                        <Check size={16} className="text-[#00d4ff] mx-auto" />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {row.them === true ? <Check size={16} className="text-gray-500 mx-auto" /> : row.them}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <CTA />
      </main>
      <Footer />
    </div>
  )
}
