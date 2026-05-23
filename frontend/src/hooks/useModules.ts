import { useQuery } from '@tanstack/react-query'
import { platformAPI } from '../api/platform'

/**
 * Module visibility hook — used by the customer dashboard sidebar and
 * route guards to know which features the operator has enabled.
 *
 * Cached for 60s. Returns sensible defaults while loading so the sidebar
 * doesn't flicker between "empty" and "full" on first paint.
 */
const FALLBACK = {
  modules: {
    servers: true, deploy: true, vms: false, gpu: false, kubernetes: false, marketplace: false,
    objectStorage: true, blockStorage: true, managedDb: false,
    loadBalancers: true, dns: false, firewalls: true, vpc: false,
    monitoring: true, alerts: false, logs: false,
    projects: false, activity: true, team: false, apiKeys: true, sshKeys: true,
    billing: true, referrals: false, support: true,
  } as Record<string, boolean>,
  definitions: [],
}

export function useModules() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'modules'],
    queryFn: () => platformAPI.getModules(),
    staleTime: 60_000,
    placeholderData: FALLBACK as any,
  })
  return {
    modules: data?.modules ?? FALLBACK.modules,
    definitions: data?.definitions ?? [],
    isLoading,
    isEnabled: (key: string) => (data?.modules ?? FALLBACK.modules)[key] !== false,
  }
}
