import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, Sparkles, Cpu, Shield } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'

interface Post {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readMinutes: number
  tag: string
  icon: any
  iconColor: string
}

const POSTS: Post[] = [
  {
    slug: 'introducing-netlayer-gpu-cloud',
    title: 'Introducing NetLayer GPU Cloud',
    excerpt: 'On-demand A100 and H100 instances, billed by the second. Built for ML workloads that need to spin up fast and pay only for what they use.',
    publishedAt: '2026-05-20',
    readMinutes: 4,
    tag: 'Product',
    icon: Sparkles,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    slug: 'why-bare-metal-still-matters',
    title: 'Why bare metal still matters for AI workloads',
    excerpt: 'Virtualisation overhead is small for most workloads, but for training jobs that saturate the NVMe bus and the network interface, dedicated hardware wins by a measurable margin.',
    publishedAt: '2026-05-12',
    readMinutes: 7,
    tag: 'Engineering',
    icon: Cpu,
    iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
  {
    slug: 'how-we-hit-99-99-uptime',
    title: 'How we got to 99.99% uptime in our first year',
    excerpt: 'Active-active control plane, automated rollbacks, hot-standby compute hosts, and a small team that takes pager duty seriously. Here\'s the actual playbook.',
    publishedAt: '2026-04-28',
    readMinutes: 9,
    tag: 'Infrastructure',
    icon: Shield,
    iconColor: 'text-green-400 bg-green-500/10 border-green-500/30',
  },
]

const formatDate = (s: string) => {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />

      <section className="pt-32 pb-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <span className="inline-block px-3 h-7 leading-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300">
          Blog
        </span>
        <h1 className="mt-6 text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
          Notes from the cloud
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl leading-relaxed">
          Engineering deep-dives, product launches, and the occasional postmortem. Written by the team
          who runs the platform.
        </p>
      </section>

      <section className="pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="space-y-4">
          {POSTS.map((p, idx) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.04] hover:border-[#0070f3]/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-5">
                <div className={`shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${p.iconColor}`}>
                  <p.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wider text-[#00d4ff]">{p.tag}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.publishedAt)}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {p.readMinutes} min read</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-[#00d4ff] transition-colors mb-2">
                    {p.title}
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.excerpt}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#0070f3] group-hover:text-[#00d4ff] transition-colors">
                    Read article <ArrowRight size={11} />
                  </div>
                </div>
              </div>
              {idx === 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-gray-500">
                  ⭐ Latest post
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Email subscribe */}
        <div className="mt-12 bg-gradient-to-br from-[#0070f3]/10 to-[#00d4ff]/5 border border-[#0070f3]/20 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Get new posts in your inbox</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
            One email when we publish. No marketing fluff — just the engineering and product writing.
          </p>
          <form
            className="flex gap-2 max-w-md mx-auto"
            onSubmit={(e) => { e.preventDefault(); alert('Subscribed (demo)') }}
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 h-10 px-4 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:border-[#0070f3] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="h-10 px-5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff] hover:from-[#0080ff] hover:to-[#00a0ff] cursor-pointer transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
