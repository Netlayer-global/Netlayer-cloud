import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ChevronDown } from 'lucide-react'
import { LandingNav, LandingFooter, PricingSection, PageHero } from '../../components/landing-v3'
import { cn } from '../../lib/utils'
import { useSeo } from '../../hooks/useSeo'

const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string

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
  useSeo({
    title: 'Pricing',
    description: 'Simple, transparent VPS pricing. All plans include NVMe SSD, IPv6, DDoS protection, and 24/7 support. Start free with ₹3,500 in credits.',
    path: '/pricing',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Pricing"
        title="Simple, transparent"
        accent="pricing."
        subtitle="All plans include NVMe SSD, IPv6, DDoS protection, and 24/7 support. Start free with ₹3,500 in credits."
      />

      <PricingSection standalone />

      {/* Comparison table */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>How we compare</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)', marginBottom: 14 }}>
              NetLayer vs. the rest
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t-med)' }}>
              Where it matters: speed, transparency, and global reach.
            </p>
          </div>

          <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--b-default)', background: 'var(--nl-2)' }}>
            <table className="w-full" style={{ fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--nl-3)' }}>
                  <th className="text-left px-4 py-3 nl-mono" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
                    Feature
                  </th>
                  <th className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, background: 'var(--brand-d)', color: 'var(--brand)' }}>
                    NetLayer
                  </th>
                  <th className="px-4 py-3" style={{ fontSize: 13, color: 'var(--t-med)' }}>DigitalOcean</th>
                  <th className="px-4 py-3" style={{ fontSize: 13, color: 'var(--t-med)' }}>Vultr</th>
                  <th className="px-4 py-3" style={{ fontSize: 13, color: 'var(--t-med)' }}>Hetzner</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.feature} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--b-subtle)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--t-hi)' }}>{row.feature}</td>
                    <td className="px-4 py-3 text-center" style={{ background: 'var(--brand-d)' }}>
                      {row.us ? <Check size={15} style={{ color: 'var(--brand)' }} className="inline" /> : <X size={15} style={{ color: 'var(--c-red)' }} className="inline" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.others.do ? <Check size={15} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={15} style={{ color: 'var(--t-low)' }} className="inline" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.others.vultr ? <Check size={15} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={15} style={{ color: 'var(--t-low)' }} className="inline" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.others.hetzner ? <Check size={15} style={{ color: 'var(--c-green)' }} className="inline" /> : <X size={15} style={{ color: 'var(--t-low)' }} className="inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center" style={{ marginTop: 14, fontSize: 11.5, color: 'var(--t-low)' }}>
            Comparison based on publicly listed features as of 2026. Provider features change frequently — always verify with their docs.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>FAQ</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>Frequently asked</h2>
          </div>
          <div className="flex flex-col gap-2.5" style={{ maxWidth: 760, margin: '0 auto' }}>
            {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
          <div
            className="relative overflow-hidden text-center"
            style={{ maxWidth: 760, margin: '0 auto', borderRadius: 'var(--r-2xl)', padding: 'clamp(40px,5vw,60px)', background: 'var(--nl-2)', border: '1px solid var(--brand-b)' }}
          >
            <h2 className="nl-display" style={{ fontSize: 'clamp(26px,3.4vw,40px)', color: 'var(--t-hi)', marginBottom: 14 }}>
              Running 100+ servers?
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t-med)', maxWidth: 460, margin: '0 auto 26px' }}>
              Get committed-use discounts up to 30%, dedicated capacity, and a named account engineer.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="nl-btn-primary">Talk to sales</Link>
              <a href={`${DASHBOARD_URL}/register`} className="nl-btn-ghost">Or start free →</a>
            </div>
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
