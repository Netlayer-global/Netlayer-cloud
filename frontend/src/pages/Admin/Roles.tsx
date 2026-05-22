import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'

const PERMISSION_GROUPS: Array<{ label: string; permissions: { value: string; label: string }[] }> = [
  {
    label: 'Servers',
    permissions: [
      { value: 'servers:view', label: 'View servers' },
      { value: 'servers:create', label: 'Create servers' },
      { value: 'servers:delete', label: 'Delete servers' },
      { value: 'servers:power', label: 'Power actions' },
      { value: 'servers:all', label: 'View all servers (across users)' },
    ],
  },
  {
    label: 'Users',
    permissions: [
      { value: 'users:view', label: 'View users' },
      { value: 'users:edit', label: 'Edit users' },
      { value: 'users:suspend', label: 'Suspend users' },
      { value: 'users:delete', label: 'Delete users' },
    ],
  },
  {
    label: 'Billing',
    permissions: [
      { value: 'billing:view', label: 'View invoices' },
      { value: 'billing:edit', label: 'Edit invoices' },
      { value: 'billing:refund', label: 'Refund invoices' },
    ],
  },
  {
    label: 'Infrastructure',
    permissions: [
      { value: 'nodes:view', label: 'View nodes' },
      { value: 'nodes:edit', label: 'Edit nodes' },
      { value: 'nodes:add', label: 'Add nodes' },
      { value: 'nodes:delete', label: 'Delete nodes' },
    ],
  },
  {
    label: 'Support',
    permissions: [
      { value: 'tickets:view', label: 'View tickets' },
      { value: 'tickets:reply', label: 'Reply to tickets' },
      { value: 'tickets:assign', label: 'Assign tickets' },
      { value: 'tickets:close', label: 'Close tickets' },
    ],
  },
  {
    label: 'Admin',
    permissions: [
      { value: 'admin:access', label: 'Access admin panel' },
      { value: 'admin:integrations', label: 'Manage integrations' },
      { value: 'admin:roles', label: 'Manage roles' },
      { value: 'admin:settings', label: 'Manage platform settings' },
    ],
  },
  {
    label: 'Content',
    permissions: [
      { value: 'announcements:manage', label: 'Manage announcements' },
      { value: 'audit:view', label: 'View audit logs' },
    ],
  },
]

export default function AdminRoles() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminAPI.listRoles(),
  })

  const del = useMutation({
    mutationFn: (id: string) => adminAPI.deleteRole(id),
    onSuccess: () => {
      toast.success('Role deleted')
      qc.invalidateQueries({ queryKey: ['admin-roles'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">Roles</h1>
          <p className="text-sm text-[#a0a09e] mt-1">Define groups of permissions for users.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} /> New role</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Display name</TH>
              <TH className="text-right">Users</TH>
              <TH className="text-right">Permissions</TH>
              <TH>Type</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {roles.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-xs">{r.name}</TD>
                <TD className="text-[#e8e8e6]">{r.displayName}</TD>
                <TD className="text-right">{r._count?.assignments ?? 0}</TD>
                <TD className="text-right">{r.permissions.length}</TD>
                <TD>
                  {r.isSystem ? <Badge variant="preview">system</Badge> : <Badge variant="default">custom</Badge>}
                </TD>
                <TD className="text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => setEditing(r)}
                      className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {!r.isSystem && (r._count?.assignments ?? 0) === 0 && (
                      <button
                        onClick={() => { if (confirm(`Delete role "${r.displayName}"?`)) del.mutate(r.id) }}
                        className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <RoleEditor
        open={creating || !!editing}
        editing={editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSaved={() => qc.invalidateQueries({ queryKey: ['admin-roles'] })}
      />
    </div>
  )
}

function RoleEditor({
  open, editing, onClose, onSaved,
}: {
  open: boolean; editing: any | null; onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name || '')
  const [displayName, setDisplayName] = useState(editing?.displayName || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [permissions, setPermissions] = useState<string[]>(editing?.permissions || [])

  // Reset form when editing prop changes
  useState(() => {
    setName(editing?.name || '')
    setDisplayName(editing?.displayName || '')
    setDescription(editing?.description || '')
    setPermissions(editing?.permissions || [])
  })

  const save = useMutation({
    mutationFn: () => {
      if (editing) {
        return adminAPI.updateRole(editing.id, { displayName, description, permissions })
      }
      return adminAPI.createRole({ name, displayName, description, permissions })
    },
    onSuccess: () => {
      toast.success(editing ? 'Role updated' : 'Role created')
      onSaved()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const toggle = (p: string) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit role: ${editing.displayName}` : 'Create role'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!displayName || (!editing && !name)}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {editing ? 'Save' : 'Create role'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 mb-5">
        {!editing && (
          <Input label="Name (slug)" value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z_]/g, '_'))} placeholder="my_role" />
        )}
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Description</label>
          <textarea
            className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm h-16 focus:border-[#e0fe56] focus:outline-none resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Permissions</div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.label} className="border border-[#2a2b2a] rounded-md p-3">
            <div className="text-xs font-medium text-[#e8e8e6] mb-2">{g.label}</div>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {g.permissions.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer hover:text-[#e8e8e6]">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.value)}
                    onChange={() => toggle(p.value)}
                    className="cursor-pointer accent-[#e0fe56]"
                  />
                  <span className="font-mono text-[10px]">{p.value}</span>
                  <span className="text-[#6a6a68]">— {p.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
