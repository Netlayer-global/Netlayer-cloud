import { Link } from 'react-router-dom'
import { SectionHeader } from './SectionHeader'

/**
 * MarketplaceSection — 12-app grid (WordPress, Ghost, Docker, etc.) that
 * advertises one-click install. Each card links into the customer-side
 * marketplace page with a query string preselecting the app.
 */

const APPS = [
  { name: 'WordPress',   emoji: '📝', cat: 'cms',          tint: 'var(--c-blue-d)'   },
  { name: 'Ghost',       emoji: '👻', cat: 'cms',          tint: 'var(--c-purple-d)' },
  { name: 'Nextcloud',   emoji: '☁',  cat: 'productivity', tint: 'var(--c-cyan-d)'   },
  { name: 'GitLab CE',   emoji: '🦊', cat: 'dev-tools',    tint: 'var(--c-amber-d)'  },
  { name: 'VS Code',     emoji: '💻', cat: 'dev-tools',    tint: 'var(--c-blue-d)'   },
  { name: 'Jupyter',     emoji: '📊', cat: 'data',         tint: 'var(--c-amber-d)'  },
  { name: 'Docker CE',   emoji: '🐳', cat: 'containers',   tint: 'var(--c-blue-d)'   },
  { name: 'Node.js',     emoji: '🟢', cat: 'runtime',      tint: 'var(--c-green-d)'  },
  { name: 'LAMP Stack',  emoji: '⚡', cat: 'stack',        tint: 'var(--c-amber-d)'  },
  { name: 'Minecraft',   emoji: '⛏',  cat: 'gaming',       tint: 'var(--c-green-d)'  },
  { name: 'PostgreSQL',  emoji: '🐘', cat: 'database',     tint: 'var(--c-blue-d)'   },
  { name: 'Redis',       emoji: '🔴', cat: 'cache',        tint: 'var(--c-red-d)'    },
]

export function MarketplaceSection() {
  return (
    <section
      className="py-20 px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="MARKETPLACE"
          title="One-click app deployment"
          subtitle="Deploy WordPress, Docker, GitLab, and more in under 60 seconds"
        />

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {APPS.map((a) => (
            <Link
              key={a.name}
              to={`/dashboard/marketplace?app=${a.name.toLowerCase()}`}
              className="nl-card nl-card-hover group p-4 text-center cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center text-[20px]"
                style={{ background: a.tint }}
              >
                {a.emoji}
              </div>
              <div className="mt-3" style={{ fontSize: 13, fontWeight: 500 }}>
                {a.name}
              </div>
              <div className="mt-0.5 text-[11px] capitalize" style={{ color: 'var(--t-low)' }}>
                {a.cat}
              </div>
              <div
                className="mt-3 inline-flex items-center justify-center h-7 px-3 rounded text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'var(--brand-d)',
                  color: 'var(--brand)',
                  border: '1px solid var(--brand-b)',
                }}
              >
                Deploy →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/dashboard/marketplace"
            style={{ fontSize: 13, color: 'var(--brand)' }}
          >
            View all apps →
          </Link>
        </div>
      </div>
    </section>
  )
}
