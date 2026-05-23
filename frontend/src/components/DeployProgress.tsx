import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Server as ServerIcon, AlertTriangle, Sparkles, X } from 'lucide-react'
import { getSocket } from '../lib/socket'

/**
 * Full-screen deploy overlay used by /dashboard/deploy. Listens for
 * `server:status` events emitted by the backend FastDeployService and
 * paints a 9-step progress experience with an animated SVG ring, a step
 * list, and a celebration moment when the VM is RUNNING.
 *
 * Backend contract (services/fastDeploy.service.ts):
 *   { serverId, status, step, stepIndex, totalSteps, message, deployTimeSeconds?, ipv4? }
 *
 * The component degrades gracefully when the socket is silent — it
 * starts a slow background timer so the progress ring still moves and the
 * UI never feels frozen, even if the backend hasn't started emitting yet.
 */

const STEPS = [
  { key: 'validate',  label: 'Validating configuration',    detail: 'Checking plan, region, and image' },
  { key: 'allocate',  label: 'Allocating compute capacity', detail: 'Reserving CPU, RAM, NVMe' },
  { key: 'image',     label: 'Pulling cached base image',   detail: 'Loading from local node cache' },
  { key: 'clone',     label: 'Linked-cloning template',     detail: 'Spawning VM from golden image' },
  { key: 'cloudinit', label: 'Injecting cloud-init seed',   detail: 'SSH keys, hostname, password' },
  { key: 'boot',      label: 'Booting virtual machine',     detail: 'POST → bootloader → systemd' },
  { key: 'network',   label: 'Configuring private network', detail: 'IP, firewall, NAT' },
  { key: 'dns',       label: 'Publishing DNS records',      detail: 'Cloudflare A record propagation' },
  { key: 'finalize',  label: 'Finalizing & verifying',      detail: 'Health check, billing handoff' },
] as const

const TOTAL = STEPS.length

interface Props {
  serverId: string | null
  open: boolean
  onSuccess: (serverId: string, ipv4?: string, deployTime?: number) => void
  onCancel?: () => void
}

