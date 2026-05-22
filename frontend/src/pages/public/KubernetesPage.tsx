import { Link } from 'react-router-dom'
import {
  Hexagon, Layers, Activity, GitBranch, ArrowRight, Cpu, Box, Network, Shield,
} from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { CTA } from '../../components/landing/CTA'
import { Footer } from '../../components/landing/Footer'

const FEATURES = [
  { icon: Layers,    title: 'HA control plane',   desc: '3 etcd + 3 API servers per cluster, no extra cost.', color: 'text-[#0070f3]', bg: 'bg-[#0070f3]/10' },
  { icon: Activity,  title: 'Cluster autoscaler', desc: 'Worker nodes added/removed based on pending pods.',  color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
  { icon: Box,       title: 'Node pools',         desc: 'Mix CPU/RAM/GPU pools per workload.',                color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Network,   title: 'Cilium CNI',         desc: 'eBPF-based networking with NetworkPolicy support.',  color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Shield,    title: 'Private clusters',   desc: 'Run the API server on private network only.',        color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: GitBranch, title: 'GitOps ready',       desc: 'Pre-installed cert-manager, ingress-nginx, ArgoCD opt-in.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
]

const FLAVORS = [
  { name: 'nlk8s.starter',  workers: 'up to 5 nodes',   addons: 'Standard add-ons',     priceFrom: 599,  popular: false },
  { name: 'nlk8s.pro',      workers: 'up to 50 nodes',  addons: 'Multi-AZ workers',     priceFrom: 1499, popular: true },
  { name: 'nlk8s.gpu',      workers: 'up to 20 nodes',  addons: 'NVIDIA device plugin', priceFrom: 4999, popular: false },
]

export default function KubernetesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-3xl mx-auto pt-8 pb-12">
            <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 mb-6">
              <Hexagon size={12} fill="currentColor" /> Preview · join the waitlist
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              Managed Kubernetes
              <br />
              <span className="bg-gradient-to-r from-[#0070f3] via-[#00a0ff] to-[#00d4ff] bg-clip-text text-transparent">
                without the babysitting
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-400">
              We run the control plane. You ship apps. Production-ready clusters in 4 minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register?product=k8s"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-lg text-[15px] font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff] hover:from-[#0080ff] hover:to-[#00a0ff] shadow-[0_8px_32px_rgba(0,112,243,0.4)] transition-all cursor-pointer"
              >
                Join the waitlist <ArrowRight size={16} />
              </Link>
              <Link
                to="/docs/kubernetes"
                className="inline-flex items-center gap-1 h-12 px-5 rounded-lg text-[15px] font-medium text-gray-200 hover:text-white border border-white/[0.08] hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Read the docs <ArrowRight size={14} />
              </Link>
            </div>
          </header>

          {/* Architecture diagram */}
          <section className="my-16">
            <div className="relative bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-8 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
              </div>

              <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <DiagramBlock title="Control Plane (managed)" items={['etcd × 3', 'kube-apiserver × 3', 'controller-manager', 'scheduler', 'cloud-controller-manager']} accent="text-[#0070f3]" />
                <div className="lg:flex items-center justify-center text-gray-500 hidden">
                  <ArrowRight size={32} />
                </div>
                <DiagramBlock title="Worker Pool (your VMs)" items={['kubelet', 'kube-proxy', 'Cilium agent', 'node-exporter', 'your workloads']} accent="text-[#00d4ff]" />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="my-20">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-3">
              What you get out of the box
            </h2>
            <p className="text-sm text-gray-400 text-center mb-10">
              Production-ready defaults. Override or replace any add-on with your own.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-[#111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.15] transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${f.bg} ${f.color} flex items-center justify-center mb-3`}>
                    <f.icon size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="my-20">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-3">
              Simple cluster pricing
            </h2>
            <p className="text-sm text-gray-400 text-center mb-10">
              Pay for the control plane and your worker nodes. No add-on fees.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {FLAVORS.map((f) => (
                <div
                  key={f.name}
                  className={`relative bg-[#111] border rounded-xl p-6 ${
                    f.popular ? 'border-[#0070f3] shadow-[0_0_40px_rgba(0,112,243,0.25)]' : 'border-white/[0.06]'
                  }`}
                >
                  {f.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white">
                      Most popular
                    </div>
                  )}
                  <div className="text-base font-semibold text-white font-mono">{f.name}</div>
                  <div className="mt-3 mb-3 text-xs text-gray-500">{f.workers}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-semibold text-white">₹{f.priceFrom}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-[11px] text-gray-600">control plane only · workers extra</div>
                  <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-white/[0.06]">{f.addons}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <CTA />
      </main>
      <Footer />
    </div>
  )
}

function DiagramBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="bg-[#111] border border-white/[0.08] rounded-xl p-5">
      <div className={`text-xs uppercase tracking-widest font-semibold mb-3 ${accent}`}>{title}</div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <Cpu size={12} className="text-gray-600" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  )
}
