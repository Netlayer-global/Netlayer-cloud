import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, ChevronRight } from 'lucide-react'
import { adminAPI } from '../../api/admin'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { cn, relativeTime } from '../../lib/utils'

export default function AuditLogs() {
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', userId, action, resource, from, to],
    queryFn: () =>
      adminAPI.auditLogs({
        userId: userId || undefined,
        action: action || undefined,
        resource: resource || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  const logs = data?.data || []

  const exportCsv = () => {
    const rows = [
      ['Time', 'User', 'Action', 'Resource', 'Resource ID', 'IP'],
      ...logs.map((l: any) => [
        new Date(l.createdAt).toISOString(),
        l.user?.email || 'system',
        l.action,
        l.resource,
        l.resourceId || '',
        l.ipAddress || '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Audit logs</h1>
          <p className="text-sm text-[#a0a09e] mt-1">{data?.pagination?.total ?? 0} entries</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}><Download size={13} /> Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none" />
          <Input className="pl-8" placeholder="User id…" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <Input placeholder="action contains…" value={action} onChange={(e) => setAction(e.target.value)} className="max-w-xs" />
        <Select value={resource} onChange={(e) => setResource(e.target.value)} className="w-44">
          <option value="">All resources</option>
          {['user', 'server', 'invoice', 'node', 'role'].map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : logs.length === 0 ? (
        <EmptyTable message="No matching audit logs." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-8"></TH>
              <TH>Time</TH>
              <TH>User</TH>
              <TH>Action</TH>
              <TH>Resource</TH>
              <TH>Resource ID</TH>
              <TH>IP</TH>
            </tr>
          </THead>
          <TBody>
            {logs.map((log: any) => {
              const hasDetails = !!(log.oldValue || log.newValue || log.metadata)
              return (
                <>
                  <TR
                    key={log.id}
                    className={hasDetails ? 'cursor-pointer' : ''}
                    onClick={() => hasDetails && setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <TD className="text-center">
                      {hasDetails && (
                        <ChevronRight
                          size={14}
                          className={cn('inline transition-transform text-[#6a6a68]', expanded === log.id && 'rotate-90')}
                        />
                      )}
                    </TD>
                    <TD className="text-xs text-[#a0a09e]">{relativeTime(log.createdAt)}</TD>
                    <TD className="text-xs">{log.user?.email || <span className="text-[#6a6a68]">system</span>}</TD>
                    <TD>
                      <code className="text-[11px] text-[#e0fe56] bg-[#1e1f1e] px-1.5 py-0.5 rounded">
                        {log.action}
                      </code>
                    </TD>
                    <TD className="text-xs">{log.resource}</TD>
                    <TD className="text-[10px] font-mono text-[#6a6a68]">{log.resourceId?.slice(-12) || '—'}</TD>
                    <TD className="text-[11px] font-mono">{log.ipAddress || '—'}</TD>
                  </TR>
                  {expanded === log.id && hasDetails && (
                    <TR key={log.id + '-exp'} className="bg-[#0d0e0d]">
                      <TD colSpan={7}>
                        <div className="grid grid-cols-2 gap-3 p-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-red-400 mb-1.5">Old value</div>
                            <pre className="bg-red-950/10 border border-red-900/30 rounded-md p-3 text-[11px] text-[#a0a09e] overflow-x-auto">
                              {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : '—'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-green-400 mb-1.5">New value</div>
                            <pre className="bg-green-950/10 border border-green-900/30 rounded-md p-3 text-[11px] text-[#a0a09e] overflow-x-auto">
                              {log.newValue ? JSON.stringify(log.newValue, null, 2) : '—'}
                            </pre>
                          </div>
                        </div>
                      </TD>
                    </TR>
                  )}
                </>
              )
            })}
          </TBody>
        </Table>
      )}
    </div>
  )
}
