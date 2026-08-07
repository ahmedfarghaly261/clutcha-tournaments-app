import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { roleHomePath } from '@/app/config/roles'
import type { OrganizerRegistrationFormValues } from '../schemas/organizer-registration.schema'

export function useOrganizerRegistration() {
  const { registerOrganizer } = useAuth()
  const navigate = useNavigate()

  const register = async (values: OrganizerRegistrationFormValues) => {
    const user = await registerOrganizer(values)
    navigate(roleHomePath[user.role], { replace: true })
  }

  return { register }
}
