import { useQuery } from '@tanstack/react-query'
import { catalogAPI } from '../../api/endpoints'
import type { Region } from '../../types'

/**
 * Global network (DigitalOcean style): centered section header, then a
 * clean grid of rounded region cards each with a pulsing status dot, city,
 * and "Operational". Pulls the live region list from the API and falls
 * back to a static set so the section is always populated. Theme-aware.
 */
const FALLBACK = [
  'Mumbai', 'Delhi NCR', 'Bangalore', 'Singapore', 'Tokyo',
  'Seoul', 'Sydney', 'Frankfurt', 'London', 'Paris',
  'Amsterdam', 'New York', 'Los Angeles', 'São Paulo', 'Dubai',
]

export function GlobalNetworkSection() {
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data as Region[]),
    staleTime: 5 * 60_000,
    retry: 0,
  })

  const cities = regions && regions.length > 0 ? regions.map((r) => r.city) : FALLBACK
  const count = cities.length

  return (
    <section id="network" style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(64px,9vw,110px) clamp(20px,4vw,72px)' }}>
        <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
          <div className="nl-eyebrow" style={{ marginBottom: 18, color: 'var(--brand)' }}>Global network · {count} regions</div>
          <h2 className="nl-display" style={{ fontSize: 'clamp(30px,4.4vw,56px)', color: 'var(--t-hi)', marginBottom: 18 }}>
            Deploy close to your users, everywhere.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--t-med)', lineHeight: 1.65 }}>
            We run dedicated KVM nodes in every region, so your servers get
            native-speed networking — never noisy-neighbour public infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {cities.map((r) => (
            <div
              key={r}
              className="text-center cursor-default transition-all"
              style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: '28px 20px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-b)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b-default)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span
                className="nl-status-dot block rounded-full"
                style={{ width: 7, height: 7, background: 'var(--c-green)', margin: '0 auto 12px', boxShadow: '0 0 8px var(--c-green)' }}
              />
              <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)', marginBottom: 6 }}>{r}</div>
              <div className="nl-mono" style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-green)' }}>
                Operational
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
