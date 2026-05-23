import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, CreditCard, Hexagon, Key, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { authAPI, sshAPI, onboardingAPI } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { AddCreditModal } from '../components/billing/AddCreditModal'
import { formatCurrency } from '../lib/utils'

/**
 * /dashboard/onboarding — first-run wizard.
 *
 * 4 steps: welcome → SSH key → balance check → first deploy.
 *
 * The wizard runs without the dashboard layout to keep the experience
 * full-screen and focused. ProtectedRoute ensures the user is authed.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState(0)
  const [sshName, setSshName] = useState(`${user?.firstName || 'My'} workstation`)
  const [sshPublicKey, setSshPublicKey] = useState('')
  const [topUpOpen, setTopUpOpen] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authAPI.getMe().then((r) => r.data.data),
    refetchOnWindowFocus: true,
  })

  const balance = me?.balance ?? user?.balance ?? 0

  const addSshKey = useMutation({
    mutationFn: () => sshAPI.create(sshName, sshPublicKey),
    onSuccess: () => {
      toast.success('SSH key added')
      setStep(2)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Could not add key'),
  })

  const finish = useMutation({
    mutationFn: () => onboardingAPI.complete(),
    onSuccess: () => {
      if (me) setUser({ ...me, onboardingDone: true } as any)
      toast.success('Setup complete!')
    },
  })

  const proceedToDeploy = (params: string) => {
    finish.mutate(undefined, {
      onSettled: () => navigate(`/dashboard/deploy${params}`),
    })
  }

  const skip = () => {
    finish.mutate(undefined, {
      onSettled: () => navigate('/dashboard/home'),
    })
  }

  return (
    <div className="min-h-screen bg-[#0d0e0d] text-[#e8e8e6] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-10 bg-[#e0fe56]' : i < step ? 'w-6 bg-[#e0fe56]/40' : 'w-6 bg-[#252625]'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step
              key="welcome"
              icon={<Hexagon size={36} className="text-[#e0fe56]" />}
              title={`Welcome to NetLayer Cloud, ${user?.firstName} 👋`}
              subtitle="Let's get you set up in 3 quick steps. Takes about a minute."
              primary={{ label: "Let's start", onClick: () => setStep(1) }}
              secondary={{ label: 'Skip setup', onClick: skip }}
            />
          )}

          {step === 1 && (
            <Step
              key="ssh"
              icon={<Key size={36} className="text-[#e0fe56]" />}
              title="Add an SSH key"
              subtitle="SSH keys let you log into servers without a password. You can also skip this and use a generated root password."
            >
              <div className="space-y-3">
                <Input label="Key name" value={sshName} onChange={(e) => setSshName(e.target.value)} />
                <div>
                  <label className="block text-xs text-[#a0a09e] mb-1.5">Public key</label>
                  <textarea
                    value={sshPublicKey}
                    onChange={(e) => setSshPublicKey(e.target.value)}
                    placeholder="ssh-ed25519 AAAA..."
                    rows={5}
                    className="w-full bg-[#161716] border border-[#2a2b2a] rounded-md px-3 py-2 text-xs font-mono text-[#e8e8e6] placeholder-[#6a6a68] focus:border-[#e0fe56] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        if (text.startsWith('ssh-')) setSshPublicKey(text.trim())
                        else toast.warning('Clipboard does not contain an SSH key')
                      } catch {
                        toast.error('Clipboard access denied')
                      }
                    }}
                    className="text-xs text-[#e0fe56] hover:underline mt-1.5 cursor-pointer"
                  >
                    Paste from clipboard
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
                >
                  Skip for now →
                </button>
                <Button
                  onClick={() => addSshKey.mutate()}
                  loading={addSshKey.isPending}
                  disabled={!sshPublicKey || !sshPublicKey.startsWith('ssh-')}
                >
                  Add key & continue
                </Button>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              key="balance"
              icon={<CreditCard size={36} className="text-[#e0fe56]" />}
              title="Your account balance"
              subtitle={
                balance > 0
                  ? "You're ready to deploy your first server."
                  : 'Add credit to deploy your first server.'
              }
            >
              <div className="bg-[#161716] border border-[#2a2b2a] rounded-lg p-6 text-center">
                <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">Current balance</div>
                <div className="text-4xl font-medium text-[#e0fe56] mt-2 tabular-nums">
                  {formatCurrency(balance)}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                {balance > 0 ? (
                  <Button onClick={() => setStep(3)}>
                    Continue <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setTopUpOpen(true)}>Add credit</Button>
                )}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              key="deploy"
              icon={<Rocket size={36} className="text-[#e0fe56]" />}
              title="Deploy your first server"
              subtitle="We'll pre-configure a recommended setup. You can always tweak it before deploying."
            >
              <div className="bg-[#161716] border border-[#2a2b2a] rounded-lg p-5">
                <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-3">
                  Recommended starter
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <Spec label="Region" value="🇮🇳 Mumbai" />
                  <Spec label="Plan" value="c2.small" />
                  <Spec label="OS" value="Ubuntu 22.04" />
                </div>
                <div className="mt-3 text-xs text-[#a0a09e]">
                  ~₹149/month · 1 vCPU · 2 GB RAM · 40 GB NVMe
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => proceedToDeploy('')}
                  className="text-sm text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
                >
                  Explore all options →
                </button>
                <Button onClick={() => proceedToDeploy('?region=mumbai&plan=c2-small&os=ubuntu-22-04')}>
                  Deploy now
                </Button>
              </div>
            </Step>
          )}
        </AnimatePresence>
      </div>

      <AddCreditModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        user={user || undefined}
        onSuccess={() => {
          setTopUpOpen(false)
          setTimeout(() => setStep(3), 600)
        }}
      />
    </div>
  )
}

function Step({
  icon,
  title,
  subtitle,
  children,
  primary,
  secondary,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children?: React.ReactNode
  primary?: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-2xl p-8"
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#e0fe56]/10 border border-[#e0fe56]/20 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-medium text-[#e8e8e6]">{title}</h2>
        <p className="text-sm text-[#a0a09e] mt-2 max-w-md">{subtitle}</p>
      </div>

      {children}

      {(primary || secondary) && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {primary && (
            <Button onClick={primary.onClick} size="lg" className="w-full max-w-xs">
              {primary.label}
            </Button>
          )}
          {secondary && (
            <button
              type="button"
              onClick={secondary.onClick}
              className="text-sm text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className="text-[#e8e8e6] mt-0.5">{value}</div>
    </div>
  )
}
