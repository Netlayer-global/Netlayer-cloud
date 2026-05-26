import { useState } from 'react'
import {
  Clock, Globe, HardDrive, Network, Shield, Zap,
} from 'lucide-react'
import { useInView } from '../../utils/animations'

/**
 * PerformanceSection — split layout. Left side animates benchmark bars
 * with a toggle to overlay industry-average. Right side lists 6 platform
 * differentiators (EPYC Gen4, all-NVMe, 25 Gbps, DDoS, fast deploy, KVM).
 */

const BENCHMARKS = [
  { label: 'NVMe Sequential Read',  value: '14.2 GB/s',   pct: 92, vs: 38 },
  { label: 'NVMe Sequential Write', value: '8.7 GB/s',    pct: 71, vs: 30 },
  { label: 'Network Throughput',    value: '25 Gbps',     pct: 98, vs: 22 },
  { label: 'CPU Single-Thread',     value: '5.8 GHz',     pct: 82, vs: 50 },
  { label: 'Deploy Time',           value: '15 seconds',  pct: 96, vs: 18 },
]

const FEATURES = [
  { Icon: Zap,        title: 'AMD EPYC Gen4 processors', desc: 'Latest generation with up to 192 cores per node' },
  { Icon: HardDrive,  title: 'All-NVMe storage',         desc: 'Every plan includes NVMe SSD, not SATA or spinning disk' },
  { Icon: Network,    title: '25 Gbps+ network',         desc: 'Private VLAN, BGP anycast, anti-spoofing included' },
  { Icon: Shield,     title: 'Hardware DDoS protection', desc: 'Layer 3/4/7 filtering at network edge, always on' },
  { Icon: Clock,      title: '30-second provisioning',   desc: 'Linked clone pipeline, pre-cached images, instant boot' },
  { Icon: Globe,      title: 'KVM hypervisor',           desc: 'No containers pretending to be VMs. Real hardware isolation' },
]

export function PerformanceSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const [showVs, setShowVs] = useState(false)

  return (
    <section
      ref={ref}
      className="py-20 px-4 sm:px-6"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div>
          <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
            PERFORMANCE
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Built on bare metal performance
          </h2>
          <p className="mt-4" style={{ fontSize: 14, color: 'var(--t-med)' }}>
            Every plan runs on AMD EPYC Gen4 or Intel Xeon processors with all-NVMe storage.
          </p>

          <div className="mt-6 mb-8 flex items-center gap-2">
            <button
              onClick={() => setShowVs(!showVs)}
              className="text-[11px] inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full transition-colors cursor-pointer"
              style={{
                background: showVs ? 'var(--brand-d)' : 'var(--nl-2)',
                border: `1px solid ${showVs ? 'var(--brand-b)' : 'var(--b-default)'}`,
                color: showVs ? 'var(--brand)' : 'var(--t-med)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: showVs ? 'var(--brand)' : 'var(--t-low)' }}
              />
              vs. industry average
            </button>
          </div>

          <div className="space-y-4">
            {BENCHMARKS.map((b, idx) => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 12, color: 'var(--t-med)' }}>{b.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{b.value}</span>
                </div>
                <div
                  className="relative rounded-full overflow-hidden"
                  style={{ background: 'var(--b-default)', height: 6 }}
                >
                  {showVs && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: 'var(--t-off)',
                        width: inView ? `${b.vs}%` : '0%',
                        transition: `width 1.2s cubic-bezier(.16,1,.3,1) ${idx * 80}ms`,
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--brand), #a8e620)',
                      width: inView ? `${b.pct}%` : '0%',
                      transition: `width 1.4s cubic-bezier(.16,1,.3,1) ${idx * 80 + 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--brand)' }}>
            WHY NETLAYER
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            The infrastructure difference
          </h2>

          <div className="mt-8 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                >
                  <f.Icon size={14} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--t-low)', lineHeight: 1.55 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
