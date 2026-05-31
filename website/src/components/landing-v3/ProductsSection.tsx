import { Link } from 'react-router-dom'
import { ArrowUpRight, Boxes, Cpu, Database, HardDrive, Network, Server } from 'lucide-react'

/**
 * Products — premium bento grid. A large featured "Cloud VPS" tile (with a
 * lime spotlight glow + mini spec readout) anchors the layout, surrounded by
 * smaller product tiles. Each tile lifts on hover, reveals a ↗ arrow, and
 * shows a lime icon chip. Clash Display titles, mono tags. VPS content,
 * lime palette, theme-aware.
 *
 * Distinct from the prior flat hairline grid: asymmetric bento sizing, soft
 * rounded cards with elevation + spotlight rather than 1px cells.
 */
type Product = {
  icon: typeof Server
  tags: string[]
  title: string
  desc: string
  href: string
  span?: boolean
}

const FEATURED = {
  icon: Server,
  tags: ['KVM', 'NVMe SSD', 'Per-second'],
  title: 'Cloud VPS',
  desc: 'Dedicated vCPU and NVMe SSD virtual machines that boot in about thirty seconds. Resize live, snapshot anytime, and pay only for the seconds you run.',
  href: '/pricing#compute',
  specs: [
    { k: 'vCPU', v: '1 – 64' },
    { k: 'RAM', v: '1 – 256 GB' },
    { k: 'NVMe', v: 'up to 4 TB' },
    { k: 'Boot', v: '~30 sec' },
  ],
}

const PRODUCTS: Product[] = [
  { icon: Cpu, tags: ['EPYC', 'IPMI'], title: 'Bare Metal',
    desc: 'Single-tenant AMD EPYC servers with zero virtualization overhead and custom RAID.', href: '/pricing#bare' },
  { icon: Boxes, tags: ['A100', 'H100'], title: 'GPU Instances',
    desc: 'NVIDIA L40 / A100 / H100 for AI training, inference, and rendering — billed hourly.', href: '/pricing#gpu' },
  { icon: HardDrive, tags: ['S3', 'Block'], title: 'Storage',
    desc: 'S3-compatible object storage and NVMe block volumes with snapshots and replication.', href: '/pricing#storage' },
  { icon: Network, tags: ['Anycast', 'DDoS'], title: 'Networking',
    desc: 'Floating IPs, private VLANs, load balancers, and hardware DDoS over a 25 Gbps backbone.', href: '/network' },
]

const MANAGED: Product = {
  icon: Database, tags: ['Postgres', 'Redis', 'REST API'], title: 'Managed Databases & More',
  desc: 'PostgreSQL, MySQL, and Redis with automated failover — plus DNS, Kubernetes (preview), and a full developer API.',
  href: '/pricing#db', span: true,
}

const cardBase: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--r-xl)',
  border: '1px solid var(--b-default)',
  background: 'var(--nl-2)',
  transition: 'border-color var(--ease-med), transform var(--ease-med), background var(--ease-med)',
}

function hover(on: boolean) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.borderColor = on ? 'var(--brand-b)' : 'var(--b-default)'
    e.currentTarget.style.background = on ? 'var(--nl-3)' : 'var(--nl-2)'
    e.currentTarget.style.transform = on ? 'translateY(-3px)' : 'translateY(0)'
  }
}

