import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  CreditCard,
  Database,
  Globe,
  HardDrive,
  Key,
  LayoutDashboard,
  Network,
  Radio,
  Rocket,
  Server as ServerIcon,
  Settings,
  Shield,
  Tag,
  Terminal as TerminalIcon,
  Camera,
  Users,
  Activity,
  BarChart,
} from 'lucide-react'
import { serverAPI } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { Server } from '../types'

/**
 * Cmd+K (Ctrl+K on Windows) global command palette.
 *
 * Categories:
 *   1. Actions  — high-intent navigation/triggers, always visible
 *   2. Navigate — every dashboard page
 *   3. Servers  — live filter against the user's servers
 *   4. Admin    — only when user role is admin-tier
 *   5. Docs     — static external links
 *
 * Keyboard: ↑/↓ navigate, Enter selects, Esc closes. Search filters across
 * all categories. Mounted once at the App level via Layout.
 */

type Item = {
  id: string
  label: string
  hint?: string
  icon: any
  to?: string
  onSelect?: () => void
  category: 'Actions' | 'Navigate' | 'Servers' | 'Admin' | 'Docs'
  keywords?: string
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING']

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role)

  // Live server list — only fetched once palette is opened.
  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data as Server[]),
    enabled: open && !!user,
    staleTime: 30_000,
  })

  // Toggle on Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      // Actions
      { id: 'a-deploy',  category: 'Actions', icon: Rocket,      label: 'Deploy a new server',       to: '/dashboard/deploy', keywords: 'create vm vps' },
      { id: 'a-credit',  category: 'Actions', icon: CreditCard,  label: 'Add credit to wallet',      to: '/dashboard/billing', keywords: 'topup money' },
      { id: 'a-ssh',     category: 'Actions', icon: Key,         label: 'Add SSH key',                to: '/dashboard/ssh-keys' },
      { id: 'a-promo',   category: 'Actions', icon: Tag,         label: 'Redeem a promo code',        to: '/dashboard/billing', keywords: 'coupon credit' },

      // Navigate
      { id: 'n-home',    category: 'Navigate', icon: LayoutDashboard, label: 'Dashboard',           to: '/dashboard/home' },
      { id: 'n-srv',     category: 'Navigate', icon: ServerIcon,      label: 'My servers',          to: '/dashboard/servers' },
      { id: 'n-bill',    category: 'Navigate', icon: CreditCard,      label: 'Billing & usage',     to: '/dashboard/billing' },
      { id: 'n-fip',     category: 'Navigate', icon: Radio,           label: 'Floating IPs',        to: '/dashboard/floating-ips' },
      { id: 'n-snap',    category: 'Navigate', icon: Camera,          label: 'Snapshots',           to: '/dashboard/snapshots' },
      { id: 'n-vol',     category: 'Navigate', icon: HardDrive,       label: 'Block volumes',       to: '/dashboard/volumes' },
      { id: 'n-obj',     category: 'Navigate', icon: Database,        label: 'Object storage',      to: '/dashboard/storage/object' },
      { id: 'n-net',     category: 'Navigate', icon: Network,         label: 'Load balancers',      to: '/dashboard/load-balancers' },
      { id: 'n-dns',     category: 'Navigate', icon: Globe,           label: 'DNS zones',           to: '/dashboard/dns' },
      { id: 'n-vpc',     category: 'Navigate', icon: Network,         label: 'VPC',                 to: '/dashboard/vpc' },
      { id: 'n-keys',    category: 'Navigate', icon: Key,             label: 'API keys',            to: '/dashboard/api-keys' },
      { id: 'n-ssh',     category: 'Navigate', icon: Shield,          label: 'SSH keys',            to: '/dashboard/ssh-keys' },
      { id: 'n-set',     category: 'Navigate', icon: Settings,        label: 'Settings',            to: '/dashboard/settings' },

      // Docs
      { id: 'd-api',     category: 'Docs',     icon: BookOpen,        label: 'API reference',       to: '/api/docs' },
      { id: 'd-cli',     category: 'Docs',     icon: TerminalIcon,    label: 'CLI guide',           to: '/docs' },
      { id: 'd-guide',   category: 'Docs',     icon: BookOpen,        label: 'Getting started',     to: '/docs' },
    ]

    if (isAdmin) {
      base.push(
        { id: 'admin-d',  category: 'Admin', icon: LayoutDashboard, label: 'Admin dashboard',     to: '/admin/dashboard' },
        { id: 'admin-u',  category: 'Admin', icon: Users,           label: 'Manage users',        to: '/admin/users' },
        { id: 'admin-s',  category: 'Admin', icon: ServerIcon,      label: 'All servers',         to: '/admin/servers' },
        { id: 'admin-c',  category: 'Admin', icon: BarChart,        label: 'Capacity planning',   to: '/admin/capacity' },
        { id: 'admin-h',  category: 'Admin', icon: Activity,        label: 'Global health',       to: '/admin/health' },
        { id: 'admin-i',  category: 'Admin', icon: Globe,           label: 'IP pools',            to: '/admin/ip-pools' },
        { id: 'admin-p',  category: 'Admin', icon: Tag,             label: 'Promo codes',         to: '/admin/promos' }
      )
    }

    for (const s of servers) {
      base.push({
        id: `srv-${s.id}`,
        category: 'Servers',
        icon: ServerIcon,
        label: s.name,
        hint: s.ipv4 || s.hostname,
        keywords: `${s.region?.city || ''} ${s.plan?.name || ''} ${s.status || ''}`,
        to: `/dashboard/servers/${s.id}`,
      })
    }

    return base
  }, [servers, isAdmin])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.keywords || '').toLowerCase().includes(q) ||
        (it.hint || '').toLowerCase().includes(q)
    )
  }, [items, query])

  // Group by category preserving Actions → Navigate → Servers → Admin → Docs order
  const grouped = useMemo(() => {
    const order: Item['category'][] = ['Actions', 'Navigate', 'Servers', 'Admin', 'Docs']
    const groups: { category: string; items: Item[] }[] = []
    for (const cat of order) {
      const list = filtered.filter((it) => it.category === cat)
      if (list.length) groups.push({ category: cat, items: list })
    }
    return groups
  }, [filtered])

  // Flat list for arrow-key navigation
  const flat = grouped.flatMap((g) => g.items)

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keyboard navigation inside the input
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      execute(flat[activeIndex])
    }
  }

  const execute = (it: Item) => {
    setOpen(false)
    if (it.onSelect) it.onSelect()
    else if (it.to) navigate(it.to)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="w-full max-w-xl bg-[#161716] border border-[#2a2b2a] rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#2a2b2a] flex items-center px-4 h-12">
              <span className="text-[#6a6a68] mr-2 text-sm">›_</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands, servers, docs…"
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#e8e8e6] font-mono placeholder-[#6a6a68]"
              />
              <kbd className="text-[10px] text-[#6a6a68] bg-[#0d0e0d] px-1.5 py-0.5 rounded border border-[#2a2b2a]">Esc</kbd>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {grouped.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#6a6a68]">
                  No matches for "{query}"
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.category} className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#6a6a68]">
                      {group.category}
                    </div>
                    <div>
                      {group.items.map((it) => {
                        const flatIdx = flat.indexOf(it)
                        const isActive = flatIdx === activeIndex
                        const Icon = it.icon
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => execute(it)}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            className={`w-full h-10 px-3 rounded-md flex items-center gap-3 text-left cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-[#1e1f1e] text-[#e8e8e6]'
                                : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="text-[13px] flex-1 truncate">{it.label}</span>
                            {it.hint && (
                              <span className="text-[11px] text-[#6a6a68] truncate max-w-[140px] font-mono">{it.hint}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#2a2b2a] px-3 py-2 flex items-center gap-3 text-[11px] text-[#6a6a68]">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
