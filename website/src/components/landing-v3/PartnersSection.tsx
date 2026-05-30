/**
 * Partner / integration wordmark bar — sits directly under the hero like
 * Fireblox's logo row. Plain wordmarks (no copyrighted logos). Lime hover.
 */
const PARTNERS = [
  'Razorpay',
  'Stripe',
  'Cloudflare',
  'AMD EPYC',
  'NVIDIA',
  'Proxmox',
] as const

export function PartnersSection() {
  return (
    <div
      className="flex items-center justify-between flex-wrap gap-y-4"
      style={{
        padding: '26px clamp(20px,5vw,52px)',
        borderTop: '1px solid var(--b-subtle)',
        background: 'var(--nl-0)',
      }}
    >
      {PARTNERS.map((p) => (
        <span
          key={p}
          className="cursor-default whitespace-nowrap transition-colors"
          style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '.03em',
            color: 'var(--t-low)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
        >
          {p}
        </span>
      ))}
    </div>
  )
}
