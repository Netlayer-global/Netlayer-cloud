import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Boxes, ArrowRight, Download } from 'lucide-react'

import { marketplaceAPI, type AppTemplate } from '../api/infra'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'

/**
 * Marketplace — one-click app catalogue. Clicking Deploy navigates to the
 * deploy wizard with `?app=<slug>` so the wizard can pre-fill the OS and
 * cloud-init script.
 */
export default function Marketplace() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['marketplace', 'apps'],
    queryFn: () => marketplaceAPI.list().then((r) => r.data.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: () => marketplaceAPI.categories().then((r) => r.data.data),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((a) => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false
      if (!q) return true
      return (
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      )
    })
  }, [apps, query, activeCategory])

  const totalInCurrent = activeCategory === 'all'
    ? apps.length
    : apps.filter((a) => a.category === activeCategory).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Marketplace</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          One-click apps. Pre-configured stacks deploy in 60 seconds.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none" />
          <Input
            placeholder="Search apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-[#6a6a68] flex items-center px-2">
          {filtered.length} of {totalInCurrent}
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-[#2a2b2a] flex gap-1 overflow-x-auto">
        <CategoryTab
          label="All"
          active={activeCategory === 'all'}
          count={apps.length}
          onClick={() => setActiveCategory('all')}
        />
        {categories.map((c) => (
          <CategoryTab
            key={c.category}
            label={c.category}
            active={activeCategory === c.category}
            count={c.count}
            onClick={() => setActiveCategory(c.category)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Boxes size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No apps found</h3>
          <p className="text-sm text-[#a0a09e]">Try a different search or category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} onDeploy={() => navigate(`/dashboard/deploy?app=${app.slug}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryTab({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 h-9 text-sm cursor-pointer transition-colors -mb-px border-b-2 whitespace-nowrap capitalize',
        active
          ? 'text-[#e8e8e6] border-[#e0fe56]'
          : 'text-[#a0a09e] border-transparent hover:text-[#e8e8e6]'
      )}
    >
      {label}
      <span className="ml-2 text-[11px] text-[#6a6a68]">{count}</span>
    </button>
  )
}

function AppCard({ app, onDeploy }: { app: AppTemplate; onDeploy: () => void }) {
  return (
    <Card hover className="flex flex-col gap-3 cursor-pointer" onClick={onDeploy}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[#1e1f1e] border border-[#2a2b2a] flex items-center justify-center text-xl shrink-0">
          {app.logo || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-[#e8e8e6] truncate">{app.name}</h3>
          </div>
          <Badge variant="default" className="capitalize mt-1">{app.category}</Badge>
        </div>
      </div>
      <p className="text-xs text-[#a0a09e] line-clamp-2 flex-1">{app.description}</p>
      <div className="flex items-center justify-between text-[11px] text-[#6a6a68] pt-2 border-t border-[#2a2b2a]">
        <span className="flex items-center gap-1">
          <Download size={11} /> {app.installs.toLocaleString()} installs
        </span>
        <span className="text-[#e0fe56] flex items-center gap-1 font-medium">
          Deploy <ArrowRight size={11} />
        </span>
      </div>
      {app.ports.length > 0 && (
        <div className="text-[10px] text-[#6a6a68]">
          Ports: {app.ports.join(', ')}
        </div>
      )}
    </Card>
  )
}

// keep Button reachable for the type/lint pass even if not used directly
export const _ = Button
