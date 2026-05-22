import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant =
  | 'running'
  | 'stopped'
  | 'building'
  | 'pending'
  | 'error'
  | 'production'
  | 'development'
  | 'staging'
  | 'preview'
  | 'default'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
  showDot?: boolean
}

const variants: Record<Variant, { wrap: string; dot: string }> = {
  running: {
    wrap: 'bg-green-950/40 text-green-400 border-green-900/60',
    dot: 'bg-green-400',
  },
  stopped: {
    wrap: 'bg-[#1e1f1e] text-[#6a6a68] border-[#333433]',
    dot: 'bg-[#6a6a68]',
  },
  building: {
    wrap: 'bg-amber-950/40 text-amber-400 border-amber-900/60',
    dot: 'bg-amber-400',
  },
  pending: {
    wrap: 'bg-amber-950/40 text-amber-400 border-amber-900/60',
    dot: 'bg-amber-400',
  },
  error: {
    wrap: 'bg-red-950/40 text-red-400 border-red-900/60',
    dot: 'bg-red-400',
  },
  production: {
    wrap: 'bg-green-950/40 text-green-400 border-green-900/60',
    dot: 'bg-green-400',
  },
  development: {
    wrap: 'bg-purple-950/40 text-purple-400 border-purple-900/60',
    dot: 'bg-purple-400',
  },
  staging: {
    wrap: 'bg-amber-950/40 text-amber-400 border-amber-900/60',
    dot: 'bg-amber-400',
  },
  preview: {
    wrap: 'bg-[#e0fe56]/10 text-[#e0fe56] border-[#e0fe56]/30',
    dot: 'bg-[#e0fe56]',
  },
  default: {
    wrap: 'bg-[#1e1f1e] text-[#a0a09e] border-[#333433]',
    dot: 'bg-[#a0a09e]',
  },
}

export function Badge({
  variant = 'default',
  showDot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const v = variants[variant]
  const isAnimated = variant === 'building' || variant === 'pending'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border capitalize',
        v.wrap,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            v.dot,
            isAnimated && 'animate-pulse-soft'
          )}
        />
      )}
      {children}
    </span>
  )
}
