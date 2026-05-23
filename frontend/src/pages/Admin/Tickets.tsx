import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatDate, initials, relativeTime } from '../../lib/utils'

const PRIORITY_VARIANT: Record<string, any> = {
  LOW: 'default', MEDIUM: 'pending', HIGH: 'building', URGENT: 'error', CRITICAL: 'error',
}
const STATUS_VARIANT: Record<string, any> = {
  OPEN: 'pending', IN_PROGRESS: 'building', WAITING: 'pending', RESOLVED: 'running', CLOSED: 'stopped',
}

export default function AdminTickets() {
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets', status, priority],
    queryFn: () => adminAPI.listTickets({
      status: status || undefined,
      priority: priority || undefined,
    }),
  })

  const tickets = data?.data || []

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Support tickets</h1>
        <p className="text-sm text-[#a0a09e] mt-1">{data?.pagination?.total ?? 0} total</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="WAITING">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-44">
          <option value="">All priorities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-lg" /> : tickets.length === 0 ? (
        <EmptyTable message="No tickets." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>#</TH>
              <TH>Subject</TH>
              <TH>User</TH>
              <TH>Category</TH>
              <TH>Priority</TH>
              <TH>Status</TH>
              <TH>SLA</TH>
              <TH className="text-right">Replies</TH>
              <TH>Created</TH>
              <TH>Updated</TH>
            </tr>
          </THead>
          <TBody>
            {tickets.map((t: any) => (
              <TR key={t.id}>
                <TD className="font-mono text-xs">
                  <Link to={`/admin/tickets/${t.id}`} className="hover:text-[#e0fe56]">
                    #{t.ticketNumber.slice(-6).toUpperCase()}
                  </Link>
                </TD>
                <TD>
                  <Link to={`/admin/tickets/${t.id}`} className="text-[#e8e8e6] hover:text-[#e0fe56]">
                    {t.subject}
                  </Link>
                </TD>
                <TD className="text-xs">{t.user?.email}</TD>
                <TD className="text-xs capitalize">{t.category}</TD>
                <TD><Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority.toLowerCase()}</Badge></TD>
                <TD><Badge variant={STATUS_VARIANT[t.status]}>{t.status.toLowerCase().replace('_', ' ')}</Badge></TD>
                <TD><SlaBadge sla={t.sla} /></TD>
                <TD className="text-right">{t._count?.messages ?? 0}</TD>
                <TD className="text-xs">{formatDate(t.createdAt)}</TD>
                <TD className="text-xs">{relativeTime(t.updatedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}

export function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: () => adminAPI.getTicket(id!),
    enabled: !!id,
  })

  const sendReply = useMutation({
    mutationFn: () => adminAPI.replyTicket(id!, reply, internal),
    onSuccess: () => {
      toast.success(internal ? 'Internal note added' : 'Reply sent')
      setReply('')
      setInternal(false)
      qc.invalidateQueries({ queryKey: ['admin-ticket', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const update = useMutation({
    mutationFn: (data: any) => adminAPI.updateTicket(id!, data),
    onSuccess: () => {
      toast.success('Ticket updated')
      qc.invalidateQueries({ queryKey: ['admin-ticket', id] })
    },
  })

  if (isLoading || !ticket) {
    return <div className="max-w-7xl mx-auto"><Skeleton className="h-96" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <button onClick={() => navigate('/admin/tickets')} className="flex items-center gap-1.5 text-sm text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer">
        <ArrowLeft size={14} /> Back to tickets
      </button>

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-medium text-[#e8e8e6]">{ticket.subject}</h1>
        <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{ticket.priority.toLowerCase()}</Badge>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status.toLowerCase().replace('_', ' ')}</Badge>
      </div>
      <div className="text-xs text-[#6a6a68] font-mono">#{ticket.ticketNumber}</div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Thread */}
        <div className="space-y-3">
          {ticket.messages.map((m: any) => (
            <div
              key={m.id}
              className={cn(
                'rounded-lg p-3 max-w-[85%]',
                m.isInternal && 'border border-dashed border-amber-700/60 bg-amber-950/10 ml-0',
                !m.isInternal && m.authorRole === 'admin' && 'bg-[#1e1f1e] border border-[#2a2b2a] ml-0',
                !m.isInternal && m.authorRole !== 'admin' && 'bg-blue-950/30 border border-blue-900/40 ml-auto'
              )}
            >
              <div className="text-[11px] text-[#6a6a68] mb-1.5 flex items-center gap-2">
                {m.isInternal && <span className="flex items-center gap-1 text-amber-400"><Lock size={11} /> Internal</span>}
                {m.authorRole === 'admin' ? 'Support' : ticket.user?.email}
                <span>·</span>
                <span>{relativeTime(m.createdAt)}</span>
              </div>
              <div className="text-sm text-[#e8e8e6] whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}

          <Card padding="p-4">
            <CannedPicker onPick={(content) => setReply((prev) => prev ? prev + '\n\n' + content : content)} />
            <textarea
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm h-24 focus:border-[#e0fe56] focus:outline-none resize-none"
              placeholder={internal ? 'Internal note (not visible to user)…' : 'Reply to user…'}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-[#e0fe56] cursor-pointer" />
                Internal note (admin-only)
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => update.mutate({ status: 'CLOSED' })}>Close ticket</Button>
                <Button disabled={!reply.trim()} loading={sendReply.isPending} onClick={() => sendReply.mutate()}>
                  <Send size={13} /> {internal ? 'Save note' : 'Send reply'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card padding="p-4">
            <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Customer</div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#8261fb] text-white rounded-full flex items-center justify-center text-xs">
                {initials(ticket.user.firstName, ticket.user.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#e8e8e6] truncate">{ticket.user.firstName} {ticket.user.lastName}</div>
                <div className="text-[11px] text-[#6a6a68] truncate">{ticket.user.email}</div>
              </div>
            </div>
          </Card>

          <Card padding="p-4">
            <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-3">Ticket</div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#6a6a68]">Status</label>
                <Select value={ticket.status} onChange={(e) => update.mutate({ status: e.target.value })}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="WAITING">Waiting</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#6a6a68]">Priority</label>
                <Select value={ticket.priority} onChange={(e) => update.mutate({ priority: e.target.value })}>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#6a6a68]">Category</label>
                <Select value={ticket.category} onChange={(e) => update.mutate({ category: e.target.value })}>
                  {['general', 'billing', 'technical', 'abuse', 'feature'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card padding="p-4 text-xs">
            <div className="text-[#6a6a68] uppercase tracking-wide mb-2">Timeline</div>
            <div className="space-y-1 text-[#a0a09e]">
              <div>Created: {formatDate(ticket.createdAt)}</div>
              {ticket.firstReplyAt && <div>First reply: {relativeTime(ticket.firstReplyAt)}</div>}
              {ticket.resolvedAt && <div>Resolved: {relativeTime(ticket.resolvedAt)}</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


interface SlaInfo {
  state: 'ok' | 'warning' | 'critical' | 'breached' | 'met' | 'resolved'
  msRemaining: number
  breached: boolean
}

function SlaBadge({ sla }: { sla?: SlaInfo }) {
  if (!sla) return <span className="text-[#6a6a68] text-[11px]">—</span>

  if (sla.state === 'met') {
    return <Badge variant="running">SLA met</Badge>
  }
  if (sla.state === 'resolved') {
    return <span className="text-[#6a6a68] text-[11px]">—</span>
  }
  if (sla.state === 'breached') {
    return <Badge variant="error">BREACHED</Badge>
  }

  const ms = sla.msRemaining
  const mins = Math.floor(ms / 60_000)
  const hours = Math.floor(mins / 60)
  const text = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`

  const variant = sla.state === 'critical' ? 'error' : sla.state === 'warning' ? 'building' : 'running'
  return <Badge variant={variant as any}>{text} left</Badge>
}


import { useQuery as useQuery2 } from '@tanstack/react-query'
import { cannedAPI, type CannedResponse } from '../../api/infra'
import { useState as useState2 } from 'react'
import { Sparkles } from 'lucide-react'
import { Modal as ModalC } from '../../components/ui/Modal'

function CannedPicker({ onPick }: { onPick: (content: string) => void }) {
  const [open, setOpen] = useState2(false)
  const [filter, setFilter] = useState2('')

  const { data: items = [] } = useQuery2({
    queryKey: ['canned-responses'],
    queryFn: () => cannedAPI.list().then((r) => r.data.data),
  })

  const filtered: CannedResponse[] = items.filter((c: CannedResponse) =>
    !filter || c.title.toLowerCase().includes(filter.toLowerCase()) ||
    c.content.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
      >
        <Sparkles size={12} /> Insert canned response
      </button>
      <ModalC
        open={open}
        onClose={() => setOpen(false)}
        title="Canned responses"
        description="Insert a templated response into your reply."
        size="lg"
      >
        <div className="space-y-3">
          <input
            placeholder="Search…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md h-9 px-3 text-sm focus:border-[#e0fe56] focus:outline-none"
          />
          {filtered.length === 0 ? (
            <div className="text-sm text-[#a0a09e] text-center py-6">
              No canned responses. Create some at <code>/admin/canned-responses</code>.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filtered.map((c: CannedResponse) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onPick(c.content); setOpen(false) }}
                  className="w-full text-left p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a] hover:bg-[#252625] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#e8e8e6]">{c.title}</span>
                    <span className="text-[10px] text-[#6a6a68] uppercase tracking-wider">{c.category}</span>
                  </div>
                  <p className="text-xs text-[#a0a09e] line-clamp-3 whitespace-pre-wrap">{c.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </ModalC>
    </>
  )
}
