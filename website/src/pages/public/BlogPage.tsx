import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, ArrowRight, Cpu, Shield, Sparkles, Rocket, Zap, BookOpen } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'
import { blogAPI, type BlogPostSummary } from '../../api/endpoints'

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

const CATEGORY_ICONS: Record<string, { icon: any; color: string }> = {
  product:        { icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  engineering:    { icon: Cpu,      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  infrastructure: { icon: Shield,   color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  guides:         { icon: BookOpen, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  announcements:  { icon: Rocket,   color: 'text-[#c8f135] bg-[#c8f135]/10 border-[#c8f135]/30' },
}

export default function BlogPage() {
  const { data: posts = [], isLoading } = useQuery<BlogPostSummary[]>({
    queryKey: ['blog', 'list'],
    queryFn: () => blogAPI.list({ limit: 50 }).then((r) => r.data.data),
  })

  return (
    <div className="min-h-screen bg-[#080909] text-white antialiased">
      <TopNav />

      <section className="pt-32 pb-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-[#cfd0cf]">
          <Zap size={12} className="text-[#c8f135]" /> Blog
        </span>
        <h1 className="mt-6 text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
          Notes from the cloud
        </h1>
        <p className="mt-6 text-lg text-[#9a9c9a] max-w-2xl leading-relaxed">
          Engineering deep-dives, product launches, and the occasional postmortem. Written by the team who runs the platform.
        </p>
      </section>

      <section className="pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
                <div className="h-4 w-24 bg-white/[0.06] rounded mb-3" />
                <div className="h-6 w-2/3 bg-white/[0.06] rounded mb-3" />
                <div className="h-4 w-full bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-10 text-center text-sm text-[#9a9c9a]">
            No posts yet. Check back soon.
          </div>
        )}

        <div className="space-y-4">
          {posts.map((p, idx) => {
            const cfg = CATEGORY_ICONS[p.category] || CATEGORY_ICONS.engineering
            const Icon = cfg.icon
            return (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-[#c8f135]/30 hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-5">
                  <div className={`shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs text-[#636563] mb-2 flex-wrap">
                      <span className="text-[11px] uppercase tracking-wider text-[#c8f135]">{p.category}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {p.readMinutes} min read</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white group-hover:text-[#c8f135] transition-colors mb-2">
                      {p.title}
                    </h2>
                    <p className="text-sm text-[#9a9c9a] leading-relaxed">{p.excerpt}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#c8f135] group-hover:translate-x-0.5 transition-transform">
                      Read article <ArrowRight size={11} />
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-[#9a9c9a]">
                    Latest post
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Email subscribe — purely client-side demo for now */}
        <div className="mt-12 rounded-2xl border border-[#c8f135]/20 bg-gradient-to-br from-[#c8f135]/10 to-transparent p-8 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Get new posts in your inbox</h3>
          <p className="text-sm text-[#9a9c9a] mb-5 max-w-md mx-auto">
            One email when we publish. No marketing fluff — just engineering and product writing.
          </p>
          <form
            className="flex gap-2 max-w-md mx-auto"
            onSubmit={(e) => { e.preventDefault(); alert('Subscribed (demo).') }}
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 h-10 px-4 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#636563] focus:border-[#c8f135] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="h-10 px-5 rounded-md text-sm font-medium text-[#080909] bg-[#c8f135] hover:bg-[#b3d82e] cursor-pointer transition-colors whitespace-nowrap"
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
