import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity as ActivityIcon, Server as ServerIcon, Database, HardDrive,
  Network, CreditCard, Shield, Key, User, Globe, Boxes,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

import { activityAPI, type ActivityEntry } from '../api/infra'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { relativeTime, formatDate } from '../lib/utils'

const ACTION_ICON: Record<string, any> = {
  server: ServerIcon,
  storage_bucket: Database,
  block_volume: HardDrive,
  load_balancer: Network,
  managed_database: Database,
  vpc: Network,
  dns_zone: Globe,
  invoice: CreditCard,
  user: User,
  ssh_key: Shield,
  api_key: Key,
  app_template: Boxes,
}

const RESOURCE_LABEL: Record<string, string> = {
  server: 'Server',
  storage_bucket: 'Bucket',
  block_volume: 'Volume',
  load_balancer: 'Load balancer',
  managed_database: 'Database',
  vpc: 'VPC',
  dns_zone: 'DNS zone',
  invoice: 'Invoice',
  user: 'Account',
  ssh_key: 'SSH key',
  api_key: 'API key',
}

export default function Activity() {
  const [page, setPage] = useState(1)
  const [resource, setResource] = useState<string>('')
  const limit = 30

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, resource],
    queryFn: () => activityAPI.list({ page, limit, resource: resource || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: summary = [] } = useQuery({
    queryKey: ['activity', 'summary'],
    queryFn: () => activityAPI.summary().then((r) => r.data.data),
  })

  const entries = data?.data ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Activity</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Audit log of every action on your account. Last 90 days.
        </p>
      </div>

      {/* Top actions summary */}
      {summary.length > 0 && (
        <Card padding="p-4">
          <div className="text-xs text-[#6a6a68] mb-3">Most common actions (last 30 days)</div>
          <div className="flex gap-2 flex-wrap">
            {summary.slice(0, 8).map((s) => (
              <span
                key={s.action}
                className="px-2.5 py-1 rounded-md bg-[#1e1f1e] border border-[#2a2b2a] text-xs"
              >
                <span className="text-[#a0a09e] mr-1.5">{s.action}</span>
                <span className="text-[#e0fe56] font-medium">{s.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={resource}
          onChange={(e) => { setResource(e.target.value); setPage(1) }}
          className="!h-9 !w-48"
        >
          <option value="">All resources</option>
          {Object.entries(RESOURCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <span className="text-xs text-[#6a6a68]">
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : entries.length === 0 ? (
        <EmptyTable message="No activity yet. Actions on your account will show up here." />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH className="w-44">When</TH>
                <TH>Action</TH>
                <TH className="hidden md:table-cell">Resource</TH>
                <TH className="hidden lg:table-cell w-40">IP / Country</TH>
              </tr>
            </THead>
            <TBody>
              {entries.map((e) => <ActivityRow key={e.id} entry={e} />)}
            </TBody>
          </Table>

          <div className="flex items-center justify-between text-xs text-[#a0a09e]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={13} /> Previous
              </Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTION_ICON[entry.resource] || ActivityIcon
  const verb = entry.action.split('.').slice(-1)[0]
  const tone =
    verb === 'delete' || verb === 'destroyed' ? 'text-red-400' :
    verb === 'create' || verb === 'created' || verb === 'add' ? 'text-emerald-400' :
    verb === 'update' || verb === 'updated' || verb === 'rotate_password' ? 'text-amber-400' :
    'text-[#a0a09e]'

  return (
    <TR>
      <TD className="text-xs">
        <div className="text-[#e8e8e6]">{relativeTime(entry.createdAt)}</div>
        <div className="text-[10px] text-[#6a6a68]">{formatDate(entry.createdAt)}</div>
      </TD>
      <TD>
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-[#a0a09e] shrink-0" />
          <code className={`text-xs font-mono ${tone}`}>{entry.action}</code>
        </div>
      </TD>
      <TD className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="!capitalize">{RESOURCE_LABEL[entry.resource] || entry.resource}</Badge>
          {entry.resourceId && (
            <code className="text-[10px] text-[#6a6a68] font-mono truncate max-w-[160px]">
              {entry.resourceId.slice(0, 12)}…
            </code>
          )}
        </div>
      </TD>
      <TD className="hidden lg:table-cell text-xs text-[#a0a09e]">
        <div className="font-mono">{entry.ipAddress || '—'}</div>
        {entry.country && <div className="text-[10px] text-[#6a6a68]">{entry.country}</div>}
      </TD>
    </TR>
  )
}
