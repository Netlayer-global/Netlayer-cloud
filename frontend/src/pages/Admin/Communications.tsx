import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { communicationsAPI } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

const TARGETS = [
  { value: 'all',     label: 'All users' },
  { value: 'active',  label: 'Active users (have running servers)' },
  { value: 'country', label: 'By country' },
  { value: 'custom',  label: 'Custom user IDs (comma-separated)' },
] as const

export default function Communications() {
  const me = useAuthStore((s) => s.user)
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('<p>Hi NetLayer customer,</p>\n<p>...</p>\n<p>— The NetLayer team</p>')
  const [targetType, setTargetType] = useState<'all' | 'active' | 'country' | 'custom'>('all')
  const [targetValue, setTargetValue] = useState('')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [sendTest, setSendTest] = useState(true)

  const { data: history = [] } = useQuery({
    queryKey: ['admin', 'communications', 'history'],
    queryFn: () => communicationsAPI.history().then((r: any) => r.data.data),
  })

  const send = useMutation({
    mutationFn: (asTest: boolean) =>
      communicationsAPI.sendBulkEmail({
        subject,
        html,
        targetType,
        targetValue: targetValue || undefined,
        testEmail: asTest && me ? me.email : undefined,
      }),
    onSuccess: (r: any) => {
      const d = r.data.data
      if (d.preview) toast.success('Test email sent to ' + me?.email)
      else toast.success(`Queued ${d.queued} email${d.queued === 1 ? '' : 's'} (${d.batches} batch${d.batches === 1 ? '' : 'es'})`)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Send failed'),
  })

  const ready = subject.trim().length > 0 && html.trim().length > 0 &&
    (targetType === 'all' || targetType === 'active' || (targetValue.trim().length > 0))

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Bulk communications</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Send announcements, product updates, or maintenance notices to your customers.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Scheduled maintenance — Mumbai region"
          />

          <div className="mt-4">
            <label className="block text-xs text-[#a0a09e] mb-1.5">Target audience</label>
            <Select value={targetType} onChange={(e) => setTargetType(e.target.value as any)}>
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            {(targetType === 'country' || targetType === 'custom') && (
              <Input
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={targetType === 'country' ? 'IN' : 'cuid1,cuid2,cuid3'}
                className="mt-2"
              />
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#a0a09e]">Body (HTML)</label>
              <div className="flex gap-1">
                {(['write', 'preview'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'h-6 px-2 text-[11px] rounded cursor-pointer transition-colors',
                      tab === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#6a6a68] hover:text-[#e8e8e6]'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'write' ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={14}
                className="w-full bg-[#161716] border border-[#2a2b2a] rounded-md px-3 py-2 text-xs font-mono text-[#e8e8e6] focus:border-[#e0fe56] focus:outline-none transition-colors"
              />
            ) : (
              <iframe
                title="preview"
                srcDoc={`<style>body{background:#161716;color:#e8e8e6;font-family:system-ui,-apple-system,sans-serif;padding:16px}</style>${html}`}
                className="w-full h-[300px] bg-[#161716] border border-[#2a2b2a] rounded-md"
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#a0a09e] cursor-pointer">
              <input
                type="checkbox"
                checked={sendTest}
                onChange={(e) => setSendTest(e.target.checked)}
                className="accent-[#e0fe56] cursor-pointer"
              />
              Send test to <span className="text-[#e8e8e6]">{me?.email}</span> first
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => send.mutate(true)}
              loading={send.isPending && sendTest}
              disabled={!subject || !html}
            >
              Send test
            </Button>
            <Button
              onClick={() => send.mutate(false)}
              loading={send.isPending && !sendTest}
              disabled={!ready}
            >
              <Send size={14} className="mr-1.5" /> Send to audience
            </Button>
          </div>
        </div>

        {/* Send history */}
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={14} className="text-[#a0a09e]" />
            <h3 className="text-sm font-medium text-[#e8e8e6]">Send history</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-[#6a6a68]">No bulk emails sent yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {history.map((h: any) => (
                <li key={h.id} className="text-xs border-t border-[#2a2b2a] first:border-t-0 pt-2 first:pt-0">
                  <div className="text-[#e8e8e6] truncate">{h.subject || '(no subject)'}</div>
                  <div className="text-[11px] text-[#6a6a68] mt-0.5">
                    {h.recipients} recipients · {h.targetType} · {new Date(h.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
