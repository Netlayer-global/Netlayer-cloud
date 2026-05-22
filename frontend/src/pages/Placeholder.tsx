import { ReactNode } from 'react'
import { Card } from '../components/ui/Card'

export default function Placeholder({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon?: ReactNode
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">{title}</h1>
        <p className="text-sm text-[#a0a09e] mt-1">{description}</p>
      </div>
      <Card padding="p-12" className="text-center">
        {icon && <div className="mx-auto mb-4 text-[#6a6a68]">{icon}</div>}
        <div className="inline-block bg-[#e0fe56]/10 text-[#e0fe56] border border-[#e0fe56]/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium mb-3">
          Preview
        </div>
        <h3 className="font-medium text-[#e8e8e6] mb-2">Coming soon</h3>
        <p className="text-sm text-[#a0a09e] max-w-md mx-auto">
          This feature is in development. Check the changelog for updates.
        </p>
      </Card>
    </div>
  )
}