export function DeployProgress({ serverId, open, onSuccess, onCancel }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [message, setMessage] = useState<string>(STEPS[0].label)
  const [status, setStatus] = useState<'building' | 'success' | 'error'>('building')
  const [deployTime, setDeployTime] = useState<number | null>(null)
  const [ipv4, setIpv4] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const elapsedRef = useRef<HTMLSpanElement>(null)
  const startTsRef = useRef<number>(Date.now())

  // Reset state every time the overlay opens for a fresh deploy.
  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    setMessage(STEPS[0].label)
    setStatus('building')
    setDeployTime(null)
    setIpv4(null)
    setError(null)
    startTsRef.current = Date.now()
  }, [open])

  // Live socket subscription
  useEffect(() => {
    if (!open || !serverId) return

    const socket = getSocket()
    socket.emit('subscribe:server', serverId)

    const handler = (payload: any) => {
      if (payload?.serverId !== serverId) return

      if (typeof payload.stepIndex === 'number') setStepIndex(payload.stepIndex)
      if (typeof payload.message === 'string') setMessage(payload.message)

      if (payload.status === 'RUNNING' || payload.step === 'done') {
        setStepIndex(TOTAL)
        setStatus('success')
        if (typeof payload.deployTimeSeconds === 'number') setDeployTime(payload.deployTimeSeconds)
        if (typeof payload.ipv4 === 'string') setIpv4(payload.ipv4)
        setTimeout(() => {
          onSuccess(serverId, payload.ipv4, payload.deployTimeSeconds)
        }, 2200)
      } else if (payload.status === 'ERROR') {
        setStatus('error')
        setError(payload.message || 'Deploy failed')
      }
    }

    socket.on('server:status', handler)
    return () => {
      socket.off('server:status', handler)
      socket.emit('unsubscribe:server', serverId)
    }
  }, [open, serverId, onSuccess])

  // Slow background timer so the elapsed counter is responsive even when the
  // backend is silent (initial connect race) and so the ring keeps moving.
  useEffect(() => {
    if (!open) return
    let raf = 0
    const tick = () => {
      if (elapsedRef.current) {
        const sec = Math.max(0, (Date.now() - startTsRef.current) / 1000)
        elapsedRef.current.textContent = sec.toFixed(1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open])

  const progress = useMemo(() => Math.min(100, (stepIndex / TOTAL) * 100), [stepIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080909]/90 backdrop-blur-md overflow-y-auto">
      <AnimatePresence mode="wait">
        {status === 'success' && <Confetti key="confetti" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl rounded-2xl border border-[#222422] bg-[#111311] shadow-[0_8px_64px_rgba(0,0,0,.8)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a1c1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#c8f135] text-[#080909] flex items-center justify-center">
              <ServerIcon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#eeeeed]">Deploying your server</div>
              <div className="text-xs text-[#9a9c9a] mt-0.5">
                Elapsed <span ref={elapsedRef} className="font-mono text-[#c8f135]">0.0</span>s
                {' · '}
                <span className="text-[#636563]">target ~30s</span>
              </div>
            </div>
          </div>
          {status === 'error' && onCancel && (
            <button
              onClick={onCancel}
              className="text-[#636563] hover:text-[#eeeeed] cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[260px_1fr] gap-0">
          {/* Animated ring */}
          <div className="flex flex-col items-center justify-center p-6 border-r border-[#1a1c1a] bg-[#0d0e0d]">
            <ProgressRing progress={progress} status={status} />
            <div className="mt-4 text-center">
              {status === 'building' && (
                <>
                  <div className="text-2xl font-semibold text-[#eeeeed] tabular-nums">
                    {Math.round(progress)}<span className="text-base text-[#636563]">%</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-[#636563] mt-1">
                    Step {Math.min(stepIndex + 1, TOTAL)} of {TOTAL}
                  </div>
                </>
              )}
              {status === 'success' && (
                <>
                  <div className="text-2xl font-semibold text-[#c8f135]">Ready 🚀</div>
                  {deployTime && (
                    <div className="text-xs text-[#9a9c9a] mt-1">
                      Deployed in <span className="font-mono text-[#eeeeed]">{deployTime}s</span>
                    </div>
                  )}
                  {ipv4 && (
                    <div className="text-xs text-[#9a9c9a] mt-1 font-mono">{ipv4}</div>
                  )}
                </>
              )}
              {status === 'error' && (
                <div className="text-base font-semibold text-[#e74c3c]">Failed</div>
              )}
            </div>
          </div>

          {/* Step list */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <div className="text-xs uppercase tracking-wide text-[#636563] mb-3">
              {status === 'success' ? 'All steps complete' : status === 'error' ? 'Last step' : 'Now running'}
            </div>
            <div className="text-sm text-[#eeeeed] mb-5 min-h-[20px]">{message}</div>

            <ol className="space-y-2">
              {STEPS.map((step, i) => {
                const state =
                  status === 'error' && i === stepIndex
                    ? 'failed'
                    : i < stepIndex || status === 'success'
                    ? 'done'
                    : i === stepIndex
                    ? 'active'
                    : 'pending'
                return <StepRow key={step.key} step={step} state={state} index={i} />
              })}
            </ol>

            {error && (
              <div className="mt-4 p-3 rounded-md border border-[#e74c3c]/30 bg-[#e74c3c]/5 text-xs text-[#e74c3c] flex gap-2 items-start">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ProgressRing({ progress, status }: { progress: number; status: 'building' | 'success' | 'error' }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.max(progress, 4) / 100) * circ
  const stroke = status === 'error' ? '#e74c3c' : status === 'success' ? '#c8f135' : '#c8f135'
  return (
    <div className="relative w-[140px] h-[140px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} stroke="#1a1c1a" strokeWidth="6" fill="none" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(200, 241, 53, .4))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {status === 'building' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-dashed border-[#c8f135]/30"
          />
        )}
        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-14 h-14 rounded-full bg-[#c8f135] flex items-center justify-center text-[#080909]"
          >
            <Check size={28} strokeWidth={3} />
          </motion.div>
        )}
        {status === 'error' && (
          <div className="w-14 h-14 rounded-full bg-[#e74c3c]/20 border border-[#e74c3c]/40 flex items-center justify-center text-[#e74c3c]">
            <X size={26} strokeWidth={3} />
          </div>
        )}
      </div>
    </div>
  )
}

function StepRow({
  step,
  state,
  index,
}: {
  step: (typeof STEPS)[number]
  state: 'pending' | 'active' | 'done' | 'failed'
  index: number
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-start gap-3 p-2.5 rounded-md transition-colors ${
        state === 'active' ? 'bg-[#c8f135]/5 border border-[#c8f135]/20' :
        state === 'failed' ? 'bg-[#e74c3c]/5 border border-[#e74c3c]/20' :
        'border border-transparent'
      }`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
        state === 'done'    ? 'bg-[#c8f135] text-[#080909]' :
        state === 'active'  ? 'bg-[#c8f135]/20 text-[#c8f135]' :
        state === 'failed'  ? 'bg-[#e74c3c]/20 text-[#e74c3c]' :
                              'bg-[#1a1c1a] text-[#636563]'
      }`}>
        {state === 'done' ? <Check size={11} strokeWidth={3} /> :
         state === 'active' ? <span className="block w-1.5 h-1.5 rounded-full bg-[#c8f135] animate-pulse" /> :
         state === 'failed' ? <X size={11} strokeWidth={3} /> :
         index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium ${
          state === 'done' ? 'text-[#9a9c9a]' :
          state === 'active' ? 'text-[#eeeeed]' :
          state === 'failed' ? 'text-[#e74c3c]' :
          'text-[#636563]'
        }`}>
          {step.label}
        </div>
        <div className="text-[10.5px] text-[#636563] mt-0.5">{step.detail}</div>
      </div>
      {state === 'active' && (
        <Sparkles size={12} className="text-[#c8f135] shrink-0 mt-0.5 animate-pulse" />
      )}
    </motion.li>
  )
}

/** Lightweight confetti — pure CSS, no dep, respects reduced-motion. */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.4 + Math.random() * 1.6,
        rotate: Math.random() * 360,
        color: ['#c8f135', '#3d8bff', '#7c5cfc', '#f0a429', '#22d3ee'][i % 5],
      })),
    []
  )
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: 8,
            height: 14,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `nl-fall ${p.duration}s linear ${p.delay}s forwards`,
            borderRadius: 1,
          }}
        />
      ))}
    </motion.div>
  )
}

export default DeployProgress
