/**
 * Partner / integration wordmark bar — sits under the hero ticker like
 * VAULTEX's logo row. A mono label on the left, plain wordmarks on the
 * right (no copyrighted logos). Lime hover. Theme-aware.
 */
const PARTNERS = ['Razorpay', 'Stripe', 'Cloudflare', 'AMD EPYC', 'NVIDIA', 'Proxmox'] as const

export function PartnersSection() {
  return (
    <div
      className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12"
      style={{
        padding: '28px clamp(20px,5vw,52px)',
        borderBottom: '1px solid var(--b-subtle)',
        background: 'var(--nl-0)',
      }}
    >
      <span
        className="nl-mono shrink-0"
        style={{ fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--t-off)' }}
      >
        Built to integrate with
      </span>
      <div className="flex items-center justify-between flex-wrap gap-x-10 gap-y-4 flex-1">
        {PARTNERS.map((p) => (
          <span
            key={p}
            className="cursor-default whitespace-nowrap transition-colors"
            style={{ fontSize: 15, fontWeight: 600, letterSpacing: '.01em', color: 'var(--t-low)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
