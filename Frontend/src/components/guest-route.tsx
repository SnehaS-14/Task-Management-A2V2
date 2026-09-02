import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { FullPageLoader } from '@/components/loading'

export function GuestRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
