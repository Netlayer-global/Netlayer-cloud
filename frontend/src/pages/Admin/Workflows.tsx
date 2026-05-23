import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  GitBranch, RefreshCw, X, ChevronLeft, ChevronRight, ArrowLeft,
  CheckCircle2, AlertCircle, Clock, Activity,
} from 'lucide-react'

import { adminAPI } from '../../api/admin'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, relativeTime, formatDate } from '../../lib/utils'

const STATUS_TINT: Record<string, string> = {
  succeeded: 'running',
  running: 'building',
  pending: 'pending',
  failed: 'error',
  compensating: 'building',
  compensated: 'stopped',
}

interface WorkflowStep {
  name: string
  status: string
  startedAt?: string
  finishedAt?: string
  error?: string
  output?: any
}

interface WorkflowRun {
  id: string
  type: string
  resourceId: string
  status: string
  currentStep: string | null
  context: any
  steps: WorkflowStep[]
  startedAt: string
  finishedAt: string | null
  error: string | null
}

export default function AdminWorkflows() {
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) return <WorkflowDetail id={openId} onBack={() => setOpenId(null)} />
  return <WorkflowsList onOpen={setOpenId} />
}

function WorkflowsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 30

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'workflows', page, statusFilter],
    queryFn: () => adminAPI.listWorkflows({ page, limit, status: statusFilter || undefined }),
    refetchInterval: 5000,
    placeholderData: (prev) => prev,
  })

  const rows: WorkflowRun[] = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Workflows</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Long-running background jobs (deploys, migrations, etc.) with persisted state and retry support.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="!h-9 !w-44"
        >
          <option value="">All statuses</option>
          <option value="running">Running</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="compensating">Compensating</option>
          <option value="compensated">Compensated</option>
        </Select>
        <span className="text-xs text-[#6a6a68]">{total} {total === 1 ? 'run' : 'runs'}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyTable message="No workflow runs yet." />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Resource</TH>
                <TH>Current step</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Started</TH>
                <TH className="hidden lg:table-cell">Duration</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((w) => (
                <TR key={w.id} className="cursor-pointer" onClick={() => onOpen(w.id)}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <GitBranch size={13} className="text-[#a0a09e]" />
                      <span className="text-[#e8e8e6] font-medium font-mono text-xs">{w.type}</span>
                    </div>
                  </TD>
                  <TD>
                    <code className="text-[11px] text-[#a0a09e]">{w.resourceId.slice(0, 16)}…</code>
                  </TD>
                  <TD className="text-xs">{w.currentStep || '—'}</TD>
                  <TD>
                    <Badge variant={(STATUS_TINT[w.status] || 'default') as any}>{w.status}</Badge>
                  </TD>
                  <TD className="hidden md:table-cell text-xs">{relativeTime(w.startedAt)}</TD>
                  <TD className="hidden lg:table-cell text-xs">
                    {w.finishedAt
                      ? formatDuration(new Date(w.startedAt).getTime(), new Date(w.finishedAt).getTime())
                      : <span className="text-[#a0a09e]">in progress</span>}
                  </TD>
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
    </div>
  )
}

function WorkflowDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()

  const { data: wf, isLoading } = useQuery({
    queryKey: ['admin', 'workflow', id],
    queryFn: () => adminAPI.getWorkflow(id) as Promise<WorkflowRun>,
    refetchInterval: 3000,
  })

  const retry = useMutation({
    mutationFn: () => adminAPI.retryWorkflow(id),
    onSuccess: () => {
      toast.success('Retry started')
      qc.invalidateQueries({ queryKey: ['admin', 'workflow', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const cancel = useMutation({
    mutationFn: () => adminAPI.cancelWorkflow(id),
    onSuccess: () => {
      toast.success('Cancellation requested')
      qc.invalidateQueries({ queryKey: ['admin', 'workflow', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading || !wf) {
    return <div className="max-w-6xl mx-auto"><Skeleton className="h-64 rounded-lg" /></div>
  }

  const isFailed = wf.status === 'failed'
  const isTerminal = ['succeeded', 'failed', 'compensated'].includes(wf.status)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-medium text-[#e8e8e6] font-mono truncate">{wf.type}</h1>
            <Badge variant={(STATUS_TINT[wf.status] || 'default') as any}>{wf.status}</Badge>
          </div>
          <code className="text-xs text-[#6a6a68]">id: {wf.id}</code>
        </div>
        {isFailed && (
          <Button size="sm" loading={retry.isPending} onClick={() => retry.mutate()}>
            <RefreshCw size={13} /> Retry
          </Button>
        )}
        {!isTerminal && (
          <Button size="sm" variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            <X size={13} /> Cancel
          </Button>
        )}
      </div>

      {wf.error && (
        <Card padding="p-4" className="border-red-900/40 bg-red-950/10">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-red-400 font-medium">Error</div>
              <pre className="text-xs text-[#e8e8e6] mt-1 whitespace-pre-wrap break-words">{wf.error}</pre>
            </div>
          </div>
        </Card>
      )}

      <Card padding="p-4">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Steps</h3>
        <div className="space-y-2">
          {wf.steps.length === 0 ? (
            <div className="text-xs text-[#6a6a68]">No steps recorded.</div>
          ) : wf.steps.map((s, idx) => (
            <StepRow key={`${s.name}-${idx}`} step={s} idx={idx} />
          ))}
        </div>
      </Card>

      <Card padding="p-4">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-2">Context</h3>
        <pre className="text-xs text-[#a0a09e] bg-[#0d0e0d] border border-[#2a2b2a] rounded p-3 overflow-x-auto">
          {JSON.stringify(wf.context, null, 2)}
        </pre>
      </Card>
    </div>
  )
}

function StepRow({ step, idx }: { step: WorkflowStep; idx: number }) {
  const Icon =
    step.status === 'succeeded' ? CheckCircle2 :
    step.status === 'failed'    ? AlertCircle :
    step.status === 'running'   ? Activity :
    Clock
  const color =
    step.status === 'succeeded' ? 'text-emerald-400' :
    step.status === 'failed'    ? 'text-red-400' :
    step.status === 'running'   ? 'text-amber-400' :
    'text-[#6a6a68]'

  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
      <Icon
        size={14}
        className={cn(
          color,
          'shrink-0 mt-0.5',
          step.status === 'running' && 'animate-pulse'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#6a6a68] text-[10px] font-mono">{String(idx + 1).padStart(2, '0')}</span>
          <span className="text-sm text-[#e8e8e6] font-medium">{step.name}</span>
          <span className={`text-[11px] font-mono ${color}`}>{step.status}</span>
        </div>
        {step.error && (
          <div className="mt-1 text-[11px] text-red-400 font-mono break-all">{step.error}</div>
        )}
        {(step.startedAt || step.finishedAt) && (
          <div className="mt-1 text-[10px] text-[#6a6a68]">
            {step.startedAt && `Started: ${formatDate(step.startedAt)}`}
            {step.finishedAt && ` · Finished: ${formatDate(step.finishedAt)}`}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDuration(start: number, end: number) {
  const ms = end - start
  if (ms < 1000) return `${ms} ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}
