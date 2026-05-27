import { useQuery } from '@tanstack/react-query'
import { platformAPI } from '../api/platform'

/**
 * Module visibility hooks — used by the customer + admin sidebars and
 * route guards to know which features the operator has enabled.
 *
 * Cached for 60s. Returns sensible defaults while loading so the sidebar
 * doesn't flicker between "empty" and "full" on first paint.
 */
const FALLBACK = {
  modules: {
    servers: true, deploy: true, vms: false, gpu: false, kubernetes: false, marketplace: true,
    objectStorage: true, blockStorage: true, managedDb: true,
    loadBalancers: true, dns: true, firewalls: true, vpc: true, floatingIps: true,
    monitoring: true, alerts: true, logs: false, snapshots: true,
    projects: false, activity: true, team: false, apiKeys: true, sshKeys: true,
    billing: true, referrals: true, support: true,
    // Round 23+ keys
    customIsos: false,
    deployOrders: true,
    organizations: true,
    kyc: true,
    phoneVerify: true,
  } as Record<string, boolean>,
  definitions: [],
}

const ADMIN_FALLBACK = {
  // Customer-side fallback array — sidebar uses these defaults until API responds
  modules: {} as Record<string, boolean>,
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

/**
 * Admin sidebar visibility. Defaults to "show everything" while loading so
 * an admin doesn't see a half-empty sidebar on a slow network.
 */
export function useAdminModules() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'admin-modules'],
    queryFn: () => platformAPI.getAdminModules(),
    staleTime: 60_000,
    placeholderData: ADMIN_FALLBACK as any,
  })
  return {
    modules: data?.modules ?? {},
    definitions: data?.definitions ?? [],
    isLoading,
    // Default to true if we haven't seen the key yet (e.g. while loading)
    isEnabled: (key: string) => {
      const map = data?.modules
      if (!map) return true
      return map[key] !== false
    },
  }
}
