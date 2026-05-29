import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Github, Linkedin, MessageCircle, Twitter, ArrowRight, Check } from 'lucide-react'
import { waitlistAPI } from '../../api/endpoints'

/**
 * LandingFooter — public site footer.
 *
 * Top band: brand blurb + a best-effort newsletter capture (posts to the
 * waitlist endpoint with product='newsletter'; failures are swallowed so the
 * UI always confirms). Below: a four-column sitemap with lime hover states
 * and a bottom legal bar.
 *
 * Rendered on every public page. Re-exported from `pages/Landing.tsx` for
 * backwards compatibility.
 */

const BRAND = '#c8f135'

export function LandingFooter() {
  return (
    <footer
      className="px-4 sm:px-6"
      style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}
    >
      <div className="mx-auto max-w-7xl pb-10 pt-16">
        {/* top band */}
        <div className="flex flex-col gap-10 border-b pb-12 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: 'var(--b-subtle)' }}>
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden>
                <polygon points="16,3 27,9 27,22 16,28 5,22 5,9" stroke={BRAND} strokeWidth="1.5" fill="none" />
                <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="var(--brand-d)" stroke={BRAND} strokeWidth="1" />
                <circle cx="16" cy="16" r="2.5" fill={BRAND} />
              </svg>
              <span className="text-[15px] font-semibold text-white">NetLayer Cloud</span>
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--t-low)' }}>
              High-performance cloud infrastructure for developers and teams.
              Deploy across 15 global regions in seconds.
            </p>
          </div>

          <Newsletter />
        </div>

        {/* sitemap */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <FooterCol title="Products" links={[
            ['Cloud VPS', '/pricing#compute'], ['Bare Metal', '/pricing#bare'], ['GPU Cloud', '/pricing#gpu'],
            ['Kubernetes', '/kubernetes'], ['Block Storage', '/pricing#block'], ['Object Storage', '/pricing#object'],
            ['Managed Databases', '/pricing#db'], ['Load Balancers', '/pricing#lb'],
          ]} />
          <FooterCol title="Company" links={[
            ['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'],
            ['Network', '/network'], ['Privacy', '/legal/privacy'], ['Terms', '/legal/terms'],
          ]} />
          <FooterCol title="Resources" links={[
            ['Documentation', '/docs'], ['API Reference', '/docs#api'], ['Features', '/features'],
            ['Status', '/status'], ['Marketplace', '/marketplace'], ['Abuse Report', '/abuse-report'],
          ]} />
          <FooterCol title="Connect" links={[
            ['Support', 'mailto:support@netlayer.com'], ['Sales', 'mailto:sales@netlayer.com'],
            ['Community', 'https://discord.gg/netlayer'], ['GitHub', 'https://github.com/Netlayer-global/Netlayer-cloud'],
          ]} />
        </div>

        {/* bottom bar */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row"
          style={{ borderColor: 'var(--b-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <FooterIcon Icon={Twitter} href="https://twitter.com/netlayer" />
            <FooterIcon Icon={Github} href="https://github.com/Netlayer-global/Netlayer-cloud" />
            <FooterIcon Icon={Linkedin} href="https://linkedin.com/company/netlayer" />
            <FooterIcon Icon={MessageCircle} href="https://discord.gg/netlayer" />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--t-low)' }}>
            © {new Date().getFullYear()} NetLayer Cloud Pvt. Ltd. · Made in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setDone(true)
    try {
      await waitlistAPI.join(email, 'newsletter', 'footer')
    } catch {
      /* best-effort — UI already confirmed */
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-[13px] font-medium text-white">Stay in the loop</div>
      <p className="mt-1 text-[12px]" style={{ color: 'var(--t-low)' }}>
        Product updates and engineering notes. No spam.
      </p>
      {done ? (
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px]"
          style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: BRAND }}
        >
          <Check size={15} /> You're subscribed — thanks!
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="h-11 flex-1 rounded-lg px-3.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/35"
            style={{ background: 'var(--nl-2)', border: '1px solid var(--b-strong)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = BRAND)}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--b-strong)')}
          />
          <button
            type="submit"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-transform hover:-translate-y-0.5"
            style={{ background: BRAND, color: 'var(--brand-fg)' }}
            aria-label="Subscribe"
          >
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--t-low)' }}>
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            {to.startsWith('http') || to.startsWith('mailto:') ? (
              <a
                href={to}
                target={to.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="text-[13px] transition-colors"
                style={{ color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              >
                {label}
              </a>
            ) : (
              <Link
                to={to}
                className="text-[13px] transition-colors"
                style={{ color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              >
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterIcon({ Icon, href }: { Icon: typeof Github; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
      style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', color: 'var(--t-low)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = BRAND
        e.currentTarget.style.borderColor = 'var(--brand-b)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--t-low)'
        e.currentTarget.style.borderColor = 'var(--b-default)'
      }}
      aria-label="Social link"
    >
      <Icon size={15} />
    </a>
  )
}
