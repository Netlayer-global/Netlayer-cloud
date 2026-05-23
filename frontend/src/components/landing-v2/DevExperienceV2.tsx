import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Code2, FileCode2, Webhook, Copy, Check } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'

type Tab = 'cli' | 'api' | 'tf' | 'sdk'

const SNIPPETS: Record<Tab, { lang: string; code: string }> = {
  cli: {
    lang: 'bash',
    code: `# Install the CLI
$ npm install -g @netlayer/cli

# Authenticate with your API key
$ nl login

# Deploy a server in 30 seconds
$ nl server create \\
    --region mumbai \\
    --plan c3.large \\
    --image ubuntu-22.04
✓ Server up in 31s · 103.21.148.92`,
  },
  api: {
    lang: 'http',
    code: `POST /api/servers HTTP/2
Host: api.netlayer.com
Authorization: Bearer nl_xxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "name": "web-prod-01",
  "region": "bom1",
  "plan": "c3.large",
  "image": "ubuntu-22.04",
  "sshKeys": ["sk_default"]
}

# 201 Created · X-RateLimit-Remaining: 994`,
  },
  tf: {
    lang: 'hcl',
    code: `terraform {
  required_providers {
    netlayer = {
      source  = "netlayer-global/netlayer"
      version = "~> 0.1"
    }
  }
}

resource "netlayer_server" "web" {
  name           = "web-prod-01"
  plan_id        = data.netlayer_plan.small.id
  region_id      = data.netlayer_region.mumbai.id
  os_template_id = data.netlayer_os.ubuntu.id
}

output "ipv4" { value = netlayer_server.web.ipv4 }`,
  },
  sdk: {
    lang: 'typescript',
    code: `import { NetLayer } from '@netlayer/sdk'

const nl = new NetLayer({ apiKey: process.env.NL_API_KEY })

// Type-safe and async by default
const server = await nl.servers.create({
  name: 'web-prod-01',
  region: 'bom1',
  plan: 'c3.large',
  image: 'ubuntu-22.04',
})

await server.waitUntilRunning()       // returns when status === 'RUNNING'
console.log(\`Server up at \${server.ipv4}\`)`,
  },
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'cli', label: 'CLI',       icon: Terminal },
  { key: 'api', label: 'REST API',  icon: Webhook },
  { key: 'tf',  label: 'Terraform', icon: FileCode2 },
  { key: 'sdk', label: 'SDK',       icon: Code2 },
]

export function DevExperienceV2() {
  const [active, setActive] = useState<Tab>('cli')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (await copyToClipboard(SNIPPETS[active].code)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <section className="py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--nl-brand-2)] mb-4">
            Developer experience
          </p>
          <h2 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] nl-gradient-text">
            Built for the
            <br />
            command line.
          </h2>
          <p className="mt-6 text-[17px] text-[var(--nl-text-soft)] leading-[1.55]">
            CLI, REST API, Terraform, SDKs — all generated from the same OpenAPI spec, all
            type-safe, all available from day one.
          </p>

          <ul className="mt-8 space-y-2.5 text-[14px]">
            {[
              'Idempotency keys on every mutating call',
              'Webhooks for every state transition',
              'Sync + async modes per resource',
              'OpenAPI 3.0 spec served at /api/openapi.json',
              'Rate limits returned in X-RateLimit headers',
            ].map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-2 text-[var(--nl-text-soft)]"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--nl-brand-2)]" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--nl-brand)]/20 via-transparent to-[var(--nl-brand-2)]/20 blur-3xl rounded-2xl pointer-events-none" />
          <div className="relative nl-glass-strong rounded-xl overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--nl-border)] px-4 pt-3">
              <div className="flex items-center gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActive(t.key)}
                    className={`flex items-center gap-2 px-3 h-9 -mb-px text-[12.5px] font-medium border-b-2 transition-colors cursor-pointer ${
                      active === t.key
                        ? 'text-white border-[var(--nl-brand-2)]'
                        : 'text-[var(--nl-text-muted)] border-transparent hover:text-[var(--nl-text-soft)]'
                    }`}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="text-[var(--nl-text-muted)] hover:text-white transition-colors p-2 cursor-pointer"
                aria-label="Copy"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Code */}
            <AnimatePresence mode="wait">
              <motion.pre
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5 nl-mono text-[12.5px] leading-[1.7] text-[var(--nl-text)] min-h-[360px] whitespace-pre-wrap"
              >
                {SNIPPETS[active].code}
              </motion.pre>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
