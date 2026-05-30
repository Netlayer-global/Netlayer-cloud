import { Link } from 'react-router-dom'

/**
 * "What we deliver" — numbered hairline feature cards (Fireblox layout),
 * lime top-border on hover, tag chips, VPS product copy.
 *
 * Differs from Fireblox: lime hover accent (not red), VPS products, and a
 * left-aligned intro heading block above the grid.
 */
type Card = {
  num: string
  tags: string[]
  title: string
  desc: string
  href: string
}

const CARDS: Card[] = [
  { num: '01', tags: ['KVM', 'NVMe', 'Per-second'], title: 'Cloud VPS',
    desc: 'Dedicated vCPU and NVMe SSD virtual machines that boot in ~30 seconds. Resize live, snapshot anytime, pay by the second.', href: '/pricing#compute' },
  { num: '02', tags: ['EPYC', 'RAID', 'IPMI'], title: 'Bare Metal',
    desc: 'Single-tenant AMD EPYC servers with zero virtualization overhead, custom RAID, and full out-of-band IPMI access.', href: '/pricing#bare' },
  { num: '03', tags: ['L40', 'A100', 'H100'], title: 'GPU Instances',
    desc: 'NVIDIA L40 / A100 / H100 instances for AI training, inference, and rendering — provisioned on demand, billed hourly.', href: '/pricing#gpu' },
  { num: '04', tags: ['S3', 'Block', 'Backups'], title: 'Storage',
    desc: 'S3-compatible object storage and NVMe block volumes with snapshots, cross-region replication, and automated backups.', href: '/pricing#storage' },
  { num: '05', tags: ['Anycast', 'DDoS', 'VLAN'], title: 'Networking',
    desc: 'Floating IPs, private VLANs, load balancers, and hardware DDoS protection across a 25 Gbps backbone.', href: '/network' },
  { num: '06', tags: ['EVM', 'GSTR-1', 'API'], title: 'Managed DB & More',
    desc: 'PostgreSQL, MySQL, and Redis with automated failover — plus DNS, Kubernetes (preview), and a full REST API.', href: '/pricing#db' },
]

export function ProductsSection() {
  return (
    <section id="products" style={{ background: 'var(--nl-0)' }}>
      {/* intro */}
      <div style={{ padding: 'clamp(60px,9vw,100px) clamp(20px,5vw,52px) 0', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-eyebrow" style={{ marginBottom: 20 }}>What we run</div>
        <h2
          className="nl-head"
          style={{ fontSize: 'clamp(28px,4vw,52px)', color: 'var(--t-hi)', maxWidth: 560 }}
        >
          Infrastructure built for teams that don't compromise.
        </h2>
      </div>

      {/* grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 nl-grid-surface"
        style={{ marginTop: 'clamp(40px,6vw,64px)', borderTop: '1px solid var(--b-subtle)' }}
      >
        {CARDS.map((c) => (
          <Link
            key={c.num}
            to={c.href}
            className="nl-cell group relative overflow-hidden cursor-pointer"
            style={{ padding: 'clamp(40px,5vw,52px) clamp(32px,4vw,46px)', transition: 'background .3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nl-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nl-0)')}
          >
            {/* lime top border on hover */}
            <span
              aria-hidden
              className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ height: 2, background: 'linear-gradient(90deg, var(--brand), transparent)' }}
            />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: 'var(--t-off)', marginBottom: 28 }}>
              {c.num}
            </div>
            <div className="flex gap-2 flex-wrap" style={{ marginBottom: 20 }}>
              {c.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                    padding: '4px 10px', border: '1px solid var(--b-strong)', color: 'var(--t-med)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              className="nl-head"
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 13, letterSpacing: '.06em' }}
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
