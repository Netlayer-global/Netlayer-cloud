import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: string
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'p-4', hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg',
          padding,
          hover && 'hover:border-[#333433] hover:bg-[#252625] transition-colors cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
