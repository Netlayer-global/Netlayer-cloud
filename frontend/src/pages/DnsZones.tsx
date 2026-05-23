import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Globe, Plus, Trash2, ArrowLeft, Copy, Check } from 'lucide-react'

import { dnsAPI, type DnsZone, type DnsRecord } from '../api/infra'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { copyToClipboard, relativeTime } from '../lib/utils'

const TYPES_WITH_PRIORITY = new Set(['MX', 'SRV'])

const recordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']),
  name: z.string().min(1, 'Required').max(255),
  content: z.string().min(1, 'Required').max(2048),
  ttl: z.number().int().min(60).max(86400),
  priority: z.number().int().min(0).max(65535).optional(),
})
type RecordForm = z.infer<typeof recordSchema>

const recordTypeColor: Record<string, string> = {
  A: 'text-[#4a9eff]',
  AAAA: 'text-[#22d3ee]',
  CNAME: 'text-[#8b6fff]',
  MX: 'text-[#f0a429]',
  TXT: 'text-[#a8a8a6]',
  NS: 'text-[#3dd68c]',
  SRV: 'text-[#f26666]',
  CAA: 'text-[#e0fe56]',
}

export default function DnsZones() {
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) return <ZoneDetail id={openId} onBack={() => setOpenId(null)} />
  return <ZonesList onOpen={setOpenId} />
}

