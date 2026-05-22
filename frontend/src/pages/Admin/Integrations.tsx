import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Server as ServerIcon, Cloud, BarChart3, Shield, Mail, Phone, IndianRupee, DollarSign, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'

interface IntegrationDef {
  key: string
  title: string
  icon: any
  iconColor: string
  fields: Field[]
  testEndpoint: keyof typeof adminAPI
  // Fields that are sent to the test endpoint
  testFieldNames: string[]
  // Optional: for active provider switch
  groupKey?: string
}

interface Field {
  name: string
  label: string
  type?: 'text' | 'password' | 'url' | 'email' | 'select' | 'toggle' | 'number'
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'proxmox',
    title: 'Proxmox',
    icon: ServerIcon,
    iconColor: 'text-amber-400 bg-amber-950/40',
    fields: [
      { name: 'defaultStorage', label: 'Default storage', placeholder: 'local-lvm' },
      { name: 'defaultBridge', label: 'Default bridge', placeholder: 'vmbr0' },
      { name: 'cloudInitTemplate', label: 'Cloud-init template ID', placeholder: '' },
    ],
    testEndpoint: 'testProxmox',
    testFieldNames: [],
  },
  {
    key: 'cloudflare',
    title: 'Cloudflare DNS',
    icon: Cloud,
    iconColor: 'text-orange-400 bg-orange-950/40',
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      { name: 'zoneId', label: 'Zone ID', required: true },
      { name: 'domain', label: 'Domain', placeholder: 'netlayer.com' },
    ],
    testEndpoint: 'testCloudflare',
    testFieldNames: ['apiToken', 'zoneId'],
  },
  {
    key: 'grafana',
    title: 'Grafana / Prometheus',
    icon: BarChart3,
    iconColor: 'text-orange-400 bg-orange-950/40',
    fields: [
      { name: 'url', label: 'Grafana URL', type: 'url', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'orgId', label: 'Org ID', type: 'number' },
      { name: 'datasourceId', label: 'Prometheus datasource ID', type: 'number' },
    ],
    testEndpoint: 'testGrafana',
    testFieldNames: ['url', 'apiKey'],
  },
  {
    key: 'zabbix',
    title: 'Zabbix',
    icon: Shield,
    iconColor: 'text-red-400 bg-red-950/40',
    fields: [
      { name: 'url', label: 'Zabbix URL', type: 'url', required: true },
      { name: 'user', label: 'Username', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
    testEndpoint: 'testZabbix',
    testFieldNames: ['url', 'user', 'password'],
  },
  {
    key: 'email.resend',
    title: 'Email — Resend',
    icon: Mail,
    iconColor: 'text-[#e0fe56] bg-[#e0fe56]/10',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'fromName', label: 'From Name', placeholder: 'NetLayer' },
      { name: 'fromEmail', label: 'From Email', type: 'email' },
    ],
    testEndpoint: 'testEmail',
    testFieldNames: ['apiKey'],
  },
  {
    key: 'email.smtp',
    title: 'Email — Custom SMTP',
    icon: Mail,
    iconColor: 'text-[#e0fe56] bg-[#e0fe56]/10',
    fields: [
      { name: 'host', label: 'Host' },
      { name: 'port', label: 'Port', type: 'number', placeholder: '587' },
      { name: 'user', label: 'Username' },
      { name: 'pass', label: 'Password', type: 'password' },
      { name: 'fromEmail', label: 'From Email', type: 'email' },
    ],
    testEndpoint: 'testEmail',
    testFieldNames: ['apiKey'],
  },
  {
    key: 'sms.twilio',
    title: 'SMS — Twilio',
    icon: Phone,
    iconColor: 'text-blue-400 bg-blue-950/40',
    fields: [
      { name: 'accountSid', label: 'Account SID', required: true },
      { name: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { name: 'from', label: 'From number', placeholder: '+1...' },
    ],
    testEndpoint: 'testSms',
    testFieldNames: ['accountSid', 'authToken', 'from'],
  },
  {
    key: 'sms.msg91',
    title: 'SMS — MSG91 (India)',
    icon: Phone,
    iconColor: 'text-green-400 bg-green-950/40',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'senderId', label: 'Sender ID', placeholder: 'NETLYR' },
      { name: 'otpTemplateId', label: 'OTP Template ID' },
    ],
    testEndpoint: 'testSms',
    testFieldNames: ['apiKey', 'senderId'],
  },
  {
    key: 'payment.razorpay',
    title: 'Razorpay',
    icon: IndianRupee,
    iconColor: 'text-blue-400 bg-blue-950/40',
    fields: [
      { name: 'keyId', label: 'Key ID', required: true },
      { name: 'keySecret', label: 'Key Secret', type: 'password', required: true },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
      {
        name: 'mode', label: 'Mode', type: 'select',
        options: [{ value: 'test', label: 'Test' }, { value: 'live', label: 'Live' }],
      },
    ],
    testEndpoint: 'testRazorpay',
    testFieldNames: ['keyId', 'keySecret'],
  },
  {
    key: 'payment.stripe',
    title: 'Stripe',
    icon: DollarSign,
    iconColor: 'text-purple-400 bg-purple-950/40',
    fields: [
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { name: 'publishableKey', label: 'Publishable Key' },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
      {
        name: 'mode', label: 'Mode', type: 'select',
        options: [{ value: 'test', label: 'Test' }, { value: 'live', label: 'Live' }],
      },
    ],
    testEndpoint: 'testStripe',
    testFieldNames: ['secretKey'],
  },
]

