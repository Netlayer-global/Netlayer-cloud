const STACK = [
  'KVM',
  'Proxmox',
  'Ubuntu',
  'Debian',
  'CentOS',
  'AlmaLinux',
  'Fedora',
  'Windows Server',
  'Docker',
  'Kubernetes',
]

export function TechStack() {
  return (
    <section className="py-20 border-y border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-8">
          Built on battle-tested infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {STACK.map((s) => (
            <span key={s} className="text-[15px] text-gray-500 font-semibold tracking-wide opacity-70 hover:opacity-100 transition-opacity">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
