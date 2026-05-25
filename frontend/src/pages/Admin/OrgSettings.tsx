import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Receipt, FileText, Mail, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { orgSettingsAPI, type OrgSettings as OrgSettingsType } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const TABS = [
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'gst',          label: 'GST & Tax',    icon: Receipt },
  { key: 'invoicing',    label: 'Invoicing',    icon: FileText },
  { key: 'legal',        label: 'Email Routing', icon: Mail },
] as const

type TabKey = typeof TABS[number]['key']

export default function OrgSettings() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabKey>('organization')
  const [draft, setDraft] = useState<OrgSettingsType | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'org-settings'],
    queryFn: () => orgSettingsAPI.get().then((r: any) => r.data.data as OrgSettingsType),
  })

  useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  const save = useMutation({
    mutationFn: (section: TabKey) => {
      if (!draft) throw new Error('No draft')
      return orgSettingsAPI.update({ [section]: draft[section] } as any)
    },
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['admin', 'org-settings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to save'),
  })

  if (isLoading || !draft) {
    return <div className="text-sm text-[#a0a09e]">Loading…</div>
  }

  const setField = (section: TabKey, key: string, value: any) =>
    setDraft({ ...draft, [section]: { ...(draft[section] || {}), [key]: value } })

  const fields = (() => {
    const s = draft[tab] || {}
    if (tab === 'organization') {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Legal name" value={s.name || ''} onChange={(e) => setField(tab, 'name', e.target.value)} placeholder="Acme Cloud Pvt. Ltd." />
          <Input label="Website" value={s.website || ''} onChange={(e) => setField(tab, 'website', e.target.value)} />
          <Input label="Phone" value={s.phone || ''} onChange={(e) => setField(tab, 'phone', e.target.value)} />
          <Input label="Country" value={s.country || ''} onChange={(e) => setField(tab, 'country', e.target.value)} />
          <Input label="Address line 1" value={s.addressLine1 || ''} onChange={(e) => setField(tab, 'addressLine1', e.target.value)} className="sm:col-span-2" />
          <Input label="Address line 2" value={s.addressLine2 || ''} onChange={(e) => setField(tab, 'addressLine2', e.target.value)} className="sm:col-span-2" />
          <Input label="City" value={s.city || ''} onChange={(e) => setField(tab, 'city', e.target.value)} />
          <Input label="State / Province" value={s.state || ''} onChange={(e) => setField(tab, 'state', e.target.value)} />
          <Input label="Postal code" value={s.postalCode || ''} onChange={(e) => setField(tab, 'postalCode', e.target.value)} />
          <Input label="Country code" value={s.countryCode || ''} onChange={(e) => setField(tab, 'countryCode', e.target.value)} placeholder="IN" />
        </div>
      )
    }
    if (tab === 'gst') {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="GSTIN" value={s.gstin || ''} onChange={(e) => setField(tab, 'gstin', e.target.value)} placeholder="27AAAAA0000A1Z5" className="font-mono" />
          <Input label="PAN" value={s.pan || ''} onChange={(e) => setField(tab, 'pan', e.target.value)} className="font-mono" />
          <Input label="CIN" value={s.cin || ''} onChange={(e) => setField(tab, 'cin', e.target.value)} className="font-mono" />
          <Input label="HSN code (services)" value={s.hsnCode || ''} onChange={(e) => setField(tab, 'hsnCode', e.target.value)} placeholder="998319" />
          <Input label="Seller state code" value={s.sellerStateCode || ''} onChange={(e) => setField(tab, 'sellerStateCode', e.target.value)} placeholder="27" />
          <Select label="Fiscal year start" value={s.fiscalYearStart || 'april'} onChange={(e) => setField(tab, 'fiscalYearStart', e.target.value)}>
            <option value="april">April (India)</option>
            <option value="january">January (Calendar)</option>
          </Select>
          <Input label="Invoice prefix" value={s.invoicePrefix || ''} onChange={(e) => setField(tab, 'invoicePrefix', e.target.value)} placeholder="NL" />
          <Input label="Credit note prefix" value={s.creditNotePrefix || ''} onChange={(e) => setField(tab, 'creditNotePrefix', e.target.value)} placeholder="CN" />
          <Input label="Receipt prefix" value={s.receiptPrefix || ''} onChange={(e) => setField(tab, 'receiptPrefix', e.target.value)} placeholder="RC" />
          <div className="sm:col-span-2 text-[11px] text-[#6a6a68] bg-[#161716] border border-[#2a2b2a] rounded-md p-3">
            India tax invoices use a sequential, gap-free counter per fiscal year. Format: <code className="font-mono">{s.invoicePrefix || 'NL'}/2025-26/000001</code>. Existing invoices keep their numbering — only new invoices use the updated prefix.
          </div>
        </div>
      )
    }
    if (tab === 'invoicing') {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Payment terms (days)" type="number" value={s.paymentTermsDays ?? 7} onChange={(e) => setField(tab, 'paymentTermsDays', Number(e.target.value))} />
          <Input label="Cancel stuck orders after (hours)" type="number" value={s.cancelStuckOrdersAfterHours ?? 24} onChange={(e) => setField(tab, 'cancelStuckOrdersAfterHours', Number(e.target.value))} />
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#a0a09e] mb-1.5">Footer note (printed on every invoice)</label>
            <textarea
              value={s.footerNote || ''}
              onChange={(e) => setField(tab, 'footerNote', e.target.value)}
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md p-2 text-sm font-mono focus:border-[#e0fe56] focus:outline-none"
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
            <input
              type="checkbox"
              checked={!!s.autoSendOnCreate}
              onChange={(e) => setField(tab, 'autoSendOnCreate', e.target.checked)}
              className="cursor-pointer accent-[#e0fe56]"
            />
            Auto-send invoice email when invoice is generated
          </label>
          <label className="flex items-center gap-2 text-xs text-[#a0a09e] cursor-pointer">
            <input
              type="checkbox"
              checked={!!s.attachPdfToEmail}
              onChange={(e) => setField(tab, 'attachPdfToEmail', e.target.checked)}
              className="cursor-pointer accent-[#e0fe56]"
            />
            Attach PDF to invoice email
          </label>
        </div>
      )
    }
    if (tab === 'legal') {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Support email" value={s.supportEmail || ''} onChange={(e) => setField(tab, 'supportEmail', e.target.value)} placeholder="support@yourdomain.com" />
          <Input label="Sales email" value={s.salesEmail || ''} onChange={(e) => setField(tab, 'salesEmail', e.target.value)} placeholder="sales@yourdomain.com" />
          <Input label="Billing email" value={s.billingEmail || ''} onChange={(e) => setField(tab, 'billingEmail', e.target.value)} placeholder="billing@yourdomain.com" />
          <Input label="Legal email" value={s.legalEmail || ''} onChange={(e) => setField(tab, 'legalEmail', e.target.value)} placeholder="legal@yourdomain.com" />
          <Input label="Privacy email" value={s.privacyEmail || ''} onChange={(e) => setField(tab, 'privacyEmail', e.target.value)} placeholder="privacy@yourdomain.com" />
          <Input label="Abuse email" value={s.abuseEmail || ''} onChange={(e) => setField(tab, 'abuseEmail', e.target.value)} placeholder="abuse@yourdomain.com" />
          <div className="sm:col-span-2 text-[11px] text-[#6a6a68] bg-[#161716] border border-[#2a2b2a] rounded-md p-3">
            These emails appear in the public landing footer, abuse-report form, terms / privacy pages, and outbound transactional emails.
          </div>
        </div>
      )
    }
    return null
  })()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Organization settings</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Company identity, tax / GST configuration, invoice formatting, and the email addresses used in customer-facing surfaces.
        </p>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-[#161716] border border-[#2a2b2a] rounded-md p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded text-xs cursor-pointer transition-colors',
              tab === key ? 'bg-[#1e1f1e] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5">
        {fields}
        <div className="mt-5 pt-4 border-t border-[#2a2b2a] flex justify-end">
          <Button onClick={() => save.mutate(tab)} loading={save.isPending}>
            <Save size={13} className="mr-1" /> Save {TABS.find((t) => t.key === tab)?.label}
          </Button>
        </div>
      </div>
    </div>
  )
}
