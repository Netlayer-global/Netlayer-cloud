import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Terminal } from 'lucide-react'

import { apiKeysAPI, type ApiKey } from '../api/infra'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { copyToClipboard, formatDate, relativeTime } from '../lib/utils'

export default function ApiKeys() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [revealed, setRevealed] = useState<{ key: string; name: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysAPI.list().then((r) => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => apiKeysAPI.create(name),
    onSuccess: (r) => {
      toast.success('API key created')
      setRevealed({ key: r.data.data.key, name: r.data.data.name })
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      setCreateOpen(false)
      setName('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => apiKeysAPI.delete(id),
    onSuccess: () => {
      toast.success('API key revoked')
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">API keys</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Long-lived keys for the CLI, Terraform provider, and your own scripts. Pass as <code className="text-xs">Authorization: Bearer nl_…</code>.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New API key
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : keys.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Key size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No API keys yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Generate one to use the CLI or Terraform provider, or to call the API from your own scripts.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create API key
          </Button>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Prefix</TH>
              <TH className="hidden md:table-cell">Last used</TH>
              <TH className="hidden md:table-cell">Created</TH>
              <TH className="hidden lg:table-cell">Status</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {keys.map((k: ApiKey) => (
              <TR key={k.id}>
                <TD className="text-[#e8e8e6] font-medium">{k.name}</TD>
                <TD>
                  <code className="text-xs font-mono text-[#a0a09e]">{k.keyPrefix}…</code>
                </TD>
                <TD className="hidden md:table-cell text-xs">
                  {k.lastUsedAt ? relativeTime(k.lastUsedAt) : <span className="text-[#6a6a68]">never</span>}
                </TD>
                <TD className="hidden md:table-cell text-xs">{formatDate(k.createdAt)}</TD>
                <TD className="hidden lg:table-cell">
                  {k.isActive ? <Badge variant="running">Active</Badge> : <Badge variant="error">Revoked</Badge>}
                </TD>
                <TD className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Revoke API key "${k.name}"? Tools using this key will stop working.`)) {
                        del.mutate(k.id)
                      }
                    }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setName('') }}
        title="Create API key"
        description="The full key is shown only once. Copy it immediately."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setName('') }}>Cancel</Button>
            <Button loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()}>
              Create key
            </Button>
          </>
        }
      >
        <Input
          label="Name"
          placeholder="My laptop / production CI"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal>

      {/* Revealed-key modal */}
      <Modal
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title="Save your API key"
        description="This is the only time you'll see this key. Copy it now and store it somewhere safe."
        size="lg"
        footer={<Button onClick={() => setRevealed(null)}>I have saved it</Button>}
      >
        {revealed && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-[#6a6a68] mb-1">{revealed.name}</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#e8e8e6] bg-[#0d0e0d] px-3 py-2.5 rounded flex-1 font-mono break-all border border-[#2a2b2a]">
                  {revealed.key}
                </code>
                <button
                  onClick={() => handleCopy(revealed.key, 'key')}
                  className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-2.5 rounded border border-[#2a2b2a] transition-colors"
                >
                  {copied === 'key' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-900/40 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>
                Treat this key like a password. If it leaks, revoke it immediately and create a new one.
              </span>
            </div>

            <Card padding="p-3" className="bg-[#0d0e0d]">
              <div className="flex items-center gap-2 mb-2 text-xs text-[#a0a09e]">
                <Terminal size={12} /> Quick start with the CLI
              </div>
              <pre className="text-[11px] text-[#e8e8e6] font-mono whitespace-pre-wrap leading-relaxed">
{`nl login --api-key ${revealed.key}
nl whoami
nl server list`}
              </pre>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}
