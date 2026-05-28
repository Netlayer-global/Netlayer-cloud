import { Link } from 'react-router-dom'
import {
  ArrowRight, Cloud, Cpu, Database, Hexagon, MonitorCog, Server,
} from 'lucide-react'
import { SectionHeader } from './SectionHeader'

/**
 * ProductsSection — 6-tile grid of platform offerings (VPS, Bare metal,
 * GPU, Kubernetes, Managed DB, Object storage). Each tile is a clickable
 * Link to its pricing/marketing destination.
 */

const PRODUCTS = [
  { Icon: Server,     title: 'Cloud VPS',      desc: 'High-performance virtual servers with dedicated vCPU and NVMe SSD storage', price: 'from ₹149/mo',   tint: 'var(--c-blue)',   bg: 'var(--c-blue-d)',   to: '/pricing#compute' },
  { Icon: Cpu,        title: 'Bare Metal',     desc: 'Dedicated single-tenant hardware. Zero overhead, maximum performance',     price: 'from ₹999/mo',   tint: 'var(--c-amber)',  bg: 'var(--c-amber-d)',  to: '/pricing#bare' },
  { Icon: MonitorCog, title: 'GPU Cloud',      desc: 'NVIDIA A100 and H100 instances for AI, ML, and rendering at scale',         price: 'from ₹1,999/mo', tint: 'var(--c-purple)', bg: 'var(--c-purple-d)', to: '/pricing#gpu',     badge: 'NEW' },
  { Icon: Hexagon,    title: 'Kubernetes',     desc: 'Managed K8s clusters with auto-scaling node pools and GitOps integration',  price: 'from ₹799/mo',   tint: 'var(--c-cyan)',   bg: 'var(--c-cyan-d)',   to: '/kubernetes',      badge: 'PREVIEW' },
  { Icon: Database,   title: 'Managed DB',     desc: 'PostgreSQL, MySQL, Redis with automated backups and instant failover',      price: 'from ₹499/mo',   tint: 'var(--c-green)',  bg: 'var(--c-green-d)',  to: '/pricing#db' },
  { Icon: Cloud,      title: 'Object Storage', desc: 'S3-compatible storage with global edge delivery and versioning',             price: '₹5/GB/mo',       tint: 'var(--c-red)',    bg: 'var(--c-red-d)',    to: '/pricing#object' },
] as const

export function ProductsSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="PLATFORM"
          title="Everything you need to build and scale"
          subtitle="One control plane for your entire cloud infrastructure"
        />

        <div
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-xl overflow-hidden"
          style={{ background: 'var(--b-default)', gap: '1px' }}
        >
          {PRODUCTS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="group cursor-pointer p-6 transition-colors"
              style={{ background: 'var(--nl-1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: p.bg }}
                >
                  <p.Icon size={16} style={{ color: p.tint }} />
                </div>
                <div className="flex items-center gap-2">
                  {'badge' in p && (
                    <span
                      className="px-1.5 h-4 inline-flex items-center text-[9px] tracking-wider rounded"
                      style={{
                        background: 'var(--brand-d)',
                        color: 'var(--brand)',
                        border: '1px solid var(--brand-b)',
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                  <ArrowRight
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--t-low)' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
              <p
                className="mt-2"
                style={{ fontSize: 11, color: 'var(--t-low)', lineHeight: 1.6 }}
              >
                {p.desc}
              </p>
              <div className="mt-3" style={{ fontSize: 11, color: 'var(--brand)' }}>
                {p.price}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
