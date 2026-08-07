import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

/**
 * Blocks anonymous access. Renders its children (via `<Outlet />`) only once
 * the session has resolved to an authenticated user; otherwise sends the
 * visitor to sign-in, remembering where they came from.
 */
export function AuthGuard() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <p>Loading…</p>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