function ZonesList({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [domain, setDomain] = useState('')

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['dns', 'zones'],
    queryFn: () => dnsAPI.listZones().then((r) => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => dnsAPI.createZone(domain.toLowerCase().trim()),
    onSuccess: () => {
      toast.success('Zone created')
      qc.invalidateQueries({ queryKey: ['dns', 'zones'] })
      setCreateOpen(false)
      setDomain('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => dnsAPI.deleteZone(id),
    onSuccess: () => {
      toast.success('Zone deleted')
      qc.invalidateQueries({ queryKey: ['dns', 'zones'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">DNS zones</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Authoritative DNS hosting for your domains. Anycast nameservers in 15+ regions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Add domain
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : zones.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Globe size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No DNS zones</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Add your domain to start managing DNS records on the NetLayer network.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Add domain
          </Button>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Domain</TH>
              <TH>Records</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH className="w-20 text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {zones.map((z) => (
              <TR key={z.id} className="cursor-pointer" onClick={() => onOpen(z.id)}>
                <TD className="text-[#e8e8e6] font-medium">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[#a0a09e]" />
                    {z.domain}
                  </div>
                </TD>
                <TD>{z._count?.records ?? 0}</TD>
                <TD><Badge variant="running">{z.status}</Badge></TD>
                <TD className="text-xs">{relativeTime(z.createdAt)}</TD>
                <TD className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete zone "${z.domain}" and all its records?`)) {
                        del.mutate(z.id)
                      }
                    }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setDomain('') }}
        title="Add domain"
        description="After adding, point your domain's nameservers to ns1.netlayer.cloud and ns2.netlayer.cloud."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setDomain('') }}>Cancel</Button>
            <Button loading={create.isPending} disabled={!domain.trim()} onClick={() => create.mutate()}>
              Add domain
            </Button>
          </>
        }
      >
        <Input
          label="Domain"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
      </Modal>
    </div>
  )
}

function ZoneDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: zone, isLoading } = useQuery({
    queryKey: ['dns', 'zone', id],
    queryFn: () => dnsAPI.getZone(id).then((r) => r.data.data),
  })

  const form = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: 'A', name: '@', content: '', ttl: 300, priority: undefined },
  })

  const add = useMutation({
    mutationFn: (v: RecordForm) => dnsAPI.createRecord(id, v),
    onSuccess: () => {
      toast.success('Record added')
      qc.invalidateQueries({ queryKey: ['dns', 'zone', id] })
      qc.invalidateQueries({ queryKey: ['dns', 'zones'] })
      setAddOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (recordId: string) => dnsAPI.deleteRecord(id, recordId),
    onSuccess: () => {
      toast.success('Record deleted')
      qc.invalidateQueries({ queryKey: ['dns', 'zone', id] })
      qc.invalidateQueries({ queryKey: ['dns', 'zones'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  const selectedType = form.watch('type')

  if (isLoading || !zone) {
    return <div className="max-w-6xl mx-auto"><Skeleton className="h-40 rounded-lg" /></div>
  }

  const records: DnsRecord[] = (zone.records || []) as DnsRecord[]

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
          <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{zone.domain}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="running">{zone.status}</Badge>
            <span className="text-xs text-[#6a6a68]">{records.length} records</span>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} /> Add record
        </Button>
      </div>

      <Card padding="p-4" className="border-blue-900/40 bg-blue-950/10">
        <div className="text-xs text-[#a0a09e] mb-2">Set these nameservers at your registrar:</div>
        <div className="flex flex-wrap gap-2">
          {['ns1.netlayer.cloud', 'ns2.netlayer.cloud'].map((ns) => (
            <button
              key={ns}
              onClick={() => handleCopy(ns, ns)}
              className="flex items-center gap-2 bg-[#0d0e0d] border border-[#2a2b2a] rounded px-2 py-1 text-xs cursor-pointer hover:border-[#e0fe56]/40 transition-colors"
            >
              <code className="font-mono">{ns}</code>
              {copied === ns ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-[#6a6a68]" />}
            </button>
          ))}
        </div>
      </Card>

      {records.length === 0 ? (
        <EmptyTable message="No records yet. Add your first DNS record to start routing traffic." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-20">Type</TH>
              <TH>Name</TH>
              <TH>Content</TH>
              <TH className="hidden md:table-cell">TTL</TH>
              <TH className="hidden md:table-cell">Priority</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {records.map((r) => (
              <TR key={r.id}>
                <TD>
                  <span className={`font-mono text-xs font-semibold ${recordTypeColor[r.type] || ''}`}>
                    {r.type}
                  </span>
                </TD>
                <TD className="font-mono text-xs text-[#e8e8e6]">
                  {r.name === '@' ? zone.domain : r.name}
                </TD>
                <TD className="font-mono text-xs truncate max-w-[40%]">{r.content}</TD>
                <TD className="hidden md:table-cell">{r.ttl}</TD>
                <TD className="hidden md:table-cell">{r.priority ?? '—'}</TD>
                <TD className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${r.type} record "${r.name}"?`)) del.mutate(r.id)
                    }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); form.reset() }}
        title="Add DNS record"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={add.isPending} onClick={form.handleSubmit((v) => add.mutate(v))}>Add record</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => add.mutate(v))}>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" {...form.register('type')}>
              {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Input
              label="TTL (seconds)"
              type="number"
              min={60}
              max={86400}
              error={form.formState.errors.ttl?.message}
              {...form.register('ttl', { valueAsNumber: true })}
            />
          </div>
          <Input
            label="Name"
            placeholder="@ for root, or subdomain"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label="Content"
            placeholder={
              selectedType === 'A' ? '192.0.2.1' :
              selectedType === 'AAAA' ? '2001:db8::1' :
              selectedType === 'CNAME' ? 'example.com' :
              selectedType === 'MX' ? 'mail.example.com' :
              selectedType === 'TXT' ? 'v=spf1 include:_spf.example.com ~all' :
              ''
            }
            error={form.formState.errors.content?.message}
            {...form.register('content')}
          />
          {TYPES_WITH_PRIORITY.has(selectedType) && (
            <Input
              label="Priority"
              type="number"
              min={0}
              max={65535}
              defaultValue={selectedType === 'MX' ? 10 : 0}
              error={form.formState.errors.priority?.message}
              {...form.register('priority', { valueAsNumber: true })}
            />
          )}
        </form>
      </Modal>
    </div>
  )
}
