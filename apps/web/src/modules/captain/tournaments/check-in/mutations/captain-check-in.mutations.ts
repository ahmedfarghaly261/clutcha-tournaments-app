import { useQueryClient } from '@tanstack/react-query'
import {
  getCaptainRegistrationsControllerGetRegistrationCheckInQueryKey,
  getCaptainRegistrationsControllerGetRegistrationHubQueryKey,
  getCaptainRegistrationsControllerListRegistrationsQueryKey,
  useCaptainRegistrationsControllerCheckInRegistration,
} from '@/api/generated/captain-registrations/captain-registrations'

export function useCaptainCheckInMutation(registrationId: string) {
  const queryClient = useQueryClient()

  const checkInMutation = useCaptainRegistrationsControllerCheckInRegistration({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getCaptainRegistrationsControllerGetRegistrationCheckInQueryKey(registrationId) }),
          queryClient.invalidateQueries({ queryKey: getCaptainRegistrationsControllerGetRegistrationHubQueryKey(registrationId) }),
          queryClient.invalidateQueries({ queryKey: getCaptainRegistrationsControllerListRegistrationsQueryKey() }),
        ])
      },
    },
  })

  return {
    checkInRegistration: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
  }
}
