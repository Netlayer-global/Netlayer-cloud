import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Network, Plus, Trash2, ArrowLeft, Server as ServerIcon,
} from 'lucide-react'

import { vpcAPI, type VPC } from '../api/infra'
import { catalogAPI, serverAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { cn, relativeTime } from '../lib/utils'

const createSchema = z.object({
  name: z.string().min(1, 'Required').max(64),
  region: z.string().min(1, 'Pick a region'),
  cidr: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, 'Invalid CIDR notation').optional().or(z.literal('')),
  isDefault: z.boolean(),
})
type CreateForm = z.infer<typeof createSchema>

export default function VPCPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) return <VPCDetail id={openId} onBack={() => setOpenId(null)} />
  return <VPCList onOpen={setOpenId} />
}

function VPCList({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: vpcs = [], isLoading } = useQuery({
    queryKey: ['vpcs'],
    queryFn: () => vpcAPI.list().then((r) => r.data.data),
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', region: '', cidr: '10.0.0.0/16', isDefault: false },
  })

  const create = useMutation({
    mutationFn: (v: CreateForm) =>
      vpcAPI.create({ ...v, cidr: v.cidr || undefined }),
    onSuccess: () => {
      toast.success('VPC created')
      qc.invalidateQueries({ queryKey: ['vpcs'] })
      setCreateOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => vpcAPI.delete(id),
    onSuccess: () => {
      toast.success('VPC deleted')
      qc.invalidateQueries({ queryKey: ['vpcs'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">VPC & private network</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Isolated private networks for inter-server communication without bandwidth costs.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create VPC
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : vpcs.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Network size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No VPCs yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Create a VPC to enable private networking between your servers in a region.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create VPC
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vpcs.map((vpc) => (
            <Card key={vpc.id} hover onClick={() => onOpen(vpc.id)} className="cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Network size={16} className="text-[#e0fe56] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-[#e8e8e6] font-medium truncate">{vpc.name}</div>
                    <div className="text-[11px] text-[#6a6a68] font-mono">{vpc.cidr}</div>
                  </div>
                </div>
                {vpc.isDefault && <Badge variant="preview">Default</Badge>}
              </div>
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Region</span>
                  <span className="text-[#e8e8e6] uppercase">{vpc.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Members</span>
                  <span className="text-[#e8e8e6]">{vpc.members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6a68]">Created</span>
                  <span className="text-[#e8e8e6]">{relativeTime(vpc.createdAt)}</span>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-[#2a2b2a] mt-3">
                <button
                  disabled={vpc.members.length > 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete VPC "${vpc.name}"?`)) del.mutate(vpc.id)
                  }}
                  className={cn(
                    'p-1 rounded transition-colors',
                    vpc.members.length > 0
                      ? 'text-[#3a3b3a] cursor-not-allowed'
                      : 'text-[#6a6a68] hover:text-red-400 cursor-pointer'
                  )}
                  title={vpc.members.length > 0 ? 'Detach servers first' : 'Delete'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); form.reset() }}
        title="Create VPC"
        description="A private network for servers in one region. Default CIDR is 10.0.0.0/16."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={create.isPending} onClick={form.handleSubmit((v) => create.mutate(v))}>Create</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <Input
            label="Name"
            placeholder="prod-network"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Select label="Region" error={form.formState.errors.region?.message} {...form.register('region')}>
            <option value="">Select a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.flag} {r.city}, {r.country}
              </option>
            ))}
          </Select>
          <Input
            label="CIDR (optional)"
            placeholder="10.0.0.0/16"
            error={form.formState.errors.cidr?.message}
            {...form.register('cidr')}
          />
          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
            <input type="checkbox" className="mt-1 accent-[#e0fe56]" {...form.register('isDefault')} />
            <div>
              <div className="text-sm text-[#e8e8e6]">Make this the default VPC</div>
              <div className="text-xs text-[#6a6a68]">New servers in this region will join automatically.</div>
            </div>
          </label>
        </form>
      </Modal>
    </div>
  )
}

function VPCDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  const { data: vpc, isLoading } = useQuery({
    queryKey: ['vpc', id],
    queryFn: () => vpcAPI.get(id).then((r) => r.data.data),
  })

  const remove = useMutation({
    mutationFn: (memberId: string) => vpcAPI.removeMember(id, memberId),
    onSuccess: () => {
      toast.success('Server removed from VPC')
      qc.invalidateQueries({ queryKey: ['vpc', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading || !vpc) {
    return <div className="max-w-6xl mx-auto"><Skeleton className="h-40 rounded-lg" /></div>
  }

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
          <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{vpc.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <code className="text-xs text-[#a0a09e] bg-[#0d0e0d] px-2 py-0.5 rounded border border-[#2a2b2a]">
              {vpc.cidr}
            </code>
            <span className="text-xs text-[#6a6a68]">{vpc.region.toUpperCase()}</span>
            {vpc.isDefault && <Badge variant="preview">Default</Badge>}
          </div>
        </div>
        <Button size="sm" onClick={() => setAddMemberOpen(true)}>
          <Plus size={13} /> Attach server
        </Button>
      </div>

      {vpc.members.length === 0 ? (
        <EmptyTable message="No servers in this VPC. Attach one to start using private networking." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Server</TH>
              <TH>Public IP</TH>
              <TH>Private IP</TH>
              <TH>Status</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {vpc.members.map((m) => (
              <TR key={m.id}>
                <TD className="text-[#e8e8e6] font-medium">
                  <div className="flex items-center gap-2">
                    <ServerIcon size={13} className="text-[#a0a09e]" />
                    {m.server?.name || m.serverId.slice(0, 8)}
                  </div>
                </TD>
                <TD className="font-mono text-xs">{m.server?.ipv4 || '—'}</TD>
                <TD className="font-mono text-xs text-[#e0fe56]">{m.privateIp}</TD>
                <TD>
                  <Badge variant={m.server?.status === 'RUNNING' ? 'running' : 'stopped'}>
                    {m.server?.status || '—'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${m.server?.name || 'server'} from VPC?`)) {
                        remove.mutate(m.id)
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

      <AddMemberModal
        vpc={vpc}
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['vpc', id] })}
      />
    </div>
  )
}

function AddMemberModal({
  vpc, open, onClose, onSuccess,
}: { vpc: VPC; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [serverId, setServerId] = useState('')

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverAPI.list().then((r) => r.data.data),
    enabled: open,
  })

  const add = useMutation({
    mutationFn: () => vpcAPI.addMember(vpc.id, serverId),
    onSuccess: () => {
      toast.success('Server attached to VPC')
      onSuccess()
      onClose()
      setServerId('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const inVpc = new Set(vpc.members.map((m) => m.serverId))
  const eligible = servers.filter(
    (s: any) => s.region?.slug === vpc.region && s.status !== 'DELETED' && !inVpc.has(s.id)
  )

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setServerId('') }}
      title="Attach server to VPC"
      description={`Pick a server in ${vpc.region.toUpperCase()}.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); setServerId('') }}>Cancel</Button>
          <Button loading={add.isPending} disabled={!serverId} onClick={() => add.mutate()}>Attach</Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <div className="text-sm text-[#a0a09e] py-4 text-center">
          No eligible servers in <span className="uppercase font-mono">{vpc.region}</span>.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {eligible.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setServerId(s.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-md border text-left cursor-pointer transition-colors',
                serverId === s.id
                  ? 'bg-[#e0fe56]/5 border-[#e0fe56]/40'
                  : 'bg-[#1e1f1e] border-[#2a2b2a] hover:bg-[#252625]'
              )}
            >
              <ServerIcon size={14} className="text-[#a0a09e]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#e8e8e6] font-medium">{s.name}</div>
                <div className="text-[11px] text-[#6a6a68]">{s.ipv4 || s.hostname}</div>
              </div>
              <Badge variant={s.status === 'RUNNING' ? 'running' : 'stopped'}>{s.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
