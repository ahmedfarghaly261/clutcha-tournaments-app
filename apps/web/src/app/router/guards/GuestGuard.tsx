import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { roleHomePath } from '@/app/config/roles'

/**
 * Blocks authenticated visitors from sign-in/registration pages, sending
 * them straight to their role's home instead.
 */
export function GuestGuard() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <p>Loading…</p>
  }

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHomePath[user.role]} replace />
  }

  return <Outlet />
}
