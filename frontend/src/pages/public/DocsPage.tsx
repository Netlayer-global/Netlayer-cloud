import { Link } from 'react-router-dom'
import { Book, Code2, Terminal, Zap, ArrowRight, Download, ExternalLink } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'

const QUICK_START = [
  {
    icon: Zap,
    title: 'Quick start',
    desc: 'Sign up, deploy your first server, SSH into it. 3-minute walkthrough.',
    to: '/docs/quickstart',
    color: 'text-[#0070f3]',
    bg: 'bg-[#0070f3]/10',
  },
  {
    icon: Code2,
    title: 'API reference',
    desc: 'Full OpenAPI 3.0 spec. Generated SDKs in TypeScript, Go, Python.',
    to: '/api/openapi.json',
    external: true,
    color: 'text-[#00d4ff]',
    bg: 'bg-[#00d4ff]/10',
  },
  {
    icon: Terminal,
    title: 'CLI guide',
    desc: 'Install netlayer, log in, deploy, manage — all from your shell.',
    to: '/docs/cli',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Book,
    title: 'Tutorials',
    desc: 'WordPress in 5 minutes. Kubernetes from scratch. Production hardening.',
    to: '/docs/tutorials',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
]

const SDKS = [
  {
    name: 'TypeScript / Node',
    install: 'npm install @netlayer/sdk',
    snippet: `import { NetLayer } from '@netlayer/sdk'

const nl = new NetLayer({ apiKey: process.env.NETLAYER_KEY })
const servers = await nl.servers.list()`,
    docs: '/docs/sdks/typescript',
  },
  {
    name: 'Python',
    install: 'pip install netlayer',
    snippet: `from netlayer import NetLayer

nl = NetLayer(api_key="nlt_...")
servers = nl.servers.list()`,
    docs: '/docs/sdks/python',
  },
  {
    name: 'Go',
    install: 'go get github.com/netlayer/netlayer-go',
    snippet: `import "github.com/netlayer/netlayer-go"

nl := netlayer.New(os.Getenv("NETLAYER_KEY"))
servers, _ := nl.Servers.List(ctx)`,
    docs: '/docs/sdks/go',
  },
  {
    name: 'CLI',
    install: 'npm install -g @netlayer/cli',
    snippet: `$ netlayer auth login
$ netlayer server create --plan c3.large --region mumbai
$ netlayer server list`,
    docs: '/docs/cli',
  },
]

const SECTIONS = [
  {
    title: 'Compute',
    links: [
      { label: 'Deploying servers',     to: '/docs/compute/deploying' },
      { label: 'Server lifecycle',      to: '/docs/compute/lifecycle' },
      { label: 'Live migration',        to: '/docs/compute/migration' },
      { label: 'Snapshots',             to: '/docs/compute/snapshots' },
      { label: 'Cloud-init / userdata', to: '/docs/compute/cloud-init' },
    ],
  },
  {
    title: 'Networking',
    links: [
      { label: 'Private networking',  to: '/docs/network/private' },
      { label: 'Floating IPs',        to: '/docs/network/floating-ip' },
      { label: 'Firewall rules',      to: '/docs/network/firewall' },
      { label: 'Load balancers',      to: '/docs/network/lb' },
      { label: 'DNS management',      to: '/docs/network/dns' },
    ],
  },
  {
    title: 'Storage',
    links: [
      { label: 'Block volumes',       to: '/docs/storage/block' },
      { label: 'Object storage',      to: '/docs/storage/object' },
      { label: 'Backups',             to: '/docs/storage/backups' },
      { label: 'S3-compatible API',   to: '/docs/storage/s3' },
    ],
  },
  {
    title: 'Account & billing',
    links: [
      { label: 'Pricing model',       to: '/docs/billing/pricing' },
      { label: 'Hourly billing',      to: '/docs/billing/hourly' },
      { label: 'GST invoices (IN)',   to: '/docs/billing/gst' },
      { label: 'Razorpay setup',      to: '/docs/billing/razorpay' },
      { label: 'Stripe setup',        to: '/docs/billing/stripe' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              Documentation
            </h1>
            <p className="mt-5 text-lg text-gray-400">
              Everything you need to build on NetLayer.
            </p>
          </header>

          {/* Quick-start grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-20">
            {QUICK_START.map((q) => {
              const inner = (
                <div className="group h-full bg-[#111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.15] transition-all cursor-pointer">
                  <div className={`w-9 h-9 rounded-lg ${q.bg} ${q.color} flex items-center justify-center mb-3`}>
                    <q.icon size={16} />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-white mb-1">
                    {q.title}
                    {q.external && <ExternalLink size={12} className="opacity-60" />}
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed">{q.desc}</div>
                </div>
              )
              return q.external ? (
                <a key={q.title} href={q.to} target="_blank" rel="noreferrer">{inner}</a>
              ) : (
                <Link key={q.title} to={q.to}>{inner}</Link>
              )
            })}
          </div>

          {/* SDK section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">SDKs & libraries</h2>
                <p className="text-sm text-gray-400 mt-1">Auto-generated from the OpenAPI spec.</p>
              </div>
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#00d4ff] hover:text-white"
              >
                <Download size={12} /> openapi.json
              </a>
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              {SDKS.map((sdk) => <SDKCard key={sdk.name} sdk={sdk} />)}
            </div>
          </section>

          {/* Sections */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">Browse by topic</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SECTIONS.map((s) => (
                <div key={s.title}>
                  <h3 className="text-xs uppercase tracking-widest text-[#0070f3] font-semibold mb-3">
                    {s.title}
                  </h3>
                  <ul className="space-y-2">
                    {s.links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1"
                        >
                          {l.label}
                          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function SDKCard({ sdk }: { sdk: typeof SDKS[number] }) {
  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="text-sm font-semibold text-white">{sdk.name}</span>
        <Link to={sdk.docs} className="text-xs text-[#00d4ff] hover:text-white inline-flex items-center gap-1">
          Docs <ArrowRight size={11} />
        </Link>
      </div>
      <div className="px-4 py-3 border-b border-white/[0.06] font-mono text-xs text-[#00d4ff] bg-[#0a0a0a]">
        {sdk.install}
      </div>
      <pre className="px-4 py-3 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
        {sdk.snippet}
      </pre>
    </div>
  )
}
