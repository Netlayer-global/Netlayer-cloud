import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#e0fe56] text-[#0d0e0d] font-medium hover:bg-[#c8e44a] disabled:opacity-50',
  secondary:
    'bg-[#1e1f1e] text-[#a0a09e] border border-[#333433] hover:bg-[#252625] hover:text-[#e8e8e6]',
  ghost:
    'bg-transparent text-[#a0a09e] border border-[#2a2b2a] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]',
  danger:
    'bg-transparent text-red-400 border border-red-900/60 hover:bg-red-950/30',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-8 px-4 text-sm',
  lg: 'h-9 px-5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
