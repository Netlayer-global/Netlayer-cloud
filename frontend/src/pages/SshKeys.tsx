import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'
import { sshAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { formatDate } from '../lib/utils'

export default function SshKeys() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [keyError, setKeyError] = useState('')

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['ssh-keys'],
    queryFn: () => sshAPI.list().then((r) => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => sshAPI.create(name, publicKey),
    onSuccess: () => {
      toast.success('SSH key added')
      qc.invalidateQueries({ queryKey: ['ssh-keys'] })
      setOpen(false)
      setName('')
      setPublicKey('')
      setKeyError('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => sshAPI.delete(id),
    onSuccess: () => {
      toast.success('Key deleted')
      qc.invalidateQueries({ queryKey: ['ssh-keys'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleSubmit = () => {
    const trimmed = publicKey.trim()
    if (!name.trim()) {
      setKeyError('Name is required')
      return
    }
    if (!/^(ssh-rsa|ssh-ed25519|ecdsa-sha2)/.test(trimmed)) {
      setKeyError('Public key must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2')
      return
    }
    setKeyError('')
    create.mutate()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#e8e8e6]">SSH keys</h1>
          <p className="text-sm text-[#a0a09e] mt-1">
            Public keys you can use when deploying servers.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> Add SSH key
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : keys.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Key size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No SSH keys</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Add your first SSH key to deploy servers without a password.
          </p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={13} /> Add SSH key
          </Button>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Fingerprint</TH>
              <TH>Created</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {keys.map((k) => (
              <TR key={k.id}>
                <TD className="text-[#e8e8e6] font-medium">{k.name}</TD>
                <TD className="font-mono text-xs">{k.fingerprint}</TD>
                <TD>{formatDate(k.createdAt)}</TD>
                <TD className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Delete SSH key "${k.name}"?`)) del.mutate(k.id)
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

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setName('')
          setPublicKey('')
          setKeyError('')
        }}
        title="Add SSH key"
        description="Paste your public key (e.g. contents of ~/.ssh/id_ed25519.pub)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={handleSubmit}>Add key</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Key name"
            placeholder="My laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Public key</label>
            <textarea
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] placeholder-[#6a6a68] rounded-md px-3 py-2 text-xs font-mono h-32 focus:border-[#e0fe56] focus:outline-none transition-colors resize-none"
              placeholder="ssh-ed25519 AAAA..."
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
            {keyError && <p className="text-xs text-red-400 mt-1">{keyError}</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
