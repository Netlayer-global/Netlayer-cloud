import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref to attach to an element and a boolean that flips to true
 * the first time the element enters the viewport.
 *
 * Once-only: stays true after first intersection. Used for stat counters,
 * lazy-load animations, etc.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.2 }
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current || inView) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            obs.disconnect()
          }
        }
      },
      options
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [inView, options])

  return { ref, inView }
}
