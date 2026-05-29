/**
 * Tech-stack / partner logos strip. Plain wordmarks (no copyrighted logos)
 * arranged in a single row that wraps gracefully. Clarifies "what we
 * integrate with" without infringing on any vendor's trademark.
 */
const PARTNERS = [
  'AMD EPYC',
  'NVIDIA',
  'Cloudflare',
  'Razorpay',
  'Stripe',
  'MinIO',
  'Prometheus',
  'Grafana',
  'Loki',
  'Jaeger',
  'Terraform',
  'Kubernetes',
] as const

export function PartnersSection() {
  return (
    <section
      className="py-12 lg:py-16"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p
          className="text-center text-[10.5px] uppercase tracking-[0.22em] mb-6"
          style={{ color: 'var(--t-low)' }}
        >
          Built on hardware + software you trust
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {PARTNERS.map((p) => (
            <span
              key={p}
              className="text-[13px] tracking-[0.05em] transition-opacity"
              style={{ color: 'var(--t-low)', fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-med)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
