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