function IconChip({ Icon }: { Icon: typeof Server }) {
  return (
    <span
      className="inline-flex items-center justify-center transition-transform group-hover:-translate-y-0.5"
      style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
    >
      <Icon size={21} style={{ color: 'var(--brand)' }} />
    </span>
  )
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map((t) => (
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
  )
}

function HoverArrow() {
  return (
    <ArrowUpRight
      size={20}
      className="opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all shrink-0"
      style={{ color: 'var(--brand)' }}
    />
  )
}

export function ProductsSection() {
  return (
    <section id="products" style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
      <div style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,5vw,52px) 0' }}>
        {/* intro */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6" style={{ marginBottom: 'clamp(36px,5vw,56px)' }}>
          <div>
            <div className="nl-eyebrow" style={{ marginBottom: 22 }}>What we run · 06 products</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(32px,5vw,64px)', color: 'var(--t-hi)', maxWidth: 680 }}>
              Infrastructure built for teams that{' '}
              <span style={{ color: 'var(--brand)' }}>don't compromise.</span>
            </h2>
          </div>
          <Link
            to="/pricing"
            className="nl-mono inline-flex items-center gap-2 shrink-0 transition-colors"
            style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-med)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
          >
            Compare all plans <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* bento grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        style={{ padding: '0 clamp(20px,5vw,52px) clamp(64px,9vw,100px)' }}
      >
        {/* featured — spans 2 cols + 2 rows on desktop */}
        <Link
          to={FEATURED.href}
          className="group lg:col-span-2 lg:row-span-2 cursor-pointer"
          style={{ ...cardBase, padding: 'clamp(32px,4vw,48px)' }}
          onMouseEnter={hover(true)}
          onMouseLeave={hover(false)}
        >
          {/* spotlight glow */}
          <div
            aria-hidden
            className="absolute pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              top: '-30%', right: '-10%', width: '60%', height: '90%',
              background: 'radial-gradient(ellipse at 60% 40%, rgba(200,241,53,.18) 0%, transparent 66%)',
              filter: 'blur(40px)',
            }}
          />
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between" style={{ marginBottom: 28 }}>
              <IconChip Icon={FEATURED.icon} />
              <HoverArrow />
            </div>
            <div className="nl-mono" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--brand)', marginBottom: 14 }}>
              MOST POPULAR · 01
            </div>
            <h3 className="nl-display" style={{ fontSize: 'clamp(30px,3.4vw,46px)', color: 'var(--t-hi)', marginBottom: 14 }}>
              {FEATURED.title}
            </h3>
            <p style={{ fontSize: 15, color: 'var(--t-med)', lineHeight: 1.75, maxWidth: 440, marginBottom: 28 }}>
              {FEATURED.desc}
            </p>

            {/* spec readout */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-auto"
              style={{ background: 'var(--b-subtle)', border: '1px solid var(--b-subtle)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}
            >
              {FEATURED.specs.map((s) => (
                <div key={s.k} style={{ background: 'var(--nl-1)', padding: '16px 18px' }}>
                  <div className="nl-mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--t-low)', marginBottom: 6 }}>
                    {s.k}
                  </div>
                  <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)' }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* small product tiles */}
        {PRODUCTS.map((p, i) => (
          <Link
            key={p.title}
            to={p.href}
            className="group cursor-pointer"
            style={{ ...cardBase, padding: 'clamp(26px,3vw,32px)' }}
            onMouseEnter={hover(true)}
            onMouseLeave={hover(false)}
          >
            <div className="flex items-start justify-between" style={{ marginBottom: 22 }}>
              <IconChip Icon={p.icon} />
              <div className="flex items-center gap-3">
                <span className="nl-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--t-off)' }}>
                  0{i + 2}
                </span>
                <HoverArrow />
              </div>
            </div>
            <h3 className="nl-head" style={{ fontSize: 21, color: 'var(--t-hi)', marginBottom: 10 }}>{p.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--t-med)', lineHeight: 1.7, marginBottom: 18 }}>{p.desc}</p>
            <TagRow tags={p.tags} />
          </Link>
        ))}

        {/* wide managed-db tile */}
        <Link
          to={MANAGED.href}
          className="group lg:col-span-3 cursor-pointer"
          style={{ ...cardBase, padding: 'clamp(28px,3.2vw,40px)' }}
          onMouseEnter={hover(true)}
          onMouseLeave={hover(false)}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <IconChip Icon={MANAGED.icon} />
            <div className="flex-1">
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <h3 className="nl-head" style={{ fontSize: 22, color: 'var(--t-hi)' }}>{MANAGED.title}</h3>
                <span className="nl-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--t-off)' }}>06</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.7, maxWidth: 620 }}>{MANAGED.desc}</p>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <TagRow tags={MANAGED.tags} />
              <HoverArrow />
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
