import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Button } from './ui/Button'

interface ActionConfig {
  label: string
  to?: string
  onClick?: () => void
}

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ActionConfig
  secondaryAction?: ActionConfig
  className?: string
}

/**
 * Empty state pattern — consistent across the dashboard.
 *
 * Layout: tinted icon tile → title → subtitle → primary CTA → secondary link.
 * Designed for cards (use as-is) or full-page sections (parent provides padding).
 */
export function EmptyState({ icon: Icon, title, subtitle, action, secondaryAction, className = '' }: Props) {
  const renderAction = (cfg: ActionConfig, primary = true) => {
    const inner = primary
      ? <Button>{cfg.label}</Button>
      : (
        <button
          type="button"
          className="text-sm text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer transition-colors"
        >
          {cfg.label}
        </button>
      )

    if (cfg.to) return <Link to={cfg.to}>{inner}</Link>
    return <span onClick={cfg.onClick} className="inline-block cursor-pointer">{inner}</span>
  }

  return (
    <div className={`bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-12 text-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-[#e0fe56]/10 border border-[#e0fe56]/20 mx-auto mb-4 flex items-center justify-center">
        <Icon size={20} className="text-[#e0fe56]/80" />
      </div>
      <h3 className="text-base font-medium text-[#e8e8e6]">{title}</h3>
      {subtitle && (
        <p className="text-sm text-[#a0a09e] mt-2 mb-1 max-w-sm mx-auto">{subtitle}</p>
      )}
      <div className="mt-6 flex flex-col items-center gap-2">
        {action && renderAction(action, true)}
        {secondaryAction && renderAction(secondaryAction, false)}
      </div>
    </div>
  )
}

export default EmptyState
