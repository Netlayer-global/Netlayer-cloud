/**
 * Trust / integration strip (DigitalOcean style): a centered intro line
 * followed by a row of plain partner wordmarks (no copyrighted logos).
 * Muted by default, lime on hover. Theme-aware.
 */
const PARTNERS = ['Razorpay', 'Stripe', 'Cloudflare', 'AMD EPYC', 'NVIDIA', 'Proxmox', 'Ubuntu'] as const

export function PartnersSection() {
  return (
    <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container text-center" style={{ padding: 'clamp(48px,6vw,72px) clamp(20px,4vw,72px)' }}>
        <p style={{ fontSize: 14.5, color: 'var(--t-med)', maxWidth: 560, margin: '0 auto clamp(28px,4vw,40px)' }}>
          From solo developers to scaling teams, builders run on NetLayer — and the
          tools they already use plug right in.
        </p>
        <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-5">
          {PARTNERS.map((p) => (
            <span
              key={p}
              className="cursor-default whitespace-nowrap transition-colors"
              style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--t-off)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-off)')}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
