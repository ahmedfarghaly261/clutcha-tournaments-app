import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import type { CurrentUserResponseDtoRole as Role } from '@/api/generated/authentication'

export type { Role }

/**
 * Where each role lands after signing in (or after a role check fails).
 * Roles without a built area yet fall back to the public home.
 */
export const roleHomePath: Record<Role, string> = {
  [CurrentUserResponseDtoRole.CAPTAIN]: '/captain',
  [CurrentUserResponseDtoRole.ORGANIZER]: '/organizer',
  [CurrentUserResponseDtoRole.PLATFORM_ADMIN]: '/',
  [CurrentUserResponseDtoRole.TOURNAMENT_STAFF]: '/',
  [CurrentUserResponseDtoRole.REFEREE]: '/',
  [CurrentUserResponseDtoRole.CHECK_IN_STAFF]: '/',
}
