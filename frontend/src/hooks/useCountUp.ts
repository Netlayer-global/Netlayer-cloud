import { useEffect, useRef, useState } from 'react'

interface Options {
  to: number
  duration?: number    // ms, default 1500
  start?: number       // default 0
  decimals?: number    // default 0
  /** Only animate when this becomes true. */
  enabled?: boolean
}

/**
 * Eased number ramp (cubic-out). Pairs with useInView so stat counters
 * only run when the section enters the viewport.
 */
export function useCountUp({ to, duration = 1500, start = 0, decimals = 0, enabled = true }: Options) {
  const [value, setValue] = useState(start)
  const startTime = useRef<number | null>(null)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    startTime.current = null

    const tick = (now: number) => {
      if (startTime.current === null) startTime.current = now
      const elapsed = now - startTime.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)   // ease-out cubic
      const current = start + (to - start) * eased
      setValue(parseFloat(current.toFixed(decimals)))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [to, duration, start, decimals, enabled])

  return value
}
