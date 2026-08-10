import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { CurrentUserResponseDto } from '@/api/generated/authentication'
import type { RegistrationFormValues } from '../schemas/registration.schema'

type RegistrationPayload = Pick<
  RegistrationFormValues,
  'accountType' | 'displayName' | 'email' | 'password'
>

export type RegistrationService = {
  registerAccount: (
    input: RegistrationPayload,
  ) => Promise<CurrentUserResponseDto>
}

export function useRegistrationService(): RegistrationService {
  const { registerCaptain, registerOrganizer } = useAuth()

  const registerAccount = useCallback(
    (input: RegistrationPayload) => {
      const payload = {
        displayName: input.displayName,
        email: input.email,
        password: input.password,
      }

      return input.accountType === 'captain'
        ? registerCaptain(payload)
        : registerOrganizer(payload)
    },
    [registerCaptain, registerOrganizer],
  )

  return { registerAccount }
}
