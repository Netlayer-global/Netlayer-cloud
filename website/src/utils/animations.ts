import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Animated number counter (easeOutCubic). Starts when `start` flips to true.
 * Honors prefers-reduced-motion by jumping straight to the target.
 */
export function useCountUp(target: number, duration = 2000, start = false): number {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!start) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setCurrent(target)
      return
    }

    let raf: number
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(target * eased * 100) / 100)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])

  return current
}

/**
 * Fires `inView=true` once when the ref enters the viewport. Disconnects
 * itself afterwards so the value sticks (great for one-shot animations).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

/**
 * Lightweight typewriter that produces the displayed lines as they're being
 * typed. Each line ends with a small pause before the next begins. Replay
 * via the returned callback resets state and starts over.
 */
export function useTypeWriter(lines: string[], msPerChar = 30, msPerLine = 200) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const epoch = useRef(0)

  const replay = useCallback(() => {
    epoch.current++
    setDisplayed([])
    setDone(false)
  }, [])

  useEffect(() => {
    const myEpoch = epoch.current
    let lineIdx = 0
    let charIdx = 0
    const buffer: string[] = []
    let timer: number | undefined

    const tick = () => {
      if (myEpoch !== epoch.current) return
      if (lineIdx >= lines.length) {
        setDone(true)
        return
      }
      const line = lines[lineIdx]
      if (charIdx <= line.length) {
        buffer[lineIdx] = line.slice(0, charIdx)
        setDisplayed([...buffer])
        charIdx++
        timer = window.setTimeout(tick, msPerChar)
      } else {
        lineIdx++
        charIdx = 0
        timer = window.setTimeout(tick, msPerLine)
      }
    }

    timer = window.setTimeout(tick, 350)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [lines, msPerChar, msPerLine])

  return { displayed, done, replay }
}
