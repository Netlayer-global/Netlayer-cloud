import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ShieldAlert, Server as ServerIcon, ChevronLeft, ChevronRight,
  AlertCircle, Ban, CheckCircle2, XCircle, Mail, MapPin,
} from 'lucide-react'

import { adminAPI } from '../../api/admin'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatDate, relativeTime } from '../../lib/utils'

interface AbuseReport {
  id: string
  serverId: string | null
  userId: string | null
  reporterIp: string
  reporterEmail: string | null
  type: string
  description: string
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  server?: { id: string; name: string; ipv4: string | null; userId: string } | null
  user?: { id: string; email: string; firstName: string; lastName: string; status: string } | null
}

const TYPE_TINT: Record<string, string> = {
  spam: 'text-[#f0a429]',
  ddos: 'text-[#f26666]',
  phishing: 'text-[#f26666]',
  bruteforce: 'text-[#f0a429]',
  ratelimit: 'text-[#a0a09e]',
  other: 'text-[#a0a09e]',
}

const STATUS_TINT: Record<string, any> = {
  open: 'error',
  investigating: 'building',
  resolved: 'running',
  dismissed: 'stopped',
}

export default function AdminAbuse() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [openReport, setOpenReport] = useState<AbuseReport | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'abuse', page, statusFilter],
    queryFn: () => adminAPI.listAbuseReports({ page, status: statusFilter || undefined }) as Promise<{
      data: AbuseReport[]
      pagination: { page: number; limit: number; total: number }
    }>,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminAPI.updateAbuseReport(id, { status }),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin', 'abuse'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const suspend = useMutation({
    mutationFn: (id: string) => adminAPI.suspendServerForAbuse(id),
    onSuccess: () => {
      toast.success('Server suspended and report resolved')
      qc.invalidateQueries({ queryKey: ['admin', 'abuse'] })
      setOpenReport(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const reports = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Abuse reports</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          External abuse reports submitted via the public form. Review, suspend offending servers, and resolve.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="!h-9 !w-44"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </Select>
        <span className="text-xs text-[#6a6a68]">{total} {total === 1 ? 'report' : 'reports'}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : reports.length === 0 ? (
        <EmptyTable message="No abuse reports match this filter." />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Server / User</TH>
                <TH>Reporter</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Received</TH>
              </tr>
            </THead>
            <TBody>
              {reports.map((r) => (
                <TR key={r.id} className="cursor-pointer" onClick={() => setOpenReport(r)}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={13} className={TYPE_TINT[r.type] || 'text-[#a0a09e]'} />
                      <span className="text-[#e8e8e6] font-medium capitalize">{r.type}</span>
                    </div>
                  </TD>
                  <TD>
                    {r.server ? (
                      <div className="flex flex-col">
                        <span className="text-[#e8e8e6] text-xs flex items-center gap-1">
                          <ServerIcon size={11} className="text-[#a0a09e]" /> {r.server.name}
                        </span>
                        <code className="text-[10px] text-[#6a6a68]">{r.server.ipv4 || '—'}</code>
                      </div>
                    ) : (
                      <span className="text-[#6a6a68] text-xs">—</span>
                    )}
                  </TD>
                  <TD className="text-xs">
                    <div className="font-mono text-[#a0a09e]">{r.reporterIp}</div>
                    {r.reporterEmail && <div className="text-[10px] text-[#6a6a68] truncate">{r.reporterEmail}</div>}
                  </TD>
                  <TD>
                    <Badge variant={STATUS_TINT[r.status]} className="!capitalize">{r.status}</Badge>
                  </TD>
                  <TD className="hidden md:table-cell text-xs">{relativeTime(r.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <div className="flex items-center justify-between text-xs text-[#a0a09e]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={13} /> Prev
              </Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!openReport}
        onClose={() => setOpenReport(null)}
        title={openReport ? `${openReport.type[0].toUpperCase()}${openReport.type.slice(1)} report` : 'Abuse report'}
        size="xl"
        footer={
          openReport && (
            <>
              <Button variant="secondary" onClick={() => setOpenReport(null)}>Close</Button>
              {openReport.status !== 'dismissed' && (
                <Button
                  variant="ghost"
                  onClick={() => updateStatus.mutate({ id: openReport.id, status: 'dismissed' })}
                >
                  <XCircle size={13} /> Dismiss
                </Button>
              )}
              {openReport.status !== 'investigating' && openReport.status !== 'resolved' && (
                <Button
                  variant="ghost"
                  onClick={() => updateStatus.mutate({ id: openReport.id, status: 'investigating' })}
                >
                  Mark investigating
                </Button>
              )}
              {openReport.status !== 'resolved' && (
                <Button
                  onClick={() => updateStatus.mutate({ id: openReport.id, status: 'resolved' })}
                >
                  <CheckCircle2 size={13} /> Resolve
                </Button>
              )}
              {openReport.serverId && openReport.status !== 'resolved' && (
                <Button
                  variant="danger"
                  loading={suspend.isPending}
                  onClick={() => {
                    if (confirm(`Suspend server ${openReport.server?.name}? This will stop the VM and resolve the report.`)) {
                      suspend.mutate(openReport.id)
                    }
                  }}
                >
                  <Ban size={13} /> Suspend server
                </Button>
              )}
            </>
          )
        }
      >
        {openReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_TINT[openReport.status]} className="!capitalize">{openReport.status}</Badge>
              <span className="text-xs text-[#6a6a68]">{formatDate(openReport.createdAt)}</span>
            </div>

            <div>
              <div className="text-xs text-[#6a6a68] mb-1">Description</div>
              <Card padding="p-3" className="bg-[#0d0e0d]">
                <p className="text-sm text-[#e8e8e6] whitespace-pre-wrap">{openReport.description}</p>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[#6a6a68] mb-1">Reporter</div>
                <div className="text-sm text-[#e8e8e6] flex items-center gap-1.5">
                  <MapPin size={11} className="text-[#a0a09e]" />
                  <code className="font-mono">{openReport.reporterIp}</code>
                </div>
                {openReport.reporterEmail && (
                  <div className="text-sm text-[#a0a09e] flex items-center gap-1.5 mt-1">
                    <Mail size={11} />
                    {openReport.reporterEmail}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-[#6a6a68] mb-1">Reported server</div>
                {openReport.server ? (
                  <>
                    <div className="text-sm text-[#e8e8e6]">{openReport.server.name}</div>
                    <code className="text-xs text-[#6a6a68]">{openReport.server.ipv4 || '—'}</code>
                  </>
                ) : (
                  <div className="text-sm text-[#6a6a68]">No server linked</div>
                )}
              </div>
            </div>

            {openReport.user && (
              <div>
                <div className="text-xs text-[#6a6a68] mb-1">Owner</div>
                <Card padding="p-3">
                  <div className="text-sm text-[#e8e8e6]">
                    {openReport.user.firstName} {openReport.user.lastName}
                  </div>
                  <div className="text-xs text-[#a0a09e]">{openReport.user.email}</div>
                  <div className="text-xs mt-1">
                    <Badge variant={openReport.user.status === 'ACTIVE' ? 'running' : 'error'}>
                      {openReport.user.status}
                    </Badge>
                  </div>
                </Card>
              </div>
            )}

            {openReport.resolvedAt && (
              <div className={cn(
                'text-xs p-3 rounded-md border',
                'bg-emerald-950/10 border-emerald-900/30 text-emerald-400'
              )}>
                Resolved {formatDate(openReport.resolvedAt)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// Suppress unused-import lint
export const _ = ShieldAlert
