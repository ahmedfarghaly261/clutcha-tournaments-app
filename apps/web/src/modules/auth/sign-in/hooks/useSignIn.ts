import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { roleHomePath } from '@/app/config/roles'
import type { SignInFormValues } from '../schemas/sign-in.schema'

export function useSignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const signIn = async (values: SignInFormValues) => {
    const user = await login(values)
    navigate(roleHomePath[user.role], { replace: true })
  }

  return { signIn }
}
