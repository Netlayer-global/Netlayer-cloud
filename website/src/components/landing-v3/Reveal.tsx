import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Reveal — lightweight scroll-into-view fade-up wrapper (no framer-motion
 * needed for the home page). Uses IntersectionObserver, runs once, and
 * respects prefers-reduced-motion.
 *
 * Wrap a section: <Reveal><MySection /></Reveal>. An optional `delay`
 * staggers siblings.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
}: {
  children: ReactNode
  delay?: number
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(true); return }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${delay}s, transform .6s cubic-bezier(.16,1,.3,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
