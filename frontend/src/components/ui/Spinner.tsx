import { cn } from '../../lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
  color?: 'lime' | 'white' | 'muted'
}

export function Spinner({ size = 16, className, color = 'muted' }: SpinnerProps) {
  const colors = {
    lime: 'text-[#e0fe56]',
    white: 'text-[#e8e8e6]',
    muted: 'text-[#6a6a68]',
  }
  return (
    <span
      className={cn('inline-block rounded-full border-2 border-current border-r-transparent animate-spin', colors[color], className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}
