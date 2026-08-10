import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { CurrentUserResponseDto } from '@/api/generated/authentication'
import type { SignInFormValues } from '../schemas/sign-in.schema'

type SignInPayload = Pick<SignInFormValues, 'email' | 'password'>

export type SignInService = {
  signIn: (input: SignInPayload) => Promise<CurrentUserResponseDto>
}

export function useSignInService(): SignInService {
  const { login } = useAuth()

  const signIn = useCallback(
    (input: SignInPayload) =>
      login({
        email: input.email,
        password: input.password,
      }),
    [login],
  )

  return { signIn }
}
