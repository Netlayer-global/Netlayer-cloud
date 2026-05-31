import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Cpu, Database, Globe2, HardDrive, Network, Server, Layers } from 'lucide-react'

/**
 * Products — DigitalOcean-style "one platform" section. A centered section
 * header, then a clean responsive grid of rounded product cards. Each card
 * carries its own accent colour (multi-colour scheme): the icon tile, the
 * feature bullets, and the hover border/arrow all adopt that accent.
 *
 * DO aesthetic: airy spacing, rounded cards, subtle borders. VPS products,
 * original copy, theme-aware.
 */
type Accent = 'lime' | 'cyan' | 'violet' | 'pink' | 'amber' | 'blue'
type Product = {
  icon: typeof Server
  title: string
  desc: string
  points: string[]
  href: string
  accent: Accent
}

const PRODUCTS: Product[] = [
  {
    icon: Server, title: 'Cloud VPS', href: '/pricing#compute', accent: 'lime',
    desc: 'Dedicated-vCPU virtual machines that boot in about thirty seconds.',
    points: ['NVMe SSD storage', 'Live resize & snapshots', 'Per-second billing'],
  },
  {
    icon: Cpu, title: 'Bare Metal', href: '/pricing#bare', accent: 'cyan',
    desc: 'Single-tenant AMD EPYC servers with zero virtualization overhead.',
    points: ['Custom RAID', 'Full IPMI access', 'Dedicated bandwidth'],
  },
  {
    icon: Boxes, title: 'GPU Instances', href: '/pricing#gpu', accent: 'violet',
    desc: 'NVIDIA L40 / A100 / H100 for AI training, inference, and rendering.',
    points: ['On-demand provisioning', 'Hourly billing', 'NVLink options'],
  },
  {
    icon: HardDrive, title: 'Storage', href: '/pricing#storage', accent: 'amber',
    desc: 'S3-compatible object storage and high-IOPS NVMe block volumes.',
    points: ['Automated backups', 'Cross-region replication', 'Snapshots'],
  },
  {
    icon: Network, title: 'Networking', href: '/network', accent: 'blue',
    desc: 'Floating IPs, private VLANs, and load balancers over a fast backbone.',
    points: ['Hardware DDoS shield', '25 Gbps backbone', 'Anycast DNS'],
  },
  {
    icon: Database, title: 'Managed Databases', href: '/pricing#db', accent: 'pink',
    desc: 'PostgreSQL, MySQL, and Redis with automated failover and backups.',
    points: ['One-click HA', 'Daily backups', 'Connection pooling'],
  },
  {
    icon: Globe2, title: 'Kubernetes', href: '/kubernetes', accent: 'cyan',
    desc: 'Managed control plane with autoscaling node pools (preview).',
    points: ['Free control plane', 'Autoscaling', '1-click ingress'],
  },
  {
    icon: Layers, title: 'Developer API', href: '/docs#api', accent: 'violet',
    desc: 'Drive every resource from a clean REST API and Terraform provider.',
    points: ['Full REST API', 'Terraform provider', 'Webhooks'],
  },
]

const ACCENT = {
  lime:   { c: 'var(--a-lime)',   d: 'var(--a-lime-d)',   b: 'var(--a-lime-b)' },
  cyan:   { c: 'var(--a-cyan)',   d: 'var(--a-cyan-d)',   b: 'var(--a-cyan-b)' },
  violet: { c: 'var(--a-violet)', d: 'var(--a-violet-d)', b: 'var(--a-violet-b)' },
  pink:   { c: 'var(--a-pink)',   d: 'var(--a-pink-d)',   b: 'var(--a-pink-b)' },
  amber:  { c: 'var(--a-amber)',  d: 'var(--a-amber-d)',  b: 'var(--a-amber-b)' },
  blue:   { c: 'var(--a-blue)',   d: 'var(--a-blue-d)',   b: 'var(--a-blue-b)' },
} as const

export function ProductsSection() {
  return (
    <section id="products" style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,4vw,72px)' }}>
        {/* section header */}
        <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(40px,5vw,64px)' }}>
          <div className="nl-eyebrow" style={{ marginBottom: 18, color: 'var(--brand)' }}>One platform</div>
          <h2 className="nl-display" style={{ fontSize: 'clamp(30px,4.4vw,56px)', color: 'var(--t-hi)', marginBottom: 18 }}>
            Everything you need to build, scale, and ship.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--t-med)', lineHeight: 1.65 }}>
            One account, one API, one bill. From a single VPS to a fleet of GPU
            servers across fifteen regions — without stitching together a dozen
            disconnected services.
          </p>
        </div>

        {/* product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRODUCTS.map((p) => {
            const a = ACCENT[p.accent]
            return (
            <Link
              key={p.title}
              to={p.href}
              className="group flex flex-col cursor-pointer"
              style={{
                borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)',
                padding: 'clamp(24px,2.4vw,30px)', transition: 'border-color var(--ease-med), transform var(--ease-med), box-shadow var(--ease-med)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = a.b
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--b-default)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span
                className="inline-flex items-center justify-center transition-transform group-hover:-translate-y-0.5"
                style={{ width: 50, height: 50, borderRadius: 'var(--r-lg)', background: a.d, border: `1px solid ${a.b}`, marginBottom: 20 }}
              >
                <p.icon size={23} style={{ color: a.c }} />
              </span>

              <h3 className="nl-head" style={{ fontSize: 19, color: 'var(--t-hi)', marginBottom: 9 }}>{p.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.6, marginBottom: 18 }}>{p.desc}</p>

              <ul className="flex flex-col gap-2" style={{ marginBottom: 22 }}>
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2" style={{ fontSize: 12.5, color: 'var(--t-low)' }}>
                    <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: a.c }} />
                    {pt}
                  </li>
                ))}
              </ul>

              <span
                className="inline-flex items-center gap-1.5 mt-auto nl-mono"
                style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: a.c }}
              >
                Learn more
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )})}
        </div>
      </div>
    </section>
  )
}
