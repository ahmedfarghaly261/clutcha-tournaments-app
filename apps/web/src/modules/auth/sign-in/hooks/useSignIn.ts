import { useNavigate } from 'react-router-dom'
import { roleHomePath } from '@/app/config/roles'
import type { SignInFormValues } from '../schemas/sign-in.schema'
import { useSignInService } from '../services/sign-in.service'

export function useSignIn() {
  const { signIn: submitSignIn } = useSignInService()
  const navigate = useNavigate()

  const signIn = async (values: SignInFormValues) => {
    const user = await submitSignIn(values)
    navigate(roleHomePath[user.role], { replace: true })
  }

  return { signIn }
}
