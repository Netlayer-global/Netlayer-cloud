import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Server, Cpu, Hexagon, HardDrive, Database, Network, Sparkles, Zap,
} from 'lucide-react'

interface Product {
  icon: any
  title: string
  desc: string
  price: string
  to: string
  badge?: string
  gradient: string
}

const PRODUCTS: Product[] = [
  {
    icon: Server,    title: 'Cloud VPS',
    desc: 'Virtualised servers with NVMe on every plan. Snapshot-ready, live-migratable.',
    price: 'from ₹199/mo',
    to: '/pricing#compute',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
  },
  {
    icon: Cpu,       title: 'Bare Metal',
    desc: 'Dedicated AMD EPYC and Intel Xeon hosts. No noisy neighbours, no virtualisation tax.',
    price: 'from ₹999/mo',
    to: '/pricing#baremetal',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
  },
  {
    icon: Sparkles,  title: 'GPU Cloud',
    desc: 'On-demand A100 and H100 instances for training, inference, and rendering.',
    price: 'from ₹1,999/mo',
    to: '/pricing#gpu',
    badge: 'NEW',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
  },
  {
    icon: Hexagon,   title: 'Kubernetes',
    desc: 'Managed K8s with autoscaling, integrated load balancers, and zero ops overhead.',
    price: 'from ₹799/mo',
    to: '/kubernetes',
    badge: 'PREVIEW',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
  },
  {
    icon: HardDrive, title: 'Block Storage',
    desc: 'Persistent NVMe volumes you can attach to any server in the same region.',
    price: '₹4 / GB / mo',
    to: '/pricing#blockstorage',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  {
    icon: Database,  title: 'Managed DB',
    desc: 'PostgreSQL, MySQL, and Redis with automated backups, patching, and failover.',
    price: 'from ₹499/mo',
    to: '/pricing#databases',
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
  },
  {
    icon: Network,   title: 'Load Balancers',
    desc: 'HTTP/HTTPS/TCP load balancers with auto health-checks and target groups.',
    price: 'from ₹299/mo',
    to: '/pricing#lb',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
  {
    icon: Zap,       title: 'Object Storage',
    desc: 'S3-compatible buckets with presigned URLs, public/private access, no egress fees.',
    price: '₹0.40 / GB',
    to: '/pricing#storage',
    gradient: 'from-pink-500/20 via-pink-500/5 to-transparent',
  },
]

export function ProductsV2() {
  return (
    <section className="py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl"
      >
        <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--nl-brand-2)] mb-4">
          The full stack
        </p>
        <h2 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] nl-gradient-text">
          One platform.
          <br />
          Every primitive.
        </h2>
        <p className="mt-6 text-[17px] text-[var(--nl-text-soft)] leading-[1.55]">
          Run your entire stack on NetLayer — from a single server to a multi-region Kubernetes deployment with managed databases.
        </p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRODUCTS.map((p, i) => (
          <ProductCard key={p.title} product={p} index={i} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product: p, index }: { product: Product; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={p.to}
        className="group relative block h-full nl-glass rounded-xl p-6 hover:border-[var(--nl-border-strong)] transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Hover gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="w-10 h-10 rounded-lg nl-glass flex items-center justify-center">
              <p.icon size={17} className="text-[var(--nl-brand-2)]" />
            </div>
            {p.badge && (
              <span className="px-2 h-5 inline-flex items-center rounded-full text-[10px] font-medium tracking-wider bg-[var(--nl-brand)]/15 text-[var(--nl-brand-2)] border border-[var(--nl-brand)]/30">
                {p.badge}
              </span>
            )}
          </div>

          <h3 className="text-[16px] font-semibold text-white tracking-tight">{p.title}</h3>
          <p className="mt-2 text-[13.5px] text-[var(--nl-text-muted)] leading-[1.55] min-h-[60px]">
            {p.desc}
          </p>

          <div className="mt-6 flex items-center justify-between text-[12.5px]">
            <span className="text-white nl-mono">{p.price}</span>
            <span className="text-[var(--nl-text-muted)] group-hover:text-[var(--nl-brand-2)] group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
