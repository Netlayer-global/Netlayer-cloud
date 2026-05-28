import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, ...props }, ref) => {
    const selectId = id || props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs text-[#a0a09e] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md h-9 pl-3 pr-9 text-sm appearance-none cursor-pointer',
              'focus:border-[#e0fe56] focus:outline-none transition-colors',
              error && 'border-red-500/60',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a6a68] pointer-events-none"
            size={16}
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
