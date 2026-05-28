import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
import { LandingNav, LandingFooter, PricingSection } from '../../components/landing-v3'
import { cn } from '../../lib/utils'

/**
 * Public pricing page. Reuses the same `<PricingSection />` rendered on the
 * landing page so the live API plan list and styling stay in sync. Adds:
 *   - hero
 *   - 4-column comparison vs DigitalOcean / Vultr / Hetzner
 *   - FAQ accordion (5 questions)
 *   - enterprise CTA banner
 *
 * All colours come from `tokens.css` (no hex codes). Page is scoped under
 * `.nl-v3` so the dashboard's resets never leak into the public site.
 */

const COMPARISON_ROWS = [
  { feature: 'Per-second billing',     us: true,    others: { do: false, vultr: false, hetzner: false } },
  { feature: 'Free IPv6',              us: true,    others: { do: true,  vultr: true,  hetzner: false } },
  { feature: 'Hardware DDoS protection', us: true,  others: { do: false, vultr: true,  hetzner: false } },
  { feature: 'NVMe SSD on every plan', us: true,    others: { do: true,  vultr: true,  hetzner: true  } },
  { feature: '15 global regions',      us: true,    others: { do: false, vultr: true,  hetzner: false } },
  { feature: '30-second deploys',      us: true,    others: { do: false, vultr: false, hetzner: false } },
  { feature: 'Live VM resize',         us: true,    others: { do: false, vultr: true,  hetzner: false } },
  { feature: 'Free private network',   us: true,    others: { do: true,  vultr: true,  hetzner: true  } },
]

const FAQ = [
  {
    q: 'Is there a free trial?',
    a: 'Every new account gets ₹3,500 in free credits — that covers a small VPS for over a month. No credit card required to sign up.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'India: UPI, net banking, debit/credit cards, wallets via Razorpay. International: cards via Stripe (USD, EUR, GBP). All payments are prepaid into your wallet.',
  },
  {
    q: 'Can I change plans after deploying?',
    a: 'Yes. Live resize works without downtime when you scale up. Scaling down requires a brief stop. We charge a prorated difference for the rest of the month.',
  },
  {
    q: 'What is your refund policy?',
    a: 'Prorated refund within the first 7 days, no questions asked. After that, unused wallet credit is refundable at any time.',
  },
  {
    q: 'Are there volume discounts?',
    a: 'Yes — running 10+ servers? Talk to sales for committed-use discounts up to 30% off list price.',
  },
]

export default function PricingPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{
              border: '1px solid var(--brand-b)',
              background: 'var(--brand-d)',
              color: 'var(--brand)',
            }}
          >
            Pricing
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            Simple, transparent pricing
          </h1>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            All plans include NVMe SSD, IPv6, DDoS protection, and 24/7 support.
            Start free with ₹3,500 in credits.
          </p>
        </motion.div>
      </section>

      <PricingSection standalone />

      {/* Comparison table */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--brand)' }}
          >
            How we compare
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            NetLayer vs. the rest
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--t-med)' }}>
            Where it matters: speed, transparency, and global reach.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden nl-card">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--nl-2)' }}>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
                  Feature
                </th>
                <th className="px-4 py-3 text-xs font-semibold" style={{ background: 'var(--brand-d)', color: 'var(--brand)' }}>
                  NetLayer
                </th>
                <th className="px-4 py-3 text-xs" style={{ color: 'var(--t-med)' }}>DigitalOcean</th>
                <th className="px-4 py-3 text-xs" style={{ color: 'var(--t-med)' }}>Vultr</th>
                <th className="px-4 py-3 text-xs" style={{ color: 'var(--t-med)' }}>Hetzner</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--b-subtle)' }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--t-hi)' }}>{row.feature}</td>
                  <td className="px-4 py-3 text-center" style={{ background: 'var(--brand-d)' }}>
                    {row.us ? <Check size={14} style={{ color: 'var(--brand)' }} className="inline" /> : <X size={14} style={{ color: 'var(--c-red)' }} className="inline" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.others.do ? <Check size={14} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={14} style={{ color: 'var(--t-low)' }} className="inline" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.others.vultr ? <Check size={14} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={14} style={{ color: 'var(--t-low)' }} className="inline" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.others.hetzner ? <Check size={14} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={14} style={{ color: 'var(--t-low)' }} className="inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-center" style={{ color: 'var(--t-low)' }}>
          Comparison based on publicly listed features as of 2026. Provider features change frequently — always verify with their docs.
        </p>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>FAQ</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Frequently asked</h2>
        </div>
        <div className="space-y-2">
          {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div
          className="max-w-4xl mx-auto rounded-2xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--nl-2), var(--nl-1))',
            border: '1px solid var(--brand-b)',
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Running 100+ servers?
          </h2>
          <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: 'var(--t-med)' }}>
            Get committed-use discounts up to 30%, dedicated capacity, and a named account engineer.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:sales@netlayer.com"
              className="nl-btn-primary"
            >
              Talk to sales
            </a>
            <Link to="/register" className="nl-btn-ghost">
              Or start free →
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="nl-card rounded-lg overflow-hidden"
      style={{ borderColor: open ? 'var(--brand-b)' : 'var(--b-default)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-[var(--nl-3)] transition-colors"
      >
        <span className="text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{q}</span>
        <ChevronDown
          size={16}
          style={{ color: 'var(--t-med)', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        className={cn('overflow-hidden transition-[max-height] duration-300 ease-out')}
        style={{ maxHeight: open ? '600px' : '0px' }}
      >
        <div className="px-5 pb-4 pt-1 text-sm leading-relaxed" style={{ color: 'var(--t-med)' }}>
          {a}
        </div>
      </div>
    </div>
  )
}
