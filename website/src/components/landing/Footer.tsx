import { Link } from 'react-router-dom'
import { Zap, Twitter, Github, Linkedin } from 'lucide-react'

interface LinkGroup {
  title: string
  links: { label: string; to: string; external?: boolean }[]
}

const GROUPS: LinkGroup[] = [
  {
    title: 'Products',
    links: [
      { label: 'Cloud Compute', to: '/pricing#compute' },
      { label: 'Bare Metal', to: '/pricing#baremetal' },
      { label: 'Kubernetes', to: '/kubernetes' },
      { label: 'Block Storage', to: '/pricing#blockstorage' },
      { label: 'Object Storage', to: '/pricing#storage' },
      { label: 'Managed Databases', to: '/pricing#databases' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Legal', to: '/legal' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Status', to: '/status' },
      { label: 'Contact', to: '/contact' },
      { label: 'Community', to: '/community' },
      { label: 'API Reference', to: '/api/openapi.json', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0070f3] to-[#00d4ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.4)]">
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <span className="font-semibold text-white text-[15px] tracking-tight">NetLayer</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              The cloud platform built for developers. SSD VMs, bare metal, and managed Kubernetes across 15 global regions.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://twitter.com/netlayercloud"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
              >
                <Twitter size={14} />
              </a>
              <a
                href="https://github.com/netlayercloud"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
              >
                <Github size={14} />
              </a>
              <a
                href="https://linkedin.com/company/netlayercloud"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
              >
                <Linkedin size={14} />
              </a>
            </div>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">{g.title}</div>
              <ul className="space-y-3">
                {g.links.map((l) =>
                  l.external ? (
                    <li key={l.label}>
                      <a
                        href={l.to}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} NetLayer Cloud Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/legal/gdpr" className="hover:text-white transition-colors">GDPR</Link>
            <Link to="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
