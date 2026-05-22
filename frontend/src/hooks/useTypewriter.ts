import { useEffect, useState } from 'react'

interface TypewriterLine {
  text: string
  /** ms per character; defaults to 12 */
  speed?: number
  /** delay before this line starts in ms; defaults to 0 */
  delay?: number
  /** className applied to the rendered span */
  className?: string
}

export interface RenderedLine {
  text: string
  className?: string
  done: boolean
}

/**
 * Sequential typewriter that animates an array of lines.
 * Returns the lines in their current rendered state, plus a `complete` flag.
 *
 * Designed for the landing-hero terminal mockup: each line types out at its
 * own speed, with optional pauses between lines.
 */
export function useTypewriter(lines: TypewriterLine[], startDelay = 200) {
  const [rendered, setRendered] = useState<RenderedLine[]>(
    lines.map((l) => ({ text: '', className: l.className, done: false }))
  )
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const run = async () => {
      await wait(startDelay)
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return
        const line = lines[i]
        if (line.delay) await wait(line.delay)
        const speed = line.speed ?? 12
        for (let c = 1; c <= line.text.length; c++) {
          if (cancelled) return
          await wait(speed)
          setRendered((prev) => {
            const next = [...prev]
            next[i] = { text: line.text.slice(0, c), className: line.className, done: c === line.text.length }
            return next
          })
        }
      }
      if (!cancelled) setComplete(true)
    }

    run()
    return () => {
      cancelled = true
      for (const t of timeouts) clearTimeout(t)
    }
    // We intentionally only re-run if the line set changes by reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines])

  return { lines: rendered, complete }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
