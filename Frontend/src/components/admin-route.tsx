import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { FullPageLoader } from '@/components/loading'
import { isAdmin } from '@/lib/roles'

export function AdminRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
