/**
 * SectionHeader — shared eyebrow / title / subtitle for landing sections.
 * Used by Products, Performance, Network, Developer, Marketplace, Trust.
 */
export function SectionHeader({
  tag,
  title,
  subtitle,
  align = 'center',
}: {
  tag: string
  title: string
  subtitle: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : ''}>
      <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
        {tag}
      </div>
      <h2
        style={{
          fontSize: 'clamp(28px, 4vw, 32px)',
          fontWeight: 600,
          letterSpacing: '-.02em',
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      <p className="mt-4" style={{ fontSize: 15, color: 'var(--t-med)' }}>
        {subtitle}
      </p>
    </div>
  )
}
