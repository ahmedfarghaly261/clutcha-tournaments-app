import { useQueryClient } from '@tanstack/react-query'
import { getCaptainsControllerGetDashboardQueryKey } from '@/api/generated/captain/captain'
import { getCaptainRegistrationsControllerListRegistrationsQueryKey } from '@/api/generated/captain-registrations/captain-registrations'
import {
  getCaptainTournamentEligibilityControllerGetEligibilityQueryKey,
  useCaptainTournamentEligibilityControllerCreateRegistration,
} from '@/api/generated/captain-tournaments/captain-tournaments'

export function useCreateCaptainTournamentRegistrationMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useCaptainTournamentEligibilityControllerCreateRegistration({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getCaptainTournamentEligibilityControllerGetEligibilityQueryKey(tournamentId),
        })
        void queryClient.invalidateQueries({
          queryKey: getCaptainRegistrationsControllerListRegistrationsQueryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: getCaptainsControllerGetDashboardQueryKey(),
        })
      },
    },
  })
}
