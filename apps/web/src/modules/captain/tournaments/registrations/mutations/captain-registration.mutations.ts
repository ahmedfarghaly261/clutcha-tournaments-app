import { useQueryClient } from '@tanstack/react-query'
import { getCaptainsControllerGetDashboardQueryKey } from '@/api/generated/captain/captain'
import {
  getCaptainRegistrationsControllerGetRegistrationQueryKey,
  getCaptainRegistrationsControllerListRegistrationsQueryKey,
  useCaptainRegistrationsControllerWithdrawRegistration,
} from '@/api/generated/captain-registrations/captain-registrations'

export function useCaptainRegistrationMutations(registrationId: string) {
  const queryClient = useQueryClient()

  const withdrawMutation = useCaptainRegistrationsControllerWithdrawRegistration({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getCaptainRegistrationsControllerListRegistrationsQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getCaptainRegistrationsControllerGetRegistrationQueryKey(registrationId),
          }),
          queryClient.invalidateQueries({
            queryKey: getCaptainsControllerGetDashboardQueryKey(),
          }),
        ])
      },
    },
  })

  return {
    withdrawRegistration: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
  }
}
