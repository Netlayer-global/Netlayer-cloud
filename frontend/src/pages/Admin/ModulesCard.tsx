import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { adminAPI } from '../../api/admin'
import { platformAPI, type ModuleDefinition } from '../../api/platform'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'

/**
 * Admin-only card to control which dashboard modules are visible to customers.
 *
 * Required modules (Servers, Deploy, SSH keys, Billing) cannot be turned off
 * because the platform is fundamentally a VPS host. The remaining modules
 * are gated on operator activation so we don't show empty pages for
 * features that haven't been integrated yet.
 */
export function ModulesCard() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'modules'],
    queryFn: () => platformAPI.getModules(),
  })

  const [draft, setDraft] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (data?.modules) setDraft(data.modules)
  }, [data?.modules])

  const save = useMutation({
    mutationFn: (modules: Record<string, boolean>) =>
      adminAPI.updateSetting('modules', modules),
    onSuccess: () => {
      toast.success('Modules updated')
      qc.invalidateQueries({ queryKey: ['platform', 'modules'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to save'),
  })

  if (isLoading || !data) {
    return <Skeleton className="h-64 rounded-lg" />
  }

  const groups = data.definitions.reduce<Record<string, ModuleDefinition[]>>((acc, def) => {
    if (!acc[def.group]) acc[def.group] = []
    acc[def.group].push(def)
    return acc
  }, {})

  const toggle = (key: string, required: boolean) => {
    if (required) return
    setDraft((d) => ({ ...d, [key]: !d[key] }))
  }

  const enableAll = () => {
    const next: Record<string, boolean> = { ...draft }
    for (const d of data.definitions) next[d.key] = true
    setDraft(next)
  }

  const vpsOnly = () => {
    const next: Record<string, boolean> = {}
    for (const d of data.definitions) {
      // VPS-only preset: compute essentials + objectStorage + monitoring + account basics
      next[d.key] = d.required ||
        ['servers', 'deploy', 'monitoring', 'objectStorage', 'firewalls', 'sshKeys',
         'apiKeys', 'billing', 'support', 'activity'].includes(d.key)
    }
    setDraft(next)
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data.modules)
  const enabledCount = Object.values(draft).filter(Boolean).length
  const totalCount = data.definitions.length

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-[#e8e8e6] flex items-center gap-2">
            Customer dashboard modules
          </h3>
          <p className="text-xs text-[#a0a09e] mt-0.5">
            Choose which features customers see in their dashboard. Hide anything that isn't ready
            so users don't land on empty pages. Required items (lock icon) can't be disabled.
          </p>
          <p className="text-xs text-[#6a6a68] mt-1">
            {enabledCount} of {totalCount} modules enabled
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={vpsOnly}>VPS only</Button>
          <Button size="sm" variant="ghost" onClick={enableAll}>Enable all</Button>
          <Button
            size="sm"
            loading={save.isPending}
            disabled={!dirty}
            onClick={() => save.mutate(draft)}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groups).map(([groupName, defs]) => (
          <div key={groupName}>
            <div className="text-[11px] uppercase tracking-wider text-[#6a6a68] mb-2">
              {groupName}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {defs.map((d) => {
                const on = !!draft[d.key]
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggle(d.key, d.required)}
                    className={cn(
                      'group flex items-start gap-3 p-3 rounded-md border text-left transition-colors',
                      on
                        ? 'bg-[#e0fe56]/5 border-[#e0fe56]/40'
                        : 'bg-[#1e1f1e] border-[#2a2b2a] hover:bg-[#252625]',
                      d.required ? 'cursor-default opacity-90' : 'cursor-pointer'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 w-9 h-5 rounded-full transition-colors relative shrink-0',
                      on ? 'bg-[#e0fe56]' : 'bg-[#333433]',
                      d.required && 'opacity-60'
                    )}>
                      <span className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                        on ? 'translate-x-4' : 'translate-x-0.5'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#e8e8e6] font-medium">{d.label}</span>
                        {d.required && <Lock size={11} className="text-[#6a6a68]" />}
                        {on ? (
                          <Eye size={11} className="text-[#a0a09e] ml-auto" />
                        ) : (
                          <EyeOff size={11} className="text-[#6a6a68] ml-auto" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#a0a09e] mt-0.5">{d.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
