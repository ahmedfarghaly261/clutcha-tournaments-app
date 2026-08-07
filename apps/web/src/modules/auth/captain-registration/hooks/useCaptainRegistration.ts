import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { roleHomePath } from '@/app/config/roles'
import type { CaptainRegistrationFormValues } from '../schemas/captain-registration.schema'

export function useCaptainRegistration() {
  const { registerCaptain } = useAuth()
  const navigate = useNavigate()

  const register = async (values: CaptainRegistrationFormValues) => {
    const user = await registerCaptain(values)
    navigate(roleHomePath[user.role], { replace: true })
  }

  return { register }
}
