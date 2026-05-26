import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { SectionHeader } from './SectionHeader'

/**
 * DeveloperSection — three side-by-side code cards (REST, CLI, Terraform)
 * with copy-to-clipboard and a tiny syntax-highlighter that runs in
 * useMemo to avoid re-tokenising on every render.
 */

const CODE_REST = `curl -X POST https://api.netlayer.com/v1/servers \\
  -H "Authorization: Bearer $NL_KEY" \\
  -d '{
    "region": "mumbai",
    "plan":   "c3.large",
    "image":  "ubuntu-22.04"
  }'`

const CODE_CLI = `npm install -g @netlayer/cli
nl login

nl server create \\
  --region mumbai \\
  --plan   c3.large`

const CODE_TF = `resource "netlayer_server" "web" {
  region   = "mumbai"
  plan     = "c3.large"
  image    = "ubuntu-22.04"
  ssh_keys = [var.ssh_key_id]
}

output "ip" {
  value = netlayer_server.web.ipv4
}`

export function DeveloperSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="DEVELOPER FIRST"
          title="Every interface you need"
          subtitle="OpenAPI-driven. CLI, REST, and Terraform always in sync."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <CodeCard title="REST API" code={CODE_REST} link={{ to: '/docs#api', label: 'Full API reference' }} />
          <CodeCard title="CLI (npm / brew)" code={CODE_CLI} link={{ to: '/docs#cli', label: 'Install docs' }} />
          <CodeCard title="Terraform provider" code={CODE_TF} link={{ to: '/docs#terraform', label: 'Provider docs' }} />
        </div>
      </div>
    </section>
  )
}

function CodeCard({
  title,
  code,
  link,
}: {
  title: string
  code: string
  link: { to: string; label: string }
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div
      className="nl-card transition-all"
      style={{ overflow: 'hidden' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-b)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--b-default)'
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.transform = ''
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--b-default)' }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="p-1.5 rounded cursor-pointer"
          style={{ color: 'var(--t-low)' }}
          aria-label="Copy"
        >
          {copied ? <Check size={13} style={{ color: 'var(--c-green)' }} /> : <Copy size={13} />}
        </button>
      </div>
      <pre
        className="px-4 py-4 overflow-x-auto"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.65,
          color: 'var(--t-hi)',
          minHeight: 200,
        }}
      >
        <SyntaxedCode raw={code} />
      </pre>
      <Link
        to={link.to}
        className="block px-4 py-3 transition-colors"
        style={{
          borderTop: '1px solid var(--b-default)',
          fontSize: 12,
          color: 'var(--brand)',
        }}
      >
        {link.label} →
      </Link>
    </div>
  )
}

function SyntaxedCode({ raw }: { raw: string }) {
  // Lightweight tokeniser — colours keywords, strings, numbers, comments.
  const tokens = useMemo(() => {
    const out: { text: string; cls: string }[] = []
    const re = /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(#.*$)|(\/\/.*$)|(\b(?:resource|output|var|true|false|null|export|import|const|let)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z_]{2,}\b)/gm
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(raw))) {
      if (m.index > last) out.push({ text: raw.slice(last, m.index), cls: '' })
      const cls =
        m[1] || m[2] ? 'sx-str' :
        m[3] || m[4] ? 'sx-com' :
        m[5]         ? 'sx-kw'  :
        m[6]         ? 'sx-num' :
        m[7]         ? 'sx-env' : ''
      out.push({ text: m[0], cls })
      last = m.index + m[0].length
    }
    if (last < raw.length) out.push({ text: raw.slice(last), cls: '' })
    return out
  }, [raw])

  return (
    <>
      <style>{`
        .sx-str { color: var(--c-cyan); }
        .sx-com { color: var(--t-low); font-style: italic; }
        .sx-kw  { color: var(--brand); }
        .sx-num { color: var(--c-amber); }
        .sx-env { color: var(--c-purple); }
      `}</style>
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={t.cls}>{t.text}</span>
        ))}
      </code>
    </>
  )
}
