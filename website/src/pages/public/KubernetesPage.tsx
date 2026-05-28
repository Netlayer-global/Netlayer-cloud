import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Hexagon, Zap, Globe2, GitBranch, Cpu, Wand2 } from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'
import { waitlistAPI } from '../../api/endpoints'

const FEATURES = [
  { Icon: Wand2,     title: 'Fully managed control plane', desc: 'We run etcd, the API server, and upgrades — you focus on workloads.' },
  { Icon: Zap,       title: 'Auto-scaling node pools',     desc: 'Scale based on pending pods or HPA targets, with safe drains.' },
  { Icon: Globe2,    title: 'Multi-region clusters',       desc: 'Spread the data plane across regions for HA without a service mesh.' },
  { Icon: GitBranch, title: 'GitOps-friendly',             desc: 'ArgoCD/Flux integrations work out of the box.' },
  { Icon: Cpu,       title: 'GPU node pools',              desc: 'Spin up A100 or H100 pools on demand for ML workloads.' },
  { Icon: Hexagon,   title: 'One-click clusters',          desc: 'A working cluster in 90 seconds, kubeconfig in your inbox.' },
]

const PLANS = [
  { name: 'Starter',     desc: '3-node, 8 vCPU each', price: '₹2,499/mo' },
  { name: 'Production',  desc: '5-node, 16 vCPU each, multi-AZ', price: '₹9,999/mo' },
]

export default function KubernetesPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{ border: '1px solid var(--c-purple)', background: 'var(--c-purple-d)', color: 'var(--c-purple)' }}
          >
            Preview
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            Managed Kubernetes,<br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, #a8e620 60%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              without the operations
            </span>
          </h1>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            Production-grade clusters across 15 regions. Multi-tenant or isolated.
            CSI block storage, load balancers, and GPU pools wired in by default.
          </p>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="nl-card p-5">
              <f.Icon size={18} style={{ color: 'var(--brand)' }} />
              <div className="mt-3 text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{f.title}</div>
              <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--t-med)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Pricing preview</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Two ways to start</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--t-med)' }}>
            Final pricing locked at GA. Waitlist members get 30% off the first 6 months.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANS.map((p) => (
            <div key={p.name} className="nl-card p-6">
              <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>{p.name}</div>
              <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--t-hi)' }}>{p.price}</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--t-med)' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
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
    <section className="py-16 px-4 sm:px-6">
      <div
        className="max-w-2xl mx-auto rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, var(--c-purple-d), transparent)',
          border: '1px solid var(--c-purple)',
        }}
      >
        <h3 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--t-hi)' }}>
          Join the waitlist
        </h3>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--t-med)' }}>
          We're letting customers in gradually. Drop your email and we'll send your access link.
        </p>
        {!done ? (
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) join.mutate() }}
            className="mt-5 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 h-10 px-3 rounded-md text-sm"
              style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', color: 'var(--t-hi)' }}
            />
            <button
              type="submit"
              disabled={join.isPending || !email}
              className="nl-btn-primary"
              style={join.isPending ? { opacity: 0.6 } : undefined}
            >
              {join.isPending ? 'Joining…' : 'Join waitlist'}
            </button>
          </form>
        ) : (
          <p className="mt-5 text-sm" style={{ color: 'var(--c-green)' }}>
            You're on the list. We'll email you at launch.
          </p>
        )}
        {error && <p className="mt-3 text-xs" style={{ color: 'var(--c-red)' }}>{error}</p>}
        <div className="mt-6">
          <Link to="/docs" className="text-xs" style={{ color: 'var(--brand)' }}>
            Or browse our K8s docs →
          </Link>
        </div>
      </div>
    </section>
  )
}
