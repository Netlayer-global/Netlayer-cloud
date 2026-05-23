import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin } from 'lucide-react'

const NAV: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: 'Products',
    links: [
      { label: 'Cloud VPS',         to: '/pricing#compute' },
      { label: 'Bare Metal',        to: '/pricing#baremetal' },
      { label: 'GPU Cloud',         to: '/pricing#gpu' },
      { label: 'Kubernetes',        to: '/kubernetes' },
      { label: 'Object Storage',    to: '/pricing#storage' },
      { label: 'Block Storage',     to: '/pricing#blockstorage' },
      { label: 'Managed Databases', to: '/pricing#databases' },
      { label: 'Load Balancers',    to: '/pricing#lb' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'API reference', to: '/docs#api' },
      { label: 'CLI',           to: '/docs#cli' },
      { label: 'Terraform',     to: '/docs#terraform' },
      { label: 'Changelog',     to: '/blog' },
      { label: 'GitHub',        to: 'https://github.com/Netlayer-global/Netlayer-cloud', external: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',         to: '/about' },
      { label: 'Careers',       to: '/careers' },
      { label: 'Blog',          to: '/blog' },
      { label: 'Press kit',     to: '/about#press' },
      { label: 'Contact',       to: 'mailto:hello@netlayer.com', external: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Status',        to: '/status' },
      { label: 'Network',       to: '/network' },
      { label: 'Pricing',       to: '/pricing' },
      { label: 'Marketplace',   to: '/dashboard/marketplace' },
      { label: 'Abuse report',  to: '/abuse-report' },
    ],
  },
]

export function FooterV2() {
  return (
    <footer className="border-t border-[var(--nl-border)] bg-[var(--nl-surface)]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand col */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                <defs>
                  <linearGradient id="footerLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f8bff" />
                    <stop offset="100%" stopColor="#4ad7ff" />
                  </linearGradient>
                </defs>
                <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#footerLogo)" />
                <path d="M16 7 L23 11 L23 21 L16 25 L9 21 L9 11 Z" fill="#0a0c12" />
                <circle cx="16" cy="16" r="3" fill="url(#footerLogo)" />
              </svg>
              <span className="font-semibold text-white">NetLayer</span>
            </Link>
            <p className="mt-5 text-[13px] text-[var(--nl-text-muted)] leading-[1.6] max-w-xs">
              Cloud infrastructure for builders. Bare metal, virtualised, and GPU compute across 15 global regions.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://github.com/Netlayer-global/Netlayer-cloud"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg nl-glass flex items-center justify-center hover:border-[var(--nl-border-strong)] hover:text-white text-[var(--nl-text-muted)] transition-all cursor-pointer"
                aria-label="GitHub"
              >
                <Github size={15} />
              </a>
              <a
                href="https://twitter.com/netlayer"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg nl-glass flex items-center justify-center hover:border-[var(--nl-border-strong)] hover:text-white text-[var(--nl-text-muted)] transition-all cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter size={15} />
              </a>
              <a
                href="https://linkedin.com/company/netlayer"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg nl-glass flex items-center justify-center hover:border-[var(--nl-border-strong)] hover:text-white text-[var(--nl-text-muted)] transition-all cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin size={15} />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-[var(--nl-text-muted)] mb-5">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.to}
                        target={l.to.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className="text-[13px] text-[var(--nl-text-soft)] hover:text-white transition-colors cursor-pointer"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        className="text-[13px] text-[var(--nl-text-soft)] hover:text-white transition-colors cursor-pointer"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--nl-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[var(--nl-text-muted)]">
            © 2026 NetLayer Cloud Pvt. Ltd. — Mumbai, India
          </p>
          <div className="flex items-center gap-5 text-[12px]">
            <Link to="/legal/privacy" className="text-[var(--nl-text-muted)] hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="text-[var(--nl-text-muted)] hover:text-white transition-colors">Terms</Link>
            <Link to="/status" className="text-[var(--nl-text-muted)] hover:text-white transition-colors">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
