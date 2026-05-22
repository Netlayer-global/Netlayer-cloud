import { TopNav } from '../../components/landing/TopNav'
import { Pricing } from '../../components/landing/Pricing'
import { CTA } from '../../components/landing/CTA'
import { Footer } from '../../components/landing/Footer'
import { Check, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'

const COMPARE_ROWS = [
  { feature: 'Hourly billing',          netlayer: true,  aws: false, do: true,  vultr: true  },
  { feature: 'Free DDoS protection',    netlayer: true,  aws: false, do: false, vultr: true  },
  { feature: 'Free IPv6',               netlayer: true,  aws: false, do: true,  vultr: true  },
  { feature: 'Free private networking', netlayer: true,  aws: false, do: true,  vultr: false },
  { feature: 'No bandwidth overage',    netlayer: '10 TB', aws: 'paid', do: '5 TB', vultr: '4 TB' },
  { feature: 'Mumbai region',           netlayer: true,  aws: true,  do: true,  vultr: true  },
  { feature: 'Razorpay (INR billing)',  netlayer: true,  aws: false, do: false, vultr: false },
  { feature: 'GST invoice',             netlayer: true,  aws: false, do: false, vultr: false },
  { feature: 'Object storage',          netlayer: '₹5/GB', aws: '$0.023/GB', do: '$5/250GB', vultr: '$5/250GB' },
  { feature: 'Per-minute support response (P1)', netlayer: '< 5 min', aws: 'paid plan', do: '< 1 hr', vultr: '< 30 min' },
]

const FAQS = [
  {
    q: 'How does hourly billing work?',
    a: 'Every server is billed by the second, capped at the monthly price. Spin up a c3.large for 90 minutes and you pay roughly ₹1.23. The dashboard shows real-time accumulated cost.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. CPU/RAM resizing happens with a brief reboot. Disk shrinks are not supported (data integrity); disk growth is online and instant on NVMe.',
  },
  {
    q: 'Do you charge for outbound bandwidth?',
    a: 'Each plan includes a generous transfer pool. Overage is billed at ₹2/GB if you exceed it. We never throttle — only meter.',
  },
  {
    q: 'Is there a free tier?',
    a: 'New accounts get $100 (~₹8,300) credit, valid for 60 days. Enough to keep two c3.large servers running for over 4 months at typical usage.',
  },
  {
    q: 'How do you handle GST and tax invoices?',
    a: 'Add your GSTIN under Settings → Billing. We generate proper IN GST invoices (CGST/SGST/IGST split based on your state) downloadable as PDF.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-20">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
            Pricing without surprises
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
            Hourly billing, monthly caps, transparent overage. No 1-year commitments.
          </p>
        </header>

        <Pricing />

        {/* Comparison table */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                NetLayer vs the alternatives
              </h2>
              <p className="mt-3 text-gray-400">
                What you actually get on a c3.large equivalent. Prices in $/month, normalised.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-gray-500">Feature</th>
                    <th className="px-4 py-4">
                      <div className="text-[#0070f3] font-semibold">NetLayer</div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">₹599 / $7.20</div>
                    </th>
                    <th className="px-4 py-4">
                      <div className="text-gray-300 font-semibold">AWS</div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">~$30 (m5.large)</div>
                    </th>
                    <th className="px-4 py-4">
                      <div className="text-gray-300 font-semibold">DigitalOcean</div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">$48 (8GB)</div>
                    </th>
                    <th className="px-4 py-4">
                      <div className="text-gray-300 font-semibold">Vultr</div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">$48 (HF 8GB)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.feature} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-4 py-3 text-gray-300">{row.feature}</td>
                      <Cell value={row.netlayer} highlight />
                      <Cell value={row.aws} />
                      <Cell value={row.do} />
                      <Cell value={row.vultr} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500 text-center">
              Pricing data approximate, valid as of 2024. Conversions at ₹83/$ for illustration.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </div>
  )
}

function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return (
      <td className={cn('px-4 py-3', highlight && 'bg-[#0070f3]/[0.04]')}>
        {value ? <Check size={16} className="text-[#00d4ff]" /> : <X size={16} className="text-gray-600" />}
      </td>
    )
  }
  return (
    <td className={cn('px-4 py-3 text-sm', highlight ? 'text-white font-medium bg-[#0070f3]/[0.04]' : 'text-gray-400')}>
      {value}
    </td>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.06] rounded-lg bg-[#111]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left px-5 py-4 cursor-pointer"
      >
        <span className="text-[15px] font-medium text-white">{q}</span>
        <ChevronDown
          size={16}
          className={cn('text-gray-500 transition-transform shrink-0 ml-3', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{a}</div>
      )}
    </div>
  )
}
