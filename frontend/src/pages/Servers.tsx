import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, MoreHorizontal, Power, RotateCcw, Trash2, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import { serverAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { cn, relativeTime, copyToClipboard } from '../lib/utils'
import type { Server, ServerStatus } from '../types'

const statusToBadge = (status: ServerStatus) => {
  const map: Record<ServerStatus, any> = {
    RUNNING: 'running',
    STOPPED: 'stopped',
    BUILDING: 'building',
    PENDING: 'pending',
    ERROR: 'error',
    DELETING: 'pending',
    REBOOTING: 'building',
    DELETED: 'stopped',
  }
  return map[status]
}

type Filter = 'all' | 'running' | 'stopped' | 'building'

export default function Servers() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Server | null>(null)

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
  })

  const power = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) =>
      serverAPI.power(id, action),
    onSuccess: () => {
      toast.success('Power action sent')
      qc.invalidateQueries({ queryKey: ['servers'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => serverAPI.delete(id),
    onSuccess: () => {
      toast.success('Server deleted')
      qc.invalidateQueries({ queryKey: ['servers'] })
      setConfirmDelete(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const filtered = servers
    .filter((s) => s.status !== 'DELETED')
    .filter((s) => {
      if (filter === 'all') return true
      if (filter === 'running') return s.status === 'RUNNING'
      if (filter === 'stopped') return s.status === 'STOPPED'
      if (filter === 'building') return ['BUILDING', 'PENDING', 'REBOOTING'].includes(s.status)
      return true
    })
    .filter((s) =>
      search.trim() === ''
        ? true
        : [s.name, s.hostname, s.ipv4 || ''].some((v) =>
            v.toLowerCase().includes(search.toLowerCase())
          )
    )

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: servers.filter((s) => s.status !== 'DELETED').length },
    { key: 'running', label: 'Running', count: servers.filter((s) => s.status === 'RUNNING').length },
    { key: 'stopped', label: 'Stopped', count: servers.filter((s) => s.status === 'STOPPED').length },
    {
      key: 'building',
      label: 'Building',
      count: servers.filter((s) => ['BUILDING', 'PENDING', 'REBOOTING'].includes(s.status)).length,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Servers</h1>
          <p className="text-sm text-[#a0a09e] mt-1">Manage your infrastructure.</p>
        </div>
        <Link to="/dashboard/deploy">
          <Button>
            <Plus size={14} /> Deploy server
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'h-7 px-3 text-xs rounded cursor-pointer transition-colors flex items-center gap-1.5',
                filter === t.key
                  ? 'bg-[#252625] text-[#e8e8e6]'
                  : 'text-[#a0a09e] hover:text-[#e8e8e6]'
              )}
            >
              {t.label}
              <span className="text-[10px] text-[#6a6a68]">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search servers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyTable
          message={
            search || filter !== 'all'
              ? 'No servers match your filters.'
              : 'No servers yet. Deploy your first server to get started.'
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>IP</TH>
              <TH>Location</TH>
              <TH>Plan</TH>
              <TH>OS</TH>
              <TH>Status</TH>
              <TH className="text-right">Created</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((s) => (
              <TR
                key={s.id}
                className="cursor-pointer"
                onClick={() => navigate(`/dashboard/servers/${s.id}`)}
              >
                <TD>
                  <div className="text-[#e8e8e6] font-medium">{s.name}</div>
                  <div className="text-xs text-[#6a6a68]">{s.hostname}</div>
                </TD>
                <TD>
                  {s.ipv4 ? (
                    <button
                      className="font-mono text-xs hover:text-[#e8e8e6] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(s.ipv4!)
                        toast.success('IP copied')
                      }}
                    >
                      {s.ipv4}
                    </button>
                  ) : (
                    <span className="text-[#6a6a68] text-xs">Pending</span>
                  )}
                </TD>
                <TD>{s.region.flag} {s.region.city}</TD>
                <TD>{s.plan.name}</TD>
                <TD className="text-xs">{s.osTemplate.name}</TD>
                <TD>
                  <Badge variant={statusToBadge(s.status)} showDot>
                    {s.status.toLowerCase()}
                  </Badge>
                </TD>
                <TD className="text-right text-xs">{relativeTime(s.createdAt)}</TD>
                <TD className="text-right relative">
                  <button
                    className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded hover:bg-[#252625]"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenu(openMenu === s.id ? null : s.id)
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenu === s.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenu(null) }} />
                      <div
                        className="absolute right-2 top-full mt-1 bg-[#161716] border border-[#2a2b2a] rounded-md shadow-lg z-20 w-44 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuItem
                          icon={Terminal}
                          label="Open console"
                          onClick={() => {
                            navigate(`/dashboard/servers/${s.id}`)
                            setOpenMenu(null)
                          }}
                        />
                        {s.status === 'RUNNING' ? (
                          <MenuItem
                            icon={Power}
                            label="Stop"
                            onClick={() => {
                              power.mutate({ id: s.id, action: 'stop' })
                              setOpenMenu(null)
                            }}
                          />
                        ) : (
                          <MenuItem
                            icon={Power}
                            label="Start"
                            onClick={() => {
                              power.mutate({ id: s.id, action: 'start' })
                              setOpenMenu(null)
                            }}
                          />
                        )}
                        <MenuItem
                          icon={RotateCcw}
                          label="Restart"
                          onClick={() => {
                            power.mutate({ id: s.id, action: 'restart' })
                            setOpenMenu(null)
                          }}
                        />
                        <div className="border-t border-[#2a2b2a] my-1" />
                        <MenuItem
                          icon={Trash2}
                          label="Delete"
                          danger
                          onClick={() => {
                            setConfirmDelete(s)
                            setOpenMenu(null)
                          }}
                        />
                      </div>
                    </>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Delete modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete server"
        description={`This will permanently delete "${confirmDelete?.name}". This action cannot be undone.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={del.isPending}
              onClick={() => confirmDelete && del.mutate(confirmDelete.id)}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="bg-red-950/20 border border-red-900/40 rounded-md p-3 text-sm text-red-300">
          All data on this server will be lost. Make sure you have backups.
        </div>
      </Modal>
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: any
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-950/30'
          : 'text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625]'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
