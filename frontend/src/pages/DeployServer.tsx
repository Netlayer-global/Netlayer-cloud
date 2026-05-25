import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { catalogAPI, serverAPI, sshAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { cn, formatCurrency } from '../lib/utils'
import { AddCreditModal } from '../components/billing/AddCreditModal'
import { DeployProgress } from '../components/DeployProgress'
import { useAuthStore } from '../store/authStore'
import type { Plan, Region, OsTemplate } from '../types'

const STEPS = ['Location', 'Plan', 'OS', 'Configure'] as const
type StepKey = typeof STEPS[number]

const generateHostname = () => {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return 'srv-' + Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join('')
}

const generatePassword = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  return Array.from({ length: 16 }, () => a[Math.floor(Math.random() * a.length)]).join('')
}

export default function DeployServer() {
  const navigate = useNavigate()
  const [stepIdx, setStepIdx] = useState(0)
  const [region, setRegion] = useState<Region | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [os, setOs] = useState<OsTemplate | null>(null)
  const [hostname, setHostname] = useState(generateHostname())
  const [sshKeyId, setSshKeyId] = useState<string>('')
  const [autoPassword, setAutoPassword] = useState(true)
  const [rootPassword, setRootPassword] = useState(generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionedId, setProvisionedId] = useState<string | null>(null)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [topUpShortfall, setTopUpShortfall] = useState<number | undefined>()
  const user = useAuthStore((s) => s.user)

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogAPI.getRegions().then((r) => r.data.data),
  })
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => catalogAPI.getPlans().then((r) => r.data.data),
  })
  const { data: osList = [] } = useQuery({
    queryKey: ['os'],
    queryFn: () => catalogAPI.getOS().then((r) => r.data.data),
  })
  const { data: sshKeys = [] } = useQuery({
    queryKey: ['ssh-keys'],
    queryFn: () => sshAPI.list().then((r) => r.data.data),
  })

  const linuxOs = osList.filter((o) => o.family === 'LINUX')
  const windowsOs = osList.filter((o) => o.family === 'WINDOWS')

  const create = useMutation({
    mutationFn: () =>
      serverAPI.create({
        name: hostname,
        planId: plan!.id,
        regionId: region!.id,
        osTemplateId: os!.id,
        sshKeyId: sshKeyId || undefined,
        rootPassword,
      }),
    onSuccess: (res) => {
      const serverId = res.data.data.id
      setProvisionedId(serverId)
      // DeployProgress overlay handles socket subscription, progress UI, and redirect.
    },
    onError: (e: any) => {
      const code = e.response?.data?.code
      const msg = e.response?.data?.error || 'Failed to deploy'
      if (code === 'INSUFFICIENT_BALANCE') {
        // Parse shortfall out of the message: "Add INR 23.59 to deploy this plan."
        const m = /(\d+(?:\.\d+)?)/.exec(msg)
        const shortfall = m ? parseFloat(m[1]) : undefined
        setTopUpShortfall(shortfall)
        setTopUpOpen(true)
        toast.warning(msg)
      } else {
        toast.error(msg)
      }
      setProvisioning(false)
    },
  })

  const stepValid: Record<StepKey, boolean> = {
    Location: !!region,
    Plan: !!plan,
    OS: !!os,
    Configure: !!hostname && !!rootPassword && rootPassword.length >= 8,
  }

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
  }

  const handleDeploy = () => {
    if (!stepValid.Configure || !plan || !region || !os) return
    setProvisioning(true)
    create.mutate()
  }

  // Default selections
  useEffect(() => {
    if (regions.length && !region) {
      setRegion(regions.find((r) => r.slug === 'mumbai') || regions[0])
    }
  }, [regions, region])

  // Round 19: prefill from URL params (used by Onboarding "deploy now" button).
  // Auto-advances to Configure when all three are valid.
  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (!regions.length || !plans.length || !osList.length) return
    const r = searchParams.get('region')
    const p = searchParams.get('plan')
    const o = searchParams.get('os')
    let advanced = false
    if (r && !region) {
      const match = regions.find((x) => x.slug === r)
      if (match) { setRegion(match); advanced = true }
    }
    if (p && !plan) {
      const match = plans.find((x) => x.slug === p)
      if (match) { setPlan(match); advanced = true }
    }
    if (o && !os) {
      const match = osList.find((x) => x.slug === o)
      if (match) { setOs(match); advanced = true }
    }
    if (advanced && r && p && o) setStepIdx(STEPS.length - 1)
  }, [regions, plans, osList, searchParams, region, plan, os])

  return (
    <div className="max-w-7xl mx-auto">
      <DeployProgress
        open={provisioning}
        serverId={provisionedId}
        onSuccess={(serverId) => navigate(`/dashboard/servers/${serverId}`)}
        onCancel={() => {
          setProvisioning(false)
          setProvisionedId(null)
        }}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Deploy server</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Configure and provision a new server.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            disabled={i > stepIdx && !stepValid[STEPS[i - 1]]}
            onClick={() => i <= stepIdx && setStepIdx(i)}
            className={cn(
              'flex items-center gap-2 h-9 px-3 rounded-md text-xs whitespace-nowrap transition-colors',
              i === stepIdx
                ? 'bg-[#1e1f1e] text-[#e8e8e6] border border-[#333433] cursor-pointer'
                : i < stepIdx
                ? 'text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer'
                : 'text-[#6a6a68] cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                i === stepIdx
                  ? 'bg-[#e0fe56] text-[#0d0e0d]'
                  : i < stepIdx
                  ? 'bg-[#4ade80]/20 text-[#4ade80]'
                  : 'bg-[#252625] text-[#6a6a68]'
              )}
            >
              {i < stepIdx ? <Check size={11} /> : i + 1}
            </span>
            {s}
            {i < STEPS.length - 1 && (
              <span className="text-[#333433] mx-1">â†’</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Step content */}
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-6 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {STEPS[stepIdx] === 'Location' && (
                <Step1Location regions={regions} selected={region} onSelect={setRegion} />
              )}
              {STEPS[stepIdx] === 'Plan' && (
                <Step2Plan plans={plans} selected={plan} onSelect={setPlan} />
              )}
              {STEPS[stepIdx] === 'OS' && (
                <Step3OS linux={linuxOs} windows={windowsOs} selected={os} onSelect={setOs} />
              )}
              {STEPS[stepIdx] === 'Configure' && (
                <Step4Configure
                  hostname={hostname}
                  setHostname={setHostname}
                  sshKeys={sshKeys}
                  sshKeyId={sshKeyId}
                  setSshKeyId={setSshKeyId}
                  autoPassword={autoPassword}
                  setAutoPassword={setAutoPassword}
                  rootPassword={rootPassword}
                  setRootPassword={setRootPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-[#2a2b2a]">
            <Button
              variant="ghost"
              onClick={() => stepIdx > 0 && setStepIdx(stepIdx - 1)}
              disabled={stepIdx === 0}
            >
              Back
            </Button>
            {stepIdx < STEPS.length - 1 && (
              <Button onClick={handleNext} disabled={!stepValid[STEPS[stepIdx]]}>
                Continue â†’
              </Button>
            )}
          </div>
        </div>

        {/* Sticky summary */}
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 lg:sticky lg:top-20">
          <h3 className="font-medium text-[#e8e8e6] mb-4">Order summary</h3>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Region" value={region ? `${region.flag} ${region.city}` : 'â€”'} />
            <SummaryRow
              label="Plan"
              value={
                plan ? (
                  <span>
                    {plan.name}
                    <div className="text-[11px] text-[#6a6a68]">
                      {plan.cpu} CPU Â· {plan.ramGB}GB Â· {plan.diskGB}GB
                    </div>
                  </span>
                ) : (
                  'â€”'
                )
              }
            />
            <SummaryRow label="OS" value={os ? os.name : 'â€”'} />
            <SummaryRow label="Hostname" value={<span className="font-mono text-xs">{hostname || 'â€”'}</span>} />
          </div>
          <div className="border-t border-[#2a2b2a] my-4 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#a0a09e]">Monthly</span>
              <span className="text-[#e8e8e6] font-medium">
                {plan ? `${formatCurrency(plan.priceInr)}/mo` : 'â€”'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6a6a68]">Hourly</span>
              <span className="text-[#a0a09e]">
                {plan ? `${formatCurrency(plan.priceHourly)}/hr` : 'â€”'}
              </span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!Object.values(stepValid).every(Boolean)}
            onClick={handleDeploy}
            loading={create.isPending}
          >
            Deploy server
          </Button>
        </div>
      </div>

      <AddCreditModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        shortfall={topUpShortfall}
        user={user || undefined}
        onSuccess={() => {
          setTopUpOpen(false)
          // Auto-retry the deploy after the wallet has been credited.
          setTimeout(() => create.mutate(), 600)
        }}
      />
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[#e8e8e6]">{value}</div>
    </div>
  )
}

// â”€â”€â”€ Step 1: Location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Step1Location({
  regions,
  selected,
  onSelect,
}: {
  regions: Region[]
  selected: Region | null
  onSelect: (r: Region) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-medium text-[#e8e8e6] mb-1">Choose a location</h2>
      <p className="text-sm text-[#a0a09e] mb-5">
        Pick the region closest to your users for the best latency.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {regions.map((r) => {
          const isSelected = selected?.id === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className={cn(
                'relative text-left p-4 rounded-lg border cursor-pointer transition-colors',
                isSelected
                  ? 'border-[#e0fe56] bg-[#e0fe56]/5'
                  : 'border-[#2a2b2a] bg-[#161716] hover:border-[#333433]'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#e0fe56] rounded-full flex items-center justify-center">
                  <Check size={12} className="text-[#0d0e0d]" />
                </div>
              )}
              <div className="text-2xl mb-2">{r.flag}</div>
              <div className="font-medium text-[#e8e8e6]">{r.city}</div>
              <div className="text-xs text-[#6a6a68]">{r.country}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-[#4ade80] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full" />~12ms latency
                </span>
                {r.slug === 'mumbai' && (
                  <span className="text-[10px] text-[#e0fe56] bg-[#e0fe56]/10 border border-[#e0fe56]/30 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// â”€â”€â”€ Step 2: Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Step2Plan({
  plans,
  selected,
  onSelect,
}: {
  plans: Plan[]
  selected: Plan | null
  onSelect: (p: Plan) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-medium text-[#e8e8e6] mb-1">Choose a plan</h2>
      <p className="text-sm text-[#a0a09e] mb-5">All plans come with NVMe SSD and unmetered bandwidth.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {plans.map((p) => {
          const isSelected = selected?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={cn(
                'relative text-left p-4 rounded-lg border cursor-pointer transition-colors',
                isSelected
                  ? 'border-[#e0fe56] bg-[#e0fe56]/5'
                  : 'border-[#2a2b2a] bg-[#161716] hover:border-[#333433]'
              )}
            >
              {p.isPopular && (
                <span className="absolute -top-2 left-4 bg-[#e0fe56] text-[#0d0e0d] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  Most popular
                </span>
              )}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#e0fe56] rounded-full flex items-center justify-center">
                  <Check size={12} className="text-[#0d0e0d]" />
                </div>
              )}
              <div className="font-medium text-[#e8e8e6] mb-2">{p.name}</div>
              <div className="text-xs text-[#a0a09e] grid grid-cols-2 gap-y-1">
                <div>{p.cpu} vCPU</div>
                <div>{p.ramGB} GB RAM</div>
                <div>{p.diskGB} GB SSD</div>
                <div>{p.bandwidthTB} TB BW</div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2a2b2a]">
                <div className="text-base font-medium text-[#e8e8e6]">
                  {formatCurrency(p.priceInr)}<span className="text-xs text-[#6a6a68]">/mo</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// â”€â”€â”€ Step 3: OS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Step3OS({
  linux,
  windows,
  selected,
  onSelect,
}: {
  linux: OsTemplate[]
  windows: OsTemplate[]
  selected: OsTemplate | null
  onSelect: (o: OsTemplate) => void
}) {
  const renderGroup = (title: string, items: OsTemplate[]) => (
    <div>
      <div className="text-xs text-[#6a6a68] uppercase tracking-wide mb-2">{title}</div>
      <div className="grid sm:grid-cols-3 gap-2">
        {items.map((o) => {
          const isSelected = selected?.id === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o)}
              className={cn(
                'relative text-left p-3 rounded-md border cursor-pointer transition-colors',
                isSelected
                  ? 'border-[#e0fe56] bg-[#e0fe56]/5'
                  : 'border-[#2a2b2a] bg-[#161716] hover:border-[#333433]'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[#e0fe56] rounded-full flex items-center justify-center">
                  <Check size={10} className="text-[#0d0e0d]" />
                </div>
              )}
              <div className="text-sm font-medium text-[#e8e8e6]">{o.name}</div>
              <div className="text-[11px] text-[#6a6a68] mt-0.5 capitalize">{o.family.toLowerCase()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-lg font-medium text-[#e8e8e6] mb-1">Select an OS</h2>
      <p className="text-sm text-[#a0a09e] mb-5">Pick a base operating system image.</p>
      <div className="space-y-5">
        {renderGroup('Linux', linux)}
        {windows.length > 0 && renderGroup('Windows', windows)}
      </div>
    </div>
  )
}

// â”€â”€â”€ Step 4: Configure â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Step4Configure({
  hostname,
  setHostname,
  sshKeys,
  sshKeyId,
  setSshKeyId,
  autoPassword,
  setAutoPassword,
  rootPassword,
  setRootPassword,
  showPassword,
  setShowPassword,
}: {
  hostname: string
  setHostname: (s: string) => void
  sshKeys: any[]
  sshKeyId: string
  setSshKeyId: (s: string) => void
  autoPassword: boolean
  setAutoPassword: (b: boolean) => void
  rootPassword: string
  setRootPassword: (s: string) => void
  showPassword: boolean
  setShowPassword: (b: boolean) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-medium text-[#e8e8e6] mb-1">Configure</h2>
      <p className="text-sm text-[#a0a09e] mb-5">Final details before deployment.</p>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Hostname</label>
          <div className="flex gap-2">
            <Input value={hostname} onChange={(e) => setHostname(e.target.value)} />
            <Button
              variant="secondary"
              size="md"
              onClick={() => setHostname(generateHostname())}
              type="button"
            >
              <RefreshCw size={13} />
            </Button>
          </div>
        </div>

        <Select
          label="SSH key (optional)"
          value={sshKeyId}
          onChange={(e) => setSshKeyId(e.target.value)}
        >
          <option value="">No SSH key (use root password)</option>
          {sshKeys.map((k: any) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </Select>

        <div>
          <label className="flex items-center gap-2 text-xs text-[#a0a09e] mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPassword}
              onChange={(e) => {
                setAutoPassword(e.target.checked)
                if (e.target.checked) setRootPassword(generatePassword())
              }}
              className="cursor-pointer accent-[#e0fe56]"
            />
            Auto-generate root password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={rootPassword}
              onChange={(e) => setRootPassword(e.target.value)}
              disabled={autoPassword}
              className="font-mono text-xs pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-[9px] text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {rootPassword.length < 8 && (
            <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters.</p>
          )}
        </div>
      </div>
    </div>
  )
}