export default function AdminIntegrations() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: () => adminAPI.listIntegrations(),
  })

  const byKey = new Map<string, any>(configs.map((c: any) => [c.key, c]))
  const activeEmail = byKey.get('email.active')?.value?.provider || 'resend'
  const activeSms = byKey.get('sms.active')?.value?.provider || 'mock'

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Integrations</h1>
        <p className="text-sm text-[#a0a09e] mt-1">External services NetLayer connects to.</p>
      </div>

      <ProviderSwitcher activeEmail={activeEmail} activeSms={activeSms} />

      <div className="grid lg:grid-cols-2 gap-4">
        {INTEGRATIONS.map((def) => (
          <IntegrationCard
            key={def.key}
            def={def}
            saved={byKey.get(def.key)?.value || {}}
            isActive={byKey.get(def.key)?.isActive ?? true}
          />
        ))}
      </div>
    </div>
  )
}

function ProviderSwitcher({ activeEmail, activeSms }: { activeEmail: string; activeSms: string }) {
  const qc = useQueryClient()
  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      adminAPI.updateIntegration(key, value),
    onSuccess: () => {
      toast.success('Active provider switched')
      qc.invalidateQueries({ queryKey: ['admin-integrations'] })
    },
  })

  return (
    <Card padding="p-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Active email provider</div>
          <div className="flex gap-2">
            {['resend', 'smtp'].map((p) => (
              <button
                key={p}
                onClick={() => update.mutate({ key: 'email.active', value: { provider: p } })}
                className={cn(
                  'px-3 h-8 rounded text-xs cursor-pointer transition-colors capitalize',
                  activeEmail === p ? 'bg-[#e0fe56] text-[#0d0e0d] font-medium' : 'bg-[#1e1f1e] text-[#a0a09e] border border-[#333433] hover:bg-[#252625]'
                )}
              >
                {p === 'smtp' ? 'Custom SMTP' : 'Resend'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">Active SMS provider</div>
          <div className="flex gap-2">
            {['mock', 'twilio', 'msg91'].map((p) => (
              <button
                key={p}
                onClick={() => update.mutate({ key: 'sms.active', value: { provider: p } })}
                className={cn(
                  'px-3 h-8 rounded text-xs cursor-pointer transition-colors capitalize',
                  activeSms === p ? 'bg-[#e0fe56] text-[#0d0e0d] font-medium' : 'bg-[#1e1f1e] text-[#a0a09e] border border-[#333433] hover:bg-[#252625]'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function IntegrationCard({
  def, saved, isActive,
}: {
  def: IntegrationDef; saved: any; isActive: boolean
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>({ ...saved })
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [enabled, setEnabled] = useState(isActive)
  const [testTo, setTestTo] = useState('')

  useEffect(() => {
    setForm({ ...saved })
    setEnabled(isActive)
  }, [saved, isActive])

  const save = useMutation({
    mutationFn: () => adminAPI.updateIntegration(def.key, form, enabled),
    onSuccess: () => {
      toast.success(`${def.title} saved`)
      qc.invalidateQueries({ queryKey: ['admin-integrations'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    try {
      let payload: any = {}
      if (def.key.startsWith('email.')) {
        if (!testTo) {
          toast.error('Enter a destination email')
          setTesting(false)
          return
        }
        payload = { apiKey: form.apiKey, to: testTo }
      } else if (def.key.startsWith('sms.')) {
        if (!testTo) {
          toast.error('Enter a destination phone')
          setTesting(false)
          return
        }
        payload = {
          provider: def.key.replace('sms.', ''),
          config: form,
          to: testTo,
        }
      } else if (def.key === 'cloudflare') {
        payload = { apiToken: form.apiToken, zoneId: form.zoneId }
      } else if (def.key === 'grafana') {
        payload = { url: form.url, apiKey: form.apiKey }
      } else if (def.key === 'zabbix') {
        payload = { url: form.url, user: form.user, password: form.password }
      } else if (def.key === 'payment.razorpay') {
        payload = { keyId: form.keyId, keySecret: form.keySecret }
      } else if (def.key === 'payment.stripe') {
        payload = { secretKey: form.secretKey }
      } else {
        toast.info('No test endpoint for this integration')
        setTesting(false)
        return
      }
      const fn = (adminAPI as any)[def.testEndpoint]
      const res = await fn(payload)
      setResult(res)
      if (res.success) toast.success('Connection ok')
      else toast.error(res.error || 'Test failed')
    } catch (e: any) {
      setResult({ success: false, error: e.response?.data?.error || e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-md flex items-center justify-center', def.iconColor)}>
            <def.icon size={16} />
          </div>
          <div>
            <div className="font-medium text-[#e8e8e6]">{def.title}</div>
            <div className="text-[11px] text-[#6a6a68]">{def.key}</div>
          </div>
        </div>
        <Toggle enabled={enabled} onChange={setEnabled} />
      </div>

      <div className="space-y-3">
        {def.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs text-[#a0a09e] mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <Select value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                {field.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : (
              <Input
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={form[field.name] ?? ''}
                onChange={(e) => {
                  const v =
                    field.type === 'number'
                      ? (e.target.value === '' ? '' : Number(e.target.value))
                      : e.target.value
                  setForm({ ...form, [field.name]: v })
                }}
              />
            )}
          </div>
        ))}

        {(def.key.startsWith('email.') || def.key.startsWith('sms.')) && (
          <Input
            label={def.key.startsWith('sms.') ? 'Test phone' : 'Test email'}
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder={def.key.startsWith('sms.') ? '+91...' : 'you@example.com'}
          />
        )}
      </div>

      {result && (
        <div className={cn(
          'mt-3 rounded-md p-3 text-xs border',
          result.success ? 'bg-green-950/20 border-green-900/40 text-green-300' : 'bg-red-950/20 border-red-900/40 text-red-300'
        )}>
          {result.success ? (
            <div>
              ✓ Connected
              {result.zoneName && <div className="text-[#a0a09e] mt-1">Zone: {result.zoneName}</div>}
              {result.dashboards !== undefined && <div className="text-[#a0a09e] mt-1">Dashboards: {result.dashboards}</div>}
              {result.version && <div className="text-[#a0a09e] mt-1">Version: {result.version}</div>}
              {result.accountName && <div className="text-[#a0a09e] mt-1">Account: {result.accountName}</div>}
              {result.nodeInfo && <div className="text-[#a0a09e] mt-1">Version: {result.nodeInfo.version}</div>}
            </div>
          ) : (
            <div>✗ {result.error || 'Failed'}</div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-[#2a2b2a]">
        <Button variant="secondary" onClick={handleTest} loading={testing}>
          <RefreshCw size={12} /> Test
        </Button>
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Save
        </Button>
      </div>
    </Card>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors cursor-pointer',
        enabled ? 'bg-[#e0fe56]' : 'bg-[#333433]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
          enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
