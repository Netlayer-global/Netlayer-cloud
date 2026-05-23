import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useModules } from '../hooks/useModules'

/**
 * Wrap a route element with this to gate it on a platform module being
 * enabled. If disabled, the user is bounced to /dashboard/home with a toast
 * explaining the situation. Required modules can never be disabled, so the
 * core Servers/Deploy/SSH/Billing routes are always available.
 */
export function ModuleGuard({
  module,
  children,
}: {
  module: string
  children: ReactNode
}) {
  const { isEnabled, isLoading } = useModules()
  const location = useLocation()

  const enabled = isEnabled(module)

  useEffect(() => {
    if (!isLoading && !enabled) {
      toast.error('This feature is not enabled on this platform', {
        description: 'Contact an administrator if you need access.',
      })
    }
  }, [enabled, isLoading, module])

  if (isLoading) return null
  if (!enabled) return <Navigate to="/dashboard/home" replace state={{ from: location }} />
  return <>{children}</>
}
