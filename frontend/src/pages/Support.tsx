import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  LifeBuoy, Plus, ArrowLeft, Send, Star, CheckCircle2,
} from 'lucide-react'

import { ticketsAPI, type SupportTicket, type TicketMessage, type SlaInfo } from '../api/infra'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { cn, relativeTime, formatDate } from '../lib/utils'

const PRIORITY_VARIANT: Record<string, any> = {
  LOW: 'default', MEDIUM: 'building', HIGH: 'building', URGENT: 'error', CRITICAL: 'error',
}
const STATUS_VARIANT: Record<string, any> = {
  OPEN: 'building', IN_PROGRESS: 'building', WAITING: 'preview',
  RESOLVED: 'running', CLOSED: 'stopped',
}

const createSchema = z.object({
  subject: z.string().min(3, 'Required').max(200),
  category: z.enum(['general', 'billing', 'technical', 'abuse', 'sales']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']),
  message: z.string().min(1, 'Required').max(10_000),
})
type CreateForm = z.infer<typeof createSchema>

export default function Support() {
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) return <TicketDetail id={openId} onBack={() => setOpenId(null)} />
  return <TicketsList onOpen={setOpenId} />
}

function TicketsList({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: () => ticketsAPI.list().then((r) => r.data.data),
    refetchInterval: 30_000,
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { subject: '', category: 'general', priority: 'MEDIUM', message: '' },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) => ticketsAPI.create(v),
    onSuccess: (r) => {
      toast.success('Ticket submitted')
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] })
      setCreateOpen(false)
      form.reset()
      onOpen(r.data.data.id)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Support</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Get help from our team. Most tickets are answered within 2 hours.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New ticket
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : tickets.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <LifeBuoy size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No tickets yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">Need help? Open a ticket and we'll get back to you.</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> New ticket
          </Button>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Subject</TH>
              <TH className="hidden sm:table-cell">Category</TH>
              <TH>Priority</TH>
              <TH>Status</TH>
              <TH className="hidden md:table-cell">Updated</TH>
            </tr>
          </THead>
          <TBody>
            {tickets.map((t) => (
              <TR key={t.id} className="cursor-pointer" onClick={() => onOpen(t.id)}>
                <TD className="text-[#e8e8e6]">
                  <div className="font-medium">{t.subject}</div>
                  <div className="text-[10px] text-[#6a6a68] font-mono mt-0.5">
                    #{t.ticketNumber.slice(-6).toUpperCase()}
                  </div>
                </TD>
                <TD className="hidden sm:table-cell text-xs capitalize">{t.category}</TD>
                <TD><Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority.toLowerCase()}</Badge></TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={STATUS_VARIANT[t.status]}>{t.status.toLowerCase().replace('_', ' ')}</Badge>
                    {t.sla?.breached && <Badge variant="error">SLA</Badge>}
                  </div>
                </TD>
                <TD className="hidden md:table-cell text-xs">{relativeTime(t.updatedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="New ticket"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>Submit</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <Input label="Subject" placeholder="What's happening?" error={form.formState.errors.subject?.message} {...form.register('subject')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" {...form.register('category')}>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="abuse">Abuse</option>
              <option value="sales">Sales</option>
            </Select>
            <Select label="Priority" {...form.register('priority')}>
              <option value="LOW">Low — answered in 48h</option>
              <option value="MEDIUM">Medium — answered in 24h</option>
              <option value="HIGH">High — answered in 8h</option>
              <option value="URGENT">Urgent — answered in 2h</option>
              <option value="CRITICAL">Critical — answered in 1h</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Message</label>
            <textarea
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm min-h-[140px] focus:border-[#e0fe56] focus:outline-none resize-none"
              placeholder="Describe your issue with as much detail as possible…"
              {...form.register('message')}
            />
            {form.formState.errors.message && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.message.message}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}

function TicketDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [reply, setReply] = useState('')

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support', 'ticket', id],
    queryFn: () => ticketsAPI.get(id).then((r) => r.data.data),
    refetchInterval: 15_000,
  })

  const send = useMutation({
    mutationFn: () => ticketsAPI.reply(id, reply),
    onSuccess: () => {
      setReply('')
      qc.invalidateQueries({ queryKey: ['support', 'ticket', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const close = useMutation({
    mutationFn: () => ticketsAPI.close(id),
    onSuccess: () => {
      toast.success('Ticket closed')
      qc.invalidateQueries({ queryKey: ['support', 'ticket', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const rate = useMutation({
    mutationFn: (rating: number) => ticketsAPI.rate(id, rating),
    onSuccess: () => {
      toast.success('Thanks for the feedback!')
      qc.invalidateQueries({ queryKey: ['support', 'ticket', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading || !ticket) {
    return <div className="max-w-5xl mx-auto"><Skeleton className="h-64 rounded-lg" /></div>
  }

  const messages: TicketMessage[] = ticket.messages || []
  const isClosed = ['CLOSED', 'RESOLVED'].includes(ticket.status)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <code className="text-[11px] text-[#6a6a68] font-mono">#{ticket.ticketNumber.slice(-6).toUpperCase()}</code>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{ticket.priority.toLowerCase()}</Badge>
            <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status.toLowerCase().replace('_', ' ')}</Badge>
            <SlaPill sla={ticket.sla} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'rounded-lg p-3 max-w-[85%]',
              m.authorRole === 'admin'
                ? 'bg-[#1e1f1e] border border-[#2a2b2a] mr-auto'
                : 'bg-blue-950/30 border border-blue-900/40 ml-auto'
            )}
          >
            <div className="text-[11px] text-[#6a6a68] mb-1.5">
              {m.authorRole === 'admin' ? 'NetLayer Support' : 'You'}
              <span className="mx-1">·</span>
              <span>{relativeTime(m.createdAt)}</span>
            </div>
            <div className="text-sm text-[#e8e8e6] whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
      </div>

      {ticket.status === 'RESOLVED' && !ticket.rating && (
        <Card padding="p-4" className="border-emerald-900/30 bg-emerald-950/10">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-[#e8e8e6]">How did we do?</h3>
              <p className="text-xs text-[#a0a09e] mb-3">Rate your support experience.</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => rate.mutate(n)}
                    className="text-[#6a6a68] hover:text-amber-400 cursor-pointer p-1 transition-colors"
                  >
                    <Star size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {ticket.status !== 'CLOSED' && (
        <Card padding="p-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm min-h-[100px] focus:border-[#e0fe56] focus:outline-none resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            {!isClosed && (
              <Button variant="secondary" onClick={() => {
                if (confirm('Close this ticket?')) close.mutate()
              }}>Close ticket</Button>
            )}
            <Button disabled={!reply.trim()} loading={send.isPending} onClick={() => send.mutate()}>
              <Send size={13} /> Send reply
            </Button>
          </div>
        </Card>
      )}

      <div className="text-xs text-[#6a6a68]">
        Created {formatDate(ticket.createdAt)}
        {ticket.firstReplyAt && <> · First reply {relativeTime(ticket.firstReplyAt)}</>}
      </div>
    </div>
  )
}

function SlaPill({ sla }: { sla?: SlaInfo }) {
  if (!sla || sla.state === 'resolved') return null
  if (sla.state === 'met') return <Badge variant="running">SLA met</Badge>
  if (sla.state === 'breached') return <Badge variant="error">SLA breached</Badge>
  const ms = sla.msRemaining
  const mins = Math.floor(ms / 60_000)
  const hours = Math.floor(mins / 60)
  const text = hours > 0 ? `${hours}h ${mins % 60}m left` : `${mins}m left`
  const v = sla.state === 'critical' ? 'error' : sla.state === 'warning' ? 'building' : 'running'
  return <Badge variant={v as any}>{text}</Badge>
}
