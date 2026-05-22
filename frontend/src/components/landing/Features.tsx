import { Check, Server, Activity, Code2 } from 'lucide-react'

interface FeatureDef {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  visual: 'deploy' | 'metrics' | 'code'
  flip: boolean
}

const FEATURES: FeatureDef[] = [
  {
    eyebrow: 'Provisioning',
    title: 'Deploy in 60 seconds',
    body:
      'Choose your region, OS, and plan. Your server is provisioned and ready in under a minute, with cloud-init running before you finish your coffee.',
    bullets: ['12 Linux distros + Windows', 'One-click app marketplace', 'User-data / Cloud-init'],
    visual: 'deploy',
    flip: false,
  },
  {
    eyebrow: 'Observability',
    title: 'Full observability built-in',
    body:
      'Monitor CPU, RAM, disk, and network in real time. Set alerts. Integrate with your existing stack — every NetLayer server exports Prometheus metrics out of the box.',
    bullets: ['Grafana dashboards', 'Prometheus metrics', 'Zabbix monitoring'],
    visual: 'metrics',
    flip: true,
  },
  {
    eyebrow: 'Developer experience',
    title: 'API-first infrastructure',
    body:
      'Everything you can do in the dashboard, you can do via the API. RESTful endpoints, typed SDKs, a Terraform provider, and a CLI that feels like git.',
    bullets: ['RESTful API + TypeScript SDK', 'Terraform provider', 'CLI tool with autocomplete'],
    visual: 'code',
    flip: false,
  },
]

export function Features() {
  return (
    <section className="py-24 space-y-32">
      {FEATURES.map((f) => (
        <FeatureRow key={f.title} {...f} />
      ))}
    </section>
  )
}

function FeatureRow({
  eyebrow, title, body, bullets, visual, flip,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  visual: 'deploy' | 'metrics' | 'code'
  flip: boolean
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div className="relative">
          {visual === 'deploy' && <DeployVisual />}
          {visual === 'metrics' && <MetricsVisual />}
          {visual === 'code' && <CodeVisual />}
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-[#0070f3] font-semibold mb-4">{eyebrow}</div>
          <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">{title}</h3>
          <p className="mt-5 text-gray-400 text-lg leading-relaxed">{body}</p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-gray-200">
                <span className="w-5 h-5 rounded-full bg-[#0070f3]/15 text-[#00d4ff] flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ─── Visuals ────────────────────────────────────────── */

function DeployVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#0070f3]/20 via-transparent to-[#00d4ff]/20 blur-2xl rounded-2xl pointer-events-none" />
      <div className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/[0.06] px-4 py-3 flex items-center gap-2">
          <Server size={14} className="text-[#0070f3]" />
          <span className="text-xs text-gray-300">Deploy a server</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-[#00d4ff]">Step 3 of 4</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Region</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { f: '🇮🇳', n: 'Mumbai',    a: true  },
              { f: '🇩🇪', n: 'Frankfurt', a: false },
              { f: '🇺🇸', n: 'New York',  a: false },
            ].map((r) => (
              <div
                key={r.n}
                className={`px-3 py-2 rounded-md border text-xs flex items-center gap-2 ${
                  r.a
                    ? 'border-[#0070f3] bg-[#0070f3]/10 text-white'
                    : 'border-white/[0.06] text-gray-400'
                }`}
              >
                <span>{r.f}</span>
                <span>{r.n}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-wider mt-4">Plan</div>
          <div className="bg-[#111] border border-white/[0.06] rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-mono">c3.large</div>
              <div className="text-[11px] text-gray-500">4 vCPU · 8 GB · 160 GB SSD</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">₹599<span className="text-xs text-gray-500">/mo</span></div>
              <div className="text-[10px] uppercase tracking-wider text-[#00d4ff]">Popular</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="h-9 rounded-md bg-gradient-to-r from-[#0070f3] to-[#0090ff] text-white text-sm font-medium flex items-center justify-center">
              Deploy now
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricsVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#00d4ff]/15 via-transparent to-[#0070f3]/15 blur-2xl rounded-2xl pointer-events-none" />
      <div className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/[0.06] px-4 py-3 flex items-center gap-2">
          <Activity size={14} className="text-[#0070f3]" />
          <span className="text-xs text-gray-300">CPU usage · last hour</span>
          <span className="ml-auto text-[10px] text-gray-500">live</span>
        </div>
        <div className="p-4">
          {/* Mini chart */}
          <svg viewBox="0 0 400 140" className="w-full h-32">
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0070f3" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0070f3" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* gridlines */}
            {[20, 60, 100].map((y) => (
              <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            ))}
            <path
              d="M 0 90 L 30 70 L 60 80 L 90 50 L 120 60 L 150 30 L 180 45 L 210 25 L 240 60 L 270 50 L 300 75 L 330 55 L 360 70 L 400 40 L 400 140 L 0 140 Z"
              fill="url(#cpuGrad)"
            />
            <path
              d="M 0 90 L 30 70 L 60 80 L 90 50 L 120 60 L 150 30 L 180 45 L 210 25 L 240 60 L 270 50 L 300 75 L 330 55 L 360 70 L 400 40"
              stroke="#0070f3"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            {[
              { l: 'CPU',  v: '34%' },
              { l: 'RAM',  v: '62%' },
              { l: 'Disk', v: '28%' },
            ].map((m) => (
              <div key={m.l} className="border border-white/[0.06] rounded-md py-2">
                <div className="text-lg font-semibold text-white">{m.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#0070f3]/20 via-transparent to-[#00d4ff]/20 blur-2xl rounded-2xl pointer-events-none" />
      <div className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
        <div className="h-9 flex items-center px-3 gap-1.5 border-b border-white/[0.06] bg-[#111]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[11px] text-gray-500 font-mono flex items-center gap-1">
            <Code2 size={11} /> deploy.ts
          </span>
        </div>
        <pre className="p-5 text-[12.5px] leading-relaxed font-mono">
{`import { NetLayer } from '@netlayer/sdk'

const nl = new NetLayer({ apiKey: process.env.NETLAYER_KEY })

`}
          <span className="text-[#00d4ff]">const</span> server = <span className="text-[#0070f3]">await</span> nl.servers.create(&#123;{`
  region: `}<span className="text-[#a5d6ff]">'mumbai'</span>,{`
  plan: `}<span className="text-[#a5d6ff]">'c3.large'</span>,{`
  image: `}<span className="text-[#a5d6ff]">'ubuntu-22.04'</span>,{`
  sshKeys: [`}<span className="text-[#a5d6ff]">'my-key'</span>{`]
`}&#125;){`

`}<span className="text-gray-500">// → 103.21.148.92</span>{`
`}console.log(server.ipv4)
        </pre>
      </div>
    </div>
  )
}
