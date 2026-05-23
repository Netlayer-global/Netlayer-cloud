import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'
import { blogAPI } from '../../api/endpoints'

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Lightweight markdown → JSX renderer scoped to what the seeded blog posts
 * actually use: headings (## / ###), paragraphs, bold (**), inline code (`),
 * links ([text](url)), unordered lists, and pipe tables. Pulling in a
 * markdown library for three blog posts isn't worth the bundle weight; if
 * the blog grows we'll swap this for `react-markdown` + `remark-gfm`.
 */
function renderMarkdown(md: string) {
  const out: JSX.Element[] = []
  const lines = md.split(/\r?\n/)
  let i = 0
  let key = 0

  const inline = (raw: string) => {
    // Order matters: code first (so ** inside code stays literal), then bold, then links.
    const parts: (string | JSX.Element)[] = []
    let s = raw
    let pi = 0
    const codeRe = /`([^`]+)`/
    while (s.length) {
      const m = codeRe.exec(s)
      if (!m) { parts.push(s); break }
      if (m.index > 0) parts.push(s.slice(0, m.index))
      parts.push(<code key={`c${pi++}`} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#c8f135] text-[13px] font-mono">{m[1]}</code>)
      s = s.slice(m.index + m[0].length)
    }
    return parts.flatMap((p, idx) => {
      if (typeof p !== 'string') return [p]
      const subs: (string | JSX.Element)[] = []
      let r = p
      const linkRe = /\[([^\]]+)\]\(([^)]+)\)/
      while (r.length) {
        const m = linkRe.exec(r)
        if (!m) { subs.push(r); break }
        if (m.index > 0) subs.push(r.slice(0, m.index))
        const isInternal = m[2].startsWith('/')
        subs.push(
          isInternal ? (
            <Link key={`l${idx}-${subs.length}`} to={m[2]} className="text-[#c8f135] underline underline-offset-4 hover:text-[#b3d82e] transition-colors">{m[1]}</Link>
          ) : (
            <a key={`l${idx}-${subs.length}`} href={m[2]} target="_blank" rel="noreferrer" className="text-[#c8f135] underline underline-offset-4 hover:text-[#b3d82e] transition-colors">{m[1]}</a>
          )
        )
        r = r.slice(m.index + m[0].length)
      }
      return subs.flatMap((sub, j) => {
        if (typeof sub !== 'string') return [sub]
        const boldParts = sub.split(/\*\*([^*]+)\*\*/)
        return boldParts.map((bp, k) =>
          k % 2 === 1 ? <strong key={`b${idx}-${j}-${k}`} className="text-white font-semibold">{bp}</strong> : bp
        )
      })
    })
  }

  while (i < lines.length) {
    const line = lines[i]
    // table
    if (line.startsWith('|') && lines[i + 1]?.startsWith('|')) {
      const tableRows: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableRows.push(lines[i])
        i += 1
      }
      const header = tableRows[0].split('|').slice(1, -1).map((c) => c.trim())
      const body = tableRows.slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()))
      out.push(
        <div key={key++} className="my-6 overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                {header.map((h, hi) => (
                  <th key={hi} className="px-4 py-2 text-xs uppercase tracking-wide text-[#9a9c9a] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-t border-white/[0.04]">
                  {row.map((c, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-[#eeeeed]">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }
    // headings
    if (line.startsWith('### ')) {
      out.push(<h3 key={key++} className="mt-8 mb-3 text-lg font-semibold text-white">{inline(line.slice(4))}</h3>)
      i += 1
      continue
    }
    if (line.startsWith('## ')) {
      out.push(<h2 key={key++} className="mt-12 mb-4 text-2xl font-semibold text-white tracking-tight">{inline(line.slice(3))}</h2>)
      i += 1
      continue
    }
    if (line.startsWith('# ')) {
      out.push(<h1 key={key++} className="mt-12 mb-5 text-3xl font-semibold text-white">{inline(line.slice(2))}</h1>)
      i += 1
      continue
    }
    // unordered list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i += 1
      }
      out.push(
        <ul key={key++} className="my-4 space-y-2 list-disc list-outside pl-5 text-[#cfd0cf]">
          {items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}
        </ul>
      )
      continue
    }
    // ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i += 1
      }
      out.push(
        <ol key={key++} className="my-4 space-y-2 list-decimal list-outside pl-5 text-[#cfd0cf]">
          {items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}
        </ol>
      )
      continue
    }
    // blank line
    if (line.trim() === '') {
      i += 1
      continue
    }
    // paragraph
    out.push(<p key={key++} className="my-4 leading-[1.75] text-[#cfd0cf]">{inline(line)}</p>)
    i += 1
  }
  return out
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => blogAPI.get(slug!).then((r) => r.data.data),
    enabled: !!slug,
  })

  return (
    <div className="min-h-screen bg-[#080909] text-white antialiased">
      <TopNav />

      <div className="pt-28 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-[#9a9c9a] hover:text-[#c8f135] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> All posts
        </Link>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-white/[0.04] rounded" />
            <div className="h-10 w-full bg-white/[0.04] rounded" />
            <div className="h-4 w-2/3 bg-white/[0.04] rounded" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Post not found</h1>
            <p className="text-sm text-[#9a9c9a] mb-4">This post may have been moved or unpublished.</p>
            <Link to="/blog" className="text-[#c8f135] underline underline-offset-4 text-sm hover:text-[#b3d82e]">
              Back to blog
            </Link>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center gap-3 text-xs text-[#9a9c9a] mb-4">
              <span className="text-[11px] uppercase tracking-wider text-[#c8f135]">{data.category}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(data.publishedAt)}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {data.readMinutes} min read</span>
            </div>

            <h1 className="text-4xl sm:text-[44px] leading-[1.15] font-semibold tracking-tight text-white mb-5">
              {data.title}
            </h1>

            <p className="text-lg text-[#9a9c9a] leading-relaxed mb-8">{data.excerpt}</p>

            <div className="flex items-center gap-3 pb-8 mb-8 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c8f135] to-[#a8e620] flex items-center justify-center text-[#080909] font-semibold text-sm">
                {data.authorName.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{data.authorName}</div>
                <div className="text-xs text-[#9a9c9a]">{data.authorRole}</div>
              </div>
            </div>

            <article className="prose-invert max-w-none text-[15px]">
              {renderMarkdown(data.content)}
            </article>

            {data.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-wrap gap-2 items-center">
                <Tag size={14} className="text-[#9a9c9a]" />
                {data.tags.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[#9a9c9a]">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-12 rounded-2xl border border-[#c8f135]/20 bg-gradient-to-br from-[#c8f135]/10 to-transparent p-8 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Try NetLayer free</h3>
              <p className="text-sm text-[#9a9c9a] mb-5 max-w-md mx-auto">
                Deploy a VPS in 30 seconds. Get $100 in free credit when you sign up.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium text-[#080909] bg-[#c8f135] hover:bg-[#b3d82e] transition-colors cursor-pointer"
              >
                Start free
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
