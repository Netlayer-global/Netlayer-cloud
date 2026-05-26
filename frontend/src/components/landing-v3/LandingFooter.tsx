import { Link } from 'react-router-dom'
import { Github, Linkedin, MessageCircle, Twitter } from 'lucide-react'

/**
 * Public site footer. Mirrored on every public page (landing, /pricing,
 * /network, /docs, /blog, /about, /careers, /status, /legal/*) so the
 * footer chrome stays in sync.
 *
 * Re-exported from `pages/Landing.tsx` for backwards compatibility — public
 * pages that already import `LandingFooter` from `../Landing` keep working.
 */
export function LandingFooter() {
  return (
    <footer
      className="px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        paddingTop: 'var(--sp-16)',
        paddingBottom: 'var(--sp-8)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" aria-hidden>
              <polygon points="16,3 27,9 27,22 16,28 5,22 5,9" stroke="var(--brand)" strokeWidth="1.5" fill="none" />
              <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="var(--brand-d)" stroke="var(--brand)" strokeWidth="1" />
              <circle cx="16" cy="16" r="2.5" fill="var(--brand)" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600 }}>NetLayer Cloud</span>
          </Link>
          <p className="mt-4" style={{ fontSize: 12, color: 'var(--t-low)', lineHeight: 1.6 }}>
            Production-grade VPS hosting for developers and teams.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <FooterIcon Icon={Twitter}      href="https://twitter.com/netlayer" />
            <FooterIcon Icon={Github}       href="https://github.com/Netlayer-global/Netlayer-cloud" />
            <FooterIcon Icon={Linkedin}     href="https://linkedin.com/company/netlayer" />
            <FooterIcon Icon={MessageCircle} href="https://discord.gg/netlayer" />
          </div>
        </div>

        <FooterCol title="Products" links={[
          ['Cloud VPS', '/pricing#compute'], ['Bare Metal', '/pricing#bare'], ['GPU Cloud', '/pricing#gpu'],
          ['Kubernetes', '/kubernetes'], ['Block Storage', '/pricing#block'], ['Object Storage', '/pricing#object'],
          ['Managed DB', '/pricing#db'], ['Load Balancers', '/pricing#lb'],
        ]} />

        <FooterCol title="Company" links={[
          ['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'],
          ['Press', '/about#press'], ['Legal', '/legal/terms'],
          ['Privacy', '/legal/privacy'], ['Terms', '/legal/terms'],
        ]} />

        <FooterCol title="Resources" links={[
          ['Documentation', '/docs'], ['API Reference', '/docs#api'], ['Changelog', '/blog'],
          ['Status', '/status'], ['Community', 'https://discord.gg/netlayer'],
          ['Support', 'mailto:support@netlayer.com'], ['Abuse Report', '/abuse-report'], ['SLA', '/legal/terms'],
        ]} />
      </div>

      <div
        className="max-w-7xl mx-auto mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3"
        style={{ borderTop: '1px solid var(--b-subtle)' }}
      >
        <p style={{ fontSize: 11, color: 'var(--t-low)' }}>
          © 2024 NetLayer Cloud Pvt. Ltd. All rights reserved.
        </p>
        <p style={{ fontSize: 11, color: 'var(--t-low)' }}>
          Made in India 🇮🇳 · Serving globally
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3
        className="text-[10px] uppercase tracking-[.18em] mb-4"
        style={{ color: 'var(--t-low)' }}
      >
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
                style={{ fontSize: 12, color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              >
                {label}
              </a>
            ) : (
              <Link
                to={to}
                style={{ fontSize: 12, color: 'var(--t-med)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
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

function FooterIcon({ Icon, href }: { Icon: any; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
      style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', color: 'var(--t-low)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--t-hi)'
        e.currentTarget.style.borderColor = 'var(--b-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--t-low)'
        e.currentTarget.style.borderColor = 'var(--b-default)'
      }}
      aria-label="Social link"
    >
      <Icon size={14} />
    </a>
  )
}
