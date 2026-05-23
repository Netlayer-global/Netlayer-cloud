import { useEffect, useRef, useState } from 'react'

interface CountUpOptions {
  to: number
  decimals?: number
  enabled?: boolean
  duration?: number
}

/**
 * Animated number counter. Supports two call shapes for backward compatibility:
 *
 *   const v = useCountUp(500_000, 1800, 0)         // returns formatted string
 *   const v = useCountUp({ to: 500_000, enabled }) // returns raw number
 *
 * The second form is the original API used by the old landing StatsBar.
 * The first form is the new ergonomics — returns a pre-formatted display string
 * so callers don't have to call toFixed/toLocaleString themselves.
 *
 * Both honour `prefers-reduced-motion` by jumping straight to the final value.
 */

// Object-form overload — returns a number for callers that want to format themselves.
export function useCountUp(options: CountUpOptions): number
// Positional-form overload — returns a pre-formatted string.
export function useCountUp(target: number, durationMs?: number, decimals?: number): string

export function useCountUp(
  arg1: number | CountUpOptions,
  durationMs = 1800,
  decimals = 0
): string | number {
  const objectForm = typeof arg1 === 'object'
  const target = objectForm ? arg1.to : arg1
  const duration = objectForm ? (arg1.duration ?? 1800) : durationMs
  const enabled = objectForm ? (arg1.enabled ?? true) : true
  const dec = objectForm ? (arg1.decimals ?? 0) : decimals

  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setValue(target)
      return
    }
    if (started.current) return
    started.current = true

    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, enabled])

  if (objectForm) return value
  if (dec > 0) return value.toFixed(dec)
  return Math.floor(value).toLocaleString()
}
