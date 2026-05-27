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
 * Round 24+: Admin sidebar visibility control.
 *
 * Mirrors the customer ModulesCard but configures the admin nav.
 * Saved as IntegrationConfig key `platform.adminModules`. Required
 * items (Settings, Overview, Users, Servers) cannot be disabled —
 * an admin can't lock themselves out of the platform.
 */
export function AdminModulesCard() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'admin-modules'],
    queryFn: () => platformAPI.getAdminModules(),
  })

  const [draft, setDraft] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (data?.modules) setDraft(data.modules)
  }, [data?.modules])

  const save = useMutation({
    mutationFn: (modules: Record<string, boolean>) =>
      adminAPI.updateSetting('adminModules', modules),
    onSuccess: () => {
      toast.success('Admin sidebar updated — refresh to see changes')
      qc.invalidateQueries({ queryKey: ['platform', 'admin-modules'] })
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

  const dirty = JSON.stringify(draft) !== JSON.stringify(data.modules)
  const enabledCount = Object.values(draft).filter(Boolean).length
  const totalCount = data.definitions.length

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-[#e8e8e6] flex items-center gap-2">
            Admin sidebar modules
          </h3>
          <p className="text-xs text-[#a0a09e] mt-0.5">
            Hide admin sections you don't use. For example, disable GSTR-1 if your team isn't filing India taxes,
            or hide Compliance if you don't need CERT-In SLA tracking. Required items (lock icon) stay visible.
          </p>
          <p className="text-xs text-[#6a6a68] mt-1">
            {enabledCount} of {totalCount} sections visible
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
