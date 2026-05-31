import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'
import { blogAPI } from '../../api/endpoints'
import { useSeo } from '../../hooks/useSeo'

const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string

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
      parts.push(<code key={`c${pi++}`} className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--nl-3)', color: 'var(--brand)', fontSize: 13 }}>{m[1]}</code>)
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
            <Link key={`l${idx}-${subs.length}`} to={m[2]} className="underline underline-offset-4 transition-colors" style={{ color: 'var(--brand)' }}>{m[1]}</Link>
          ) : (
            <a key={`l${idx}-${subs.length}`} href={m[2]} target="_blank" rel="noreferrer" className="underline underline-offset-4 transition-colors" style={{ color: 'var(--brand)' }}>{m[1]}</a>
          )
        )
        r = r.slice(m.index + m[0].length)
      }
      return subs.flatMap((sub, j) => {
        if (typeof sub !== 'string') return [sub]
        const boldParts = sub.split(/\*\*([^*]+)\*\*/)
        return boldParts.map((bp, k) =>
          k % 2 === 1 ? <strong key={`b${idx}-${j}-${k}`} className="font-semibold" style={{ color: 'var(--t-hi)' }}>{bp}</strong> : bp
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
        <div key={key++} className="my-6 overflow-x-auto" style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--b-default)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ background: 'var(--nl-3)' }}>
                {header.map((h, hi) => (
                  <th key={hi} className="px-4 py-2 text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--t-low)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} style={{ borderTop: '1px solid var(--b-subtle)' }}>
                  {row.map((c, ci) => (
                    <td key={ci} className="px-4 py-2.5" style={{ color: 'var(--t-hi)' }}>{inline(c)}</td>
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
      out.push(<h3 key={key++} className="nl-head mt-8 mb-3" style={{ fontSize: 18, color: 'var(--t-hi)' }}>{inline(line.slice(4))}</h3>)
      i += 1
      continue
    }
    if (line.startsWith('## ')) {
      out.push(<h2 key={key++} className="nl-head mt-12 mb-4" style={{ fontSize: 24, color: 'var(--t-hi)' }}>{inline(line.slice(3))}</h2>)
      i += 1
      continue
    }
    if (line.startsWith('# ')) {
      out.push(<h1 key={key++} className="nl-display mt-12 mb-5" style={{ fontSize: 30, color: 'var(--t-hi)' }}>{inline(line.slice(2))}</h1>)
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
        <ul key={key++} className="my-4 space-y-2 list-disc list-outside pl-5" style={{ color: 'var(--t-med)' }}>
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
        <ol key={key++} className="my-4 space-y-2 list-decimal list-outside pl-5" style={{ color: 'var(--t-med)' }}>
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
    out.push(<p key={key++} className="my-4" style={{ lineHeight: 1.75, color: 'var(--t-med)' }}>{inline(line)}</p>)
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

  useSeo({
    title: data?.title || 'Blog',
    description: data?.excerpt,
    path: slug ? `/blog/${slug}` : '/blog',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <div className="nl-container" style={{ padding: 'clamp(120px,16vh,170px) clamp(20px,4vw,72px) clamp(64px,9vw,100px)', maxWidth: 820 }}>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 transition-colors"
          style={{ fontSize: 14, color: 'var(--t-med)', marginBottom: 32 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
        >
          <ArrowLeft size={14} /> All posts
        </Link>

        {isLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div style={{ height: 16, width: 128, background: 'var(--nl-3)', borderRadius: 4 }} />
            <div style={{ height: 40, width: '100%', background: 'var(--nl-3)', borderRadius: 4 }} />
            <div style={{ height: 16, width: '66%', background: 'var(--nl-3)', borderRadius: 4 }} />
          </div>
        )}

        {isError && (
          <div className="text-center" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 40 }}>
            <h1 className="nl-head" style={{ fontSize: 24, color: 'var(--t-hi)', marginBottom: 8 }}>Post not found</h1>
            <p style={{ fontSize: 14, color: 'var(--t-med)', marginBottom: 16 }}>This post may have been moved or unpublished.</p>
            <Link to="/blog" className="underline underline-offset-4" style={{ color: 'var(--brand)', fontSize: 14 }}>Back to blog</Link>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 12, color: 'var(--t-low)', marginBottom: 16 }}>
              <span className="nl-mono" style={{ letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand)' }}>{data.category}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(data.publishedAt)}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {data.readMinutes} min read</span>
            </div>

            <h1 className="nl-display" style={{ fontSize: 'clamp(32px,4.5vw,46px)', lineHeight: 1.15, color: 'var(--t-hi)', marginBottom: 18 }}>
              {data.title}
            </h1>

            <p style={{ fontSize: 18, color: 'var(--t-med)', lineHeight: 1.6, marginBottom: 28 }}>{data.excerpt}</p>

            <div className="flex items-center gap-3" style={{ paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid var(--b-subtle)' }}>
              <div className="flex items-center justify-center nl-head" style={{ width: 40, height: 40, borderRadius: 'var(--r-full)', background: 'linear-gradient(135deg, var(--a-lime), var(--a-cyan))', color: 'var(--brand-fg)', fontSize: 14 }}>
                {data.authorName.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-hi)' }}>{data.authorName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--t-low)' }}>{data.authorRole}</div>
              </div>
            </div>

            <article className="max-w-none" style={{ fontSize: 15 }}>
              {renderMarkdown(data.content)}
            </article>

            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--b-subtle)' }}>
                <Tag size={14} style={{ color: 'var(--t-low)' }} />
                {data.tags.map((t) => (
                  <span key={t} className="nl-mono" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', color: 'var(--t-low)' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="text-center relative overflow-hidden" style={{ marginTop: 48, borderRadius: 'var(--r-2xl)', border: '1px solid var(--brand-b)', background: 'var(--nl-2)', padding: 'clamp(32px,4vw,44px)' }}>
              <h3 className="nl-head" style={{ fontSize: 19, color: 'var(--t-hi)', marginBottom: 8 }}>Try NetLayer free</h3>
              <p style={{ fontSize: 14, color: 'var(--t-med)', maxWidth: 440, margin: '0 auto 20px' }}>
                Deploy a VPS in 30 seconds. Get ₹3,500 in free credit when you sign up.
              </p>
              <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary inline-flex">Start free</a>
            </div>
          </>
        )}
      </div>

      <LandingFooter />
    </div>
  )
}
