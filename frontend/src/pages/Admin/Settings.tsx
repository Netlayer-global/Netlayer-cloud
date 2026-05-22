import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'

export default function AdminSettings() {
  const qc = useQueryClient()
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminAPI.getSettings(),
  })

  const map = new Map<string, any>(settings.map((s: any) => [s.key, s.value]))
  const general = map.get('platform.general') || {}
  const reg = map.get('platform.registration') || {}
  const billing = map.get('platform.billing') || {}
  const security = map.get('platform.security') || {}
  const maintenance = map.get('platform.maintenance') || {}

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      adminAPI.updateSetting(key, value),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Platform settings</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Global configuration for NetLayer.</p>
      </div>

      <SettingsCard
        title="General"
        initial={general}
        onSave={(v) => save.mutate({ key: 'general', value: v })}
        loading={save.isPending}
        fields={[
          { key: 'name', label: 'Platform name', placeholder: 'NetLayer' },
          { key: 'supportEmail', label: 'Support email', type: 'email' },
          { key: 'supportPhone', label: 'Support phone' },
          { key: 'logoUrl', label: 'Logo URL' },
        ]}
      />

      <SettingsCard
        title="Registration & limits"
        initial={reg}
        onSave={(v) => save.mutate({ key: 'registration', value: v })}
        loading={save.isPending}
        fields={[
          { key: 'registrationEnabled', label: 'Allow registration', type: 'toggle' },
          { key: 'emailVerificationRequired', label: 'Require email verification', type: 'toggle' },
          { key: 'maxServersPerUser', label: 'Max servers per user', type: 'number' },
          { key: 'allowedCountries', label: 'Allowed countries', placeholder: '"all" or comma-separated codes' },
        ]}
      />

      <SettingsCard
        title="Billing"
        initial={billing}
        onSave={(v) => save.mutate({ key: 'billing', value: v })}
        loading={save.isPending}
        fields={[
          {
            key: 'defaultCurrency', label: 'Default currency', type: 'select',
            options: [
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
            ],
          },
          { key: 'taxRate', label: 'Tax rate %', type: 'number' },
          { key: 'taxLabel', label: 'Tax label', placeholder: 'GST / VAT / Tax' },
          { key: 'minBalance', label: 'Minimum balance (negative allowed)', type: 'number' },
          { key: 'gracePeriodDays', label: 'Grace period (days)', type: 'number' },
          { key: 'lowBalanceThreshold', label: 'Low balance alert threshold', type: 'number' },
        ]}
      />

      <SettingsCard
        title="Security"
        initial={security}
        onSave={(v) => save.mutate({ key: 'security', value: v })}
        loading={save.isPending}
        fields={[
          { key: 'jwtExpiryMinutes', label: 'JWT expiry (minutes)', type: 'number' },
          { key: 'maxLoginAttempts', label: 'Max login attempts before lock', type: 'number' },
          { key: 'lockDurationMinutes', label: 'Lock duration (minutes)', type: 'number' },
          { key: 'twoFactorRequiredForAdmins', label: '2FA required for admins', type: 'toggle' },
        ]}
      />

      <Card padding="p-5" className={cn(maintenance.enabled && 'border-red-900/60')}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#e8e8e6]">Maintenance mode</h3>
            <p className="text-xs text-[#a0a09e] mt-0.5">When enabled, all dashboards show a maintenance banner.</p>
          </div>
          <MaintenanceToggle
            value={!!maintenance.enabled}
            message={maintenance.message || ''}
            onSave={(enabled, message) =>
              save.mutate({ key: 'maintenance', value: { enabled, message } })
            }
            loading={save.isPending}
          />
        </div>
      </Card>
    </div>
  )
}

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'email' | 'number' | 'toggle' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
}

function SettingsCard({
  title, initial, fields, onSave, loading,
}: {
  title: string
  initial: any
  fields: FieldDef[]
  onSave: (v: any) => void
  loading: boolean
}) {
  const [form, setForm] = useState<any>(initial)
  useEffect(() => setForm(initial), [initial])

  return (
    <Card padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#e8e8e6]">{title}</h3>
        <Button size="sm" loading={loading} onClick={() => onSave(form)}>Save</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.type === 'toggle' ? 'sm:col-span-2' : ''}>
            {f.type === 'toggle' ? (
              <label className="flex items-center justify-between p-3 border border-[#2a2b2a] rounded-md cursor-pointer">
                <span className="text-sm text-[#e8e8e6]">{f.label}</span>
                <input
                  type="checkbox"
                  checked={!!form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                  className="cursor-pointer accent-[#e0fe56] h-4 w-4"
                />
              </label>
            ) : f.type === 'select' ? (
              <Select label={f.label} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : (
              <Input
                label={f.label}
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={form[f.key] ?? ''}
                onChange={(e) => {
                  const v = f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                  setForm({ ...form, [f.key]: v })
                }}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function MaintenanceToggle({
  value, message, onSave, loading,
}: {
  value: boolean; message: string; onSave: (enabled: boolean, message: string) => void; loading: boolean
}) {
  const [enabled, setEnabled] = useState(value)
  const [msg, setMsg] = useState(message)

  useEffect(() => { setEnabled(value); setMsg(message) }, [value, message])

  return (
    <div className="flex flex-col items-end gap-2 w-full max-w-md">
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors cursor-pointer',
          enabled ? 'bg-red-500' : 'bg-[#333433]'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-7' : 'translate-x-1'
          )}
        />
      </button>
      {enabled && (
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Maintenance message…"
          className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md px-3 py-2 text-sm h-20 focus:border-[#e0fe56] focus:outline-none resize-none"
        />
      )}
      <Button size="sm" loading={loading} onClick={() => onSave(enabled, msg)}>
        Save
      </Button>
    </div>
  )
}
