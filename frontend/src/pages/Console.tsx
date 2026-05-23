import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Copy, X, Hexagon } from 'lucide-react'
import { toast } from 'sonner'
import { serverAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'

/**
 * Browser console for a server. In mock mode (or when noVNC isn't wired up
 * yet) we fall back to a clean SSH-instructions card. The fallback is the
 * common case during development; the noVNC path is real-Proxmox-only.
 */
export default function Console() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const serverId = params.get('serverId')
  const [tab, setTab] = useState<'mac' | 'win'>('mac')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => serverAPI.get(serverId!).then((r) => r.data.data),
    enabled: !!serverId,
  })

  useEffect(() => {
    document.title = data ? `Console — ${data.name}` : 'NetLayer Console'
  }, [data])

  if (!serverId) {
    return (
      <Frame>
        <p className="text-sm text-[#a0a09e]">No server selected.</p>
      </Frame>
    )
  }

  if (isLoading) {
    return <Frame><p className="text-sm text-[#a0a09e]">Loading server…</p></Frame>
  }

  if (isError || !data) {
    return <Frame><p className="text-sm text-red-400">Could not load server.</p></Frame>
  }

  const ip = data.ipv4 || data.hostname
  const sshCmd = `ssh root@${ip}`

  return (
    <Frame>
      <h1 className="text-2xl font-medium text-[#e8e8e6]">{data.name}</h1>
      <p className="text-sm text-[#a0a09e] mt-1 mb-6">
        {data.region?.flag} {data.region?.city} · {data.plan?.name} · {data.osTemplate?.name}
      </p>

      {/* SSH command card */}
      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 mb-5">
        <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-2">
          Connect via SSH
        </div>
        <div className="flex items-center gap-2 bg-[#0d0e0d] border border-[#2a2b2a] rounded-md px-3 py-2">
          <code className="flex-1 font-mono text-sm text-[#e0fe56]">{sshCmd}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sshCmd).catch(() => {})
              toast.success('Copied')
            }}
            className="p-1.5 rounded hover:bg-[#161716] text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
            title="Copy"
          >
            <Copy size={14} />
          </button>
        </div>
        {data.rootPassword && (
          <div className="mt-3 text-xs text-[#a0a09e]">
            Root password: <code className="font-mono text-[#e8e8e6]">{data.rootPassword}</code>
          </div>
        )}
      </div>

      {/* OS-specific terminal instructions */}
      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-3">
          Open a terminal
        </div>
        <div className="flex gap-1 mb-4">
          <TabBtn active={tab === 'mac'} onClick={() => setTab('mac')}>macOS / Linux</TabBtn>
          <TabBtn active={tab === 'win'} onClick={() => setTab('win')}>Windows</TabBtn>
        </div>
        {tab === 'mac' ? (
          <ol className="text-sm text-[#a0a09e] space-y-2 list-decimal list-inside">
            <li>Open the <strong className="text-[#e8e8e6]">Terminal</strong> app.</li>
            <li>Paste the SSH command above and press <kbd className="bg-[#0d0e0d] border border-[#2a2b2a] px-1.5 py-0.5 rounded text-[11px]">Enter</kbd>.</li>
            <li>Type <code className="text-[#e0fe56]">yes</code> when asked about the host fingerprint (first time only).</li>
            <li>Enter the root password shown above.</li>
          </ol>
        ) : (
          <ol className="text-sm text-[#a0a09e] space-y-2 list-decimal list-inside">
            <li>
              Press <kbd className="bg-[#0d0e0d] border border-[#2a2b2a] px-1.5 py-0.5 rounded text-[11px]">Win + R</kbd>, type <code className="text-[#e0fe56]">cmd</code>, press Enter.
            </li>
            <li>Paste the SSH command above and press Enter.</li>
            <li>Or use <a href="https://www.putty.org" target="_blank" rel="noreferrer" className="text-[#e0fe56] hover:underline">PuTTY</a> with host <code className="font-mono text-[#e8e8e6]">{ip}</code>.</li>
          </ol>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={() => (window.opener ? window.close() : navigate(-1))}>
          <X size={14} className="mr-1.5" /> Close
        </Button>
      </div>
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0e0d] text-[#e8e8e6] p-6">
      <div className="flex items-center gap-2 mb-8 max-w-3xl mx-auto">
        <div className="w-7 h-7 rounded-md bg-[#e0fe56] text-[#0d0e0d] flex items-center justify-center">
          <Hexagon size={14} />
        </div>
        <span className="font-semibold">NetLayer Console</span>
      </div>
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-xs cursor-pointer transition-colors ${
        active ? 'bg-[#e0fe56] text-[#0d0e0d] font-medium' : 'text-[#a0a09e] hover:bg-[#252625] hover:text-[#e8e8e6]'
      }`}
    >
      {children}
    </button>
  )
}
