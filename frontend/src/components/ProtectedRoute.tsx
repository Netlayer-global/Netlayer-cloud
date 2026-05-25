import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/endpoints'
import { Spinner } from './ui/Spinner'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING']

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, accessToken, setUser, logout } = useAuthStore()
  const location = useLocation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe().then((r) => r.data.data),
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (isError) logout()
  }, [isError, logout])

  if (!isAuthenticated || !accessToken || isError) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e0d]">
        <Spinner size={32} color="lime" />
      </div>
    )
  }

  // Round 19: first-time user → onboarding wizard.
  // Bypass for admin paths and the wizard itself, otherwise customers landing
  // on /dashboard/home for the first time get redirected to /dashboard/onboarding.
  const onAdmin = location.pathname.startsWith('/admin')
  const onOnboarding = location.pathname === '/dashboard/onboarding'
  const onConsole = location.pathname === '/console'
  const effective = data || (useAuthStore.getState().user as any)
  if (effective && effective.onboardingDone === false && !onAdmin && !onOnboarding && !onConsole) {
    return <Navigate to="/dashboard/onboarding" replace />
  }

  return <>{children}</>
}

/**
 * Admin gate. If not signed in → /admin/login. If signed in as a non-admin → toast + redirect.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, accessToken, user, setUser, logout } = useAuthStore()
  const location = useLocation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe().then((r) => r.data.data),
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (isError) logout()
  }, [isError, logout])

  if (!isAuthenticated || !accessToken || isError) {
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e0d]">
        <Spinner size={32} color="lime" />
      </div>
    )
  }

  const effective = user || data
  if (!effective || !ADMIN_ROLES.includes(effective.role)) {
    const role = effective?.role ?? 'unknown'
    setTimeout(() => {
      toast.error(`Admin panel requires SUPER_ADMIN/ADMIN/SUPPORT/BILLING role (you are: ${role})`)
    }, 0)
    return <Navigate to="/dashboard/home" replace />
  }

  return <>{children}</>
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/dashboard/home" replace />
  }
  return <>{children}</>
}
