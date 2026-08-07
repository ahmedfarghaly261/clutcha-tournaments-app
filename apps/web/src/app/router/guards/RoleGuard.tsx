import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { roleHomePath, type Role } from '@/app/config/roles'

type RoleGuardProps = {
  allow: Role[]
}

/**
 * Restricts a route subtree to specific roles. Must be nested under
 * `AuthGuard`, which guarantees `user` is set by the time this renders.
 */
export function RoleGuard({ allow }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={roleHomePath[user.role]} replace />
  }

  return <Outlet />
}
