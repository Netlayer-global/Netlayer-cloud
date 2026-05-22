import { Link } from 'react-router-dom'
import { Server, Cpu, Hexagon, HardDrive, Database, Cloud, ArrowRight } from 'lucide-react'

interface Product {
  icon: any
  iconColor: string
  iconBg: string
  title: string
  desc: string
  to: string
  badge?: string
}

const PRODUCTS: Product[] = [
  {
    icon: Server,
    iconColor: 'text-[#0070f3]',
    iconBg: 'bg-[#0070f3]/10',
    title: 'Cloud Compute',
    desc: 'SSD cloud servers from ₹149/mo. Deploy in 60 seconds with full root access.',
    to: '/pricing#compute',
  },
  {
    icon: Cpu,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
    title: 'Bare Metal',
    desc: 'Dedicated hardware from ₹999/mo. No virtualization, maximum performance.',
    to: '/pricing#baremetal',
  },
  {
    icon: Hexagon,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    title: 'Kubernetes',
    desc: 'Managed K8s clusters. Auto-scaling worker nodes, one-click deploy.',
    to: '/kubernetes',
    badge: 'Preview',
  },
  {
    icon: HardDrive,
    iconColor: 'text-[#00d4ff]',
    iconBg: 'bg-[#00d4ff]/10',
    title: 'Block Storage',
    desc: 'Persistent NVMe volumes from ₹40/mo. Attach to any server, resize on demand.',
    to: '/pricing#blockstorage',
  },
  {
    icon: Database,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    title: 'Managed Databases',
    desc: 'PostgreSQL, MySQL, Redis. Automated backups, failover, monitoring.',
    to: '/pricing#databases',
  },
  {
    icon: Cloud,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Object Storage',
    desc: 'S3-compatible object storage. ₹5/GB/month, unlimited requests.',
    to: '/pricing#storage',
  },
]

export function Products() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Everything you need to build and scale
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            One unified platform, one bill, one API. From your first server to your thousandth.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="group relative bg-[#111] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-[#0070f3]/0 via-transparent to-[#00d4ff]/0 group-hover:from-[#0070f3]/10 group-hover:to-[#00d4ff]/5 transition-all pointer-events-none" />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${p.iconBg} ${p.iconColor} flex items-center justify-center`}>
                    <p.icon size={18} />
                  </div>
                  {p.badge && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
                      {p.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>

                <div className="mt-5 flex items-center text-xs text-[#0070f3] font-medium group-hover:text-[#00d4ff] transition-colors">
                  Learn more
                  <ArrowRight size={12} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
