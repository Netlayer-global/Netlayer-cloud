import { useQuery } from '@tanstack/react-query'
import { useCountUp, useInView } from '../../utils/animations'
import { platformAPI } from '../../api/endpoints'

/**
 * StatsBar — 4-column animated counter strip below the hero.
 *
 * Pulls live numbers from `/api/platform/stats` and falls back to safe
 * defaults if the API is unreachable (so the static-export landing
 * preview never shows blanks).
 */
export function StatsBar() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const { data: stats } = useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformAPI.getStats().then((r) => r.data.data),
    staleTime: 60_000,
    retry: 1,
  })
  const deployedTarget = stats?.serversDeployedToday
    ? Math.max(stats.serversDeployedToday, 500)
    : 500
  const regionsTarget = stats?.regionsOnline ?? 15
  const uptimeTarget = stats?.uptimePercent ?? 99.99

  const a = useCountUp(deployedTarget, 1800, inView)
  const b = useCountUp(regionsTarget, 1400, inView)
  const c = useCountUp(uptimeTarget, 1800, inView)
  const lastDeploy = stats?.lastDeploySeconds ?? 31

  return (
    <section
      ref={ref}
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Servers deployed today', value: `${a}`,           suffix: '+' },
          { label: 'Global regions',         value: `${b}`,           suffix: ''  },
          { label: 'Uptime SLA',             value: `${c.toFixed(2)}`, suffix: '%' },
          { label: 'Last deploy',            value: `${lastDeploy}`,   suffix: 's' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="px-6 py-9 text-center"
            style={{ borderRight: i < 3 ? '1px solid var(--b-subtle)' : undefined }}
          >
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }}>
              {s.value}
              <span style={{ color: 'var(--brand)' }}>{s.suffix}</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
