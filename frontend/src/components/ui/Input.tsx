import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs mb-1.5" style={{ color: 'var(--t-med)', fontWeight: 500 }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md h-9 px-3 text-sm transition-colors focus:outline-none',
            error && 'border-red-500/60',
            className
          )}
          style={{
            background: 'var(--nl-1)',
            border: `1px solid ${error ? 'var(--c-red)' : 'var(--b-strong)'}`,
            color: 'var(--t-hi)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; props.onFocus?.(e) }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--c-red)' : 'var(--b-strong)'; props.onBlur?.(e) }}
          {...props}
        />
        {error && <p className="text-xs mt-1" style={{ color: 'var(--c-red)' }}>{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
