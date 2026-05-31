import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Hexagon, Zap, Globe2, GitBranch, Cpu, Wand2 } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import { waitlistAPI } from '../../api/endpoints'
import { useSeo } from '../../hooks/useSeo'

const FEATURES = [
  { Icon: Wand2,     title: 'Fully managed control plane', desc: 'We run etcd, the API server, and upgrades — you focus on workloads.', accent: 'var(--a-lime)' },
  { Icon: Zap,       title: 'Auto-scaling node pools',     desc: 'Scale based on pending pods or HPA targets, with safe drains.',       accent: 'var(--a-cyan)' },
  { Icon: Globe2,    title: 'Multi-region clusters',       desc: 'Spread the data plane across regions for HA without a service mesh.', accent: 'var(--a-violet)' },
  { Icon: GitBranch, title: 'GitOps-friendly',             desc: 'ArgoCD/Flux integrations work out of the box.',                       accent: 'var(--a-blue)' },
  { Icon: Cpu,       title: 'GPU node pools',              desc: 'Spin up A100 or H100 pools on demand for ML workloads.',              accent: 'var(--a-lime)' },
  { Icon: Hexagon,   title: 'One-click clusters',          desc: 'A working cluster in 90 seconds, kubeconfig in your inbox.',          accent: 'var(--a-cyan)' },
]

const PLANS = [
  { name: 'Starter',    desc: '3-node, 8 vCPU each',            price: '₹2,499/mo' },
  { name: 'Production', desc: '5-node, 16 vCPU each, multi-AZ', price: '₹9,999/mo' },
]

export default function KubernetesPage() {
  useSeo({
    title: 'Managed Kubernetes',
    description: 'Production-grade managed Kubernetes across 15 regions. Auto-scaling node pools, GPU pools, CSI storage, and load balancers wired in by default.',
    path: '/kubernetes',
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Preview"
        title="Managed Kubernetes,"
        accent="without the operations."
        subtitle="Production-grade clusters across 15 regions. Multi-tenant or isolated. CSI block storage, load balancers, and GPU pools wired in by default."
      />

      {/* Features grid */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 24 }}>
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + f.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + f.accent + ' 28%, transparent)', marginBottom: 16 }}
                >
                  <f.Icon size={20} style={{ color: f.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)', marginBottom: 7 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(28px,4vw,40px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>Pricing preview</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(26px,3.5vw,44px)', color: 'var(--t-hi)', marginBottom: 14 }}>Two ways to start</h2>
            <p style={{ fontSize: 15, color: 'var(--t-med)' }}>
              Final pricing locked at GA. Waitlist members get 30% off the first 6 months.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4" style={{ maxWidth: 720, margin: '0 auto' }}>
            {PLANS.map((p) => (
              <div key={p.name} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(28px,3vw,36px)' }}>
                <div className="nl-mono" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}>{p.name}</div>
                <div className="nl-display" style={{ marginTop: 10, fontSize: 30, color: 'var(--t-hi)' }}>{p.price}</div>
                <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--t-med)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Waitlist />
      <LandingFooter />
    </div>
  )
}

function Waitlist() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = useMutation({
    mutationFn: () => waitlistAPI.join(email, 'kubernetes', 'kubernetes-page'),
    onSuccess: () => { setDone(true); setError(null); setEmail('') },
    onError: (e: any) => setError(e.response?.data?.error || 'Could not join'),
  })

  return (
    <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
        <div
          className="relative overflow-hidden text-center"
          style={{ maxWidth: 640, margin: '0 auto', borderRadius: 'var(--r-2xl)', padding: 'clamp(40px,5vw,60px)', background: 'var(--nl-2)', border: '1px solid var(--a-violet-b)' }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '160%', background: 'radial-gradient(ellipse at 50% 40%, var(--a-violet-d) 0%, transparent 62%)', filter: 'blur(50px)' }}
          />
          <div className="relative">
            <h3 className="nl-display" style={{ fontSize: 'clamp(24px,3vw,34px)', color: 'var(--t-hi)', marginBottom: 12 }}>Join the waitlist</h3>
            <p style={{ fontSize: 15, color: 'var(--t-med)', maxWidth: 420, margin: '0 auto 24px' }}>
              We're letting customers in gradually. Drop your email and we'll send your access link.
            </p>
            {!done ? (
              <form
                onSubmit={(e) => { e.preventDefault(); if (email) join.mutate() }}
                className="flex flex-col sm:flex-row gap-2"
                style={{ maxWidth: 440, margin: '0 auto' }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 px-3.5 outline-none"
                  style={{ height: 46, borderRadius: 'var(--r-md)', background: 'var(--nl-1)', border: '1px solid var(--b-strong)', color: 'var(--t-hi)', fontSize: 14 }}
                />
                <button type="submit" disabled={join.isPending || !email} className="nl-btn-primary" style={join.isPending ? { opacity: 0.6 } : undefined}>
                  {join.isPending ? 'Joining…' : 'Join waitlist'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--c-green)' }}>You're on the list. We'll email you at launch.</p>
            )}
            {error && <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--c-red)' }}>{error}</p>}
            <div style={{ marginTop: 24 }}>
              <Link to="/docs" style={{ fontSize: 13, color: 'var(--brand)' }}>Or browse our K8s docs →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
