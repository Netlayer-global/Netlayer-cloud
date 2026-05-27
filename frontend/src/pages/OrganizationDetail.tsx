import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Mail, UserMinus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { organizationsAPI } from '../api/endpoints'
import { cn } from '../lib/utils'

const ROLES = ['admin', 'member', 'billing', 'viewer'] as const

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'members' | 'settings'>('members')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<typeof ROLES[number]>('member')

  const { data: org, isLoading } = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsAPI.get(id!).then((r: any) => r.data.data),
    enabled: !!id,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['organizations', id] })

  const invite = useMutation({
    mutationFn: () => organizationsAPI.invite(id!, inviteEmail, inviteRole),
    onSuccess: () => {
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const removeMember = useMutation({
    mutationFn: (memberId: string) => organizationsAPI.removeMember(id!, memberId),
    onSuccess: () => { toast.success('Member removed'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      organizationsAPI.updateMemberRole(id!, memberId, role),
    onSuccess: () => { toast.success('Role updated'); refresh() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading || !org) return <div className="text-sm text-[#a0a09e]">Loading…</div>

  const canManage = org.myRole === 'owner' || org.myRole === 'admin'

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard/organizations')}
        className="text-xs text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer mb-3 inline-flex items-center gap-1"
      >
        <ArrowLeft size={11} /> Back to organizations
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">{org.name}</h1>
          <p className="text-sm text-[#a0a09e] mt-1 font-mono">{org.slug}</p>
        </div>
        <span className={cn(
          'inline-flex h-6 px-2 items-center rounded border text-[10.5px] font-medium uppercase',
          'text-[#e0fe56] bg-[#e0fe56]/10 border-[#e0fe56]/30'
        )}>
          your role: {org.myRole}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-[#161716] border border-[#2a2b2a] rounded-md p-1 w-fit">
        {(['members', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 px-3 rounded text-xs cursor-pointer transition-colors capitalize',
              tab === t ? 'bg-[#1e1f1e] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <div className="space-y-4">
          {canManage && (
            <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-[#6a6a68] mb-2.5">Invite teammate</div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="alice@team.com"
                />
                <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                <Button onClick={() => invite.mutate()} disabled={!/^.+@.+\..+$/.test(inviteEmail)} loading={invite.isPending}>
                  <Send size={13} className="mr-1.5" /> Invite
                </Button>
              </div>
            </div>
          )}

          <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#161716] text-left">
                  {['Member', 'Email', 'Role', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.members?.map((m: any) => (
                  <tr key={m.id} className="border-t border-[#2a2b2a]">
                    <td className="px-4 py-3 text-[#e8e8e6]">{m.user.firstName} {m.user.lastName}</td>
                    <td className="px-4 py-3 text-[#a0a09e]">{m.user.email}</td>
                    <td className="px-4 py-3">
                      {canManage && org.myRole === 'owner' && m.role !== 'owner' ? (
                        <Select
                          value={m.role}
                          onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value })}
                          className="!h-7 !text-xs"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      ) : (
                        <span className={cn(
                          'inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase',
                          m.role === 'owner' ? 'text-[#e0fe56] bg-[#e0fe56]/10 border-[#e0fe56]/30' : 'text-[#a0a09e] bg-[#252625] border-[#2a2b2a]'
                        )}>
                          {m.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {canManage && m.role !== 'owner' && (
                        <button
                          onClick={() => { if (confirm('Remove this member?')) removeMember.mutate(m.id) }}
                          className="p-1.5 rounded text-red-400 hover:bg-red-950/40 cursor-pointer"
                        >
                          <UserMinus size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {org.invites && org.invites.length > 0 && (
            <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-[#6a6a68] mb-2.5">Pending invites ({org.invites.length})</div>
              <div className="space-y-2">
                {org.invites.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-[#6a6a68]" />
                      <span className="text-[#e8e8e6]">{i.email}</span>
                      <span className="text-[#6a6a68]">→ {i.role}</span>
                    </div>
                    <span className="text-[#6a6a68]">expires {new Date(i.expiresAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <OrgSettingsForm org={org} canManage={canManage} onSaved={refresh} />
      )}
    </div>
  )
}

function OrgSettingsForm({ org, canManage, onSaved }: { org: any; canManage: boolean; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: org.name,
    billingEmail: org.billingEmail || '',
    gstNumber: org.gstNumber || '',
    panNumber: org.panNumber || '',
  })

  const save = useMutation({
    mutationFn: () => organizationsAPI.update(org.id, form),
    onSuccess: () => { toast.success('Saved'); onSaved() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Save failed'),
  })

  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 space-y-3">
      <Input label="Legal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!canManage} />
      <Input label="Billing email" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} disabled={!canManage} />
      <Input label="GSTIN" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} disabled={!canManage} className="font-mono" />
      <Input label="PAN" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} disabled={!canManage} className="font-mono" />
      {canManage && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => save.mutate()} loading={save.isPending}>Save changes</Button>
        </div>
      )}
    </div>
  )
}
