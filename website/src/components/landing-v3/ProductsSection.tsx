import { Link } from 'react-router-dom'
import { ArrowUpRight, Boxes, Cpu, Database, HardDrive, Network, Server } from 'lucide-react'

/**
 * "What we run" — numbered hairline product cards (VAULTEX layout):
 * a "01 / 06" counter, a lime icon that lifts on hover, mono tag chips,
 * a Bricolage title, and a hover ↗ arrow that slides in. VPS products.
 *
 * Differs from VAULTEX: lime accent, VPS products, original copy, and a
 * left-aligned serif intro heading block above the grid.
 */
type Card = {
  num: string
  icon: typeof Server
  tags: string[]
  title: string
  desc: string
  href: string
}

const CARDS: Card[] = [
  { num: '01', icon: Server, tags: ['KVM', 'NVMe', 'Per-second'], title: 'Cloud VPS',
    desc: 'Dedicated vCPU and NVMe SSD virtual machines that boot in ~30 seconds. Resize live, snapshot anytime, pay by the second.', href: '/pricing#compute' },
  { num: '02', icon: Cpu, tags: ['EPYC', 'RAID', 'IPMI'], title: 'Bare Metal',
    desc: 'Single-tenant AMD EPYC servers with zero virtualization overhead, custom RAID, and full out-of-band IPMI access.', href: '/pricing#bare' },
  { num: '03', icon: Boxes, tags: ['L40', 'A100', 'H100'], title: 'GPU Instances',
    desc: 'NVIDIA L40 / A100 / H100 instances for AI training, inference, and rendering — provisioned on demand, billed hourly.', href: '/pricing#gpu' },
  { num: '04', icon: HardDrive, tags: ['S3', 'Block', 'Backups'], title: 'Storage',
    desc: 'S3-compatible object storage and NVMe block volumes with snapshots, cross-region replication, and automated backups.', href: '/pricing#storage' },
  { num: '05', icon: Network, tags: ['Anycast', 'DDoS', 'VLAN'], title: 'Networking',
    desc: 'Floating IPs, private VLANs, load balancers, and hardware DDoS protection across a 25 Gbps backbone.', href: '/network' },
  { num: '06', icon: Database, tags: ['Postgres', 'Redis', 'API'], title: 'Managed DB & More',
    desc: 'PostgreSQL, MySQL, and Redis with automated failover — plus DNS, Kubernetes (preview), and a full REST API.', href: '/pricing#db' },
]

export function ProductsSection() {
  return (
    <section id="products" style={{ background: 'var(--nl-0)' }}>
      {/* intro */}
      <div style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,5vw,52px) 0', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-eyebrow" style={{ marginBottom: 24 }}>What we run · 06 products</div>
        <h2
          className="nl-display"
          style={{ fontSize: 'clamp(32px,5vw,68px)', color: 'var(--t-hi)', maxWidth: 720 }}
        >
          Infrastructure built for teams that{' '}
          <span className="nl-stroke-brand" style={{ fontStyle: 'italic' }}>don't compromise.</span>
        </h2>
      </div>

      {/* grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 nl-grid-surface"
        style={{ marginTop: 'clamp(44px,6vw,72px)', borderTop: '1px solid var(--b-subtle)', borderBottom: '1px solid var(--b-subtle)' }}
      >
        {CARDS.map((c) => (
          <Link
            key={c.num}
            to={c.href}
            className="nl-cell group relative overflow-hidden cursor-pointer"
            style={{ padding: 'clamp(40px,5vw,54px) clamp(32px,4vw,46px)', transition: 'background var(--ease-med)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-0)')}
          >
            {/* lime top border on hover */}
            <span
              aria-hidden
              className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ height: 2, background: 'linear-gradient(90deg, var(--brand), transparent)' }}
            />

            {/* counter + hover arrow */}
            <div className="flex items-start justify-between" style={{ marginBottom: 30 }}>
              <span className="nl-mono" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--t-off)' }}>
                {c.num} / 06
              </span>
              <ArrowUpRight
                size={20}
                className="opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"
                style={{ color: 'var(--brand)' }}
              />
            </div>

            {/* icon */}
            <span
              className="inline-flex items-center justify-center transition-transform group-hover:-translate-y-1"
              style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                background: 'var(--brand-d)', border: '1px solid var(--brand-b)', marginBottom: 24,
              }}
            >
              <c.icon size={22} style={{ color: 'var(--brand)' }} />
            </span>

            <div className="flex gap-2 flex-wrap" style={{ marginBottom: 18 }}>
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="nl-mono"
                  style={{
                    fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 'var(--r-full)',
                    border: '1px solid var(--b-strong)', color: 'var(--t-med)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              className="nl-head"
              style={{ fontSize: 23, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 13 }}
            >
              {c.title}
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.75 }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
