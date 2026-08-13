import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetTournamentRegistrationQueryKey,
  getOrganizerTournamentsControllerListTournamentRegistrationsQueryKey,
  useOrganizerTournamentsControllerApproveTournamentRegistration,
  useOrganizerTournamentsControllerRejectTournamentRegistration,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentRegistrationMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshRegistration = async (registrationId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getOrganizerTournamentsControllerListTournamentRegistrationsQueryKey(
            tournamentId,
          ),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getOrganizerTournamentsControllerGetTournamentRegistrationQueryKey(
            tournamentId,
            registrationId,
          ),
      }),
    ])
  }

  const approveMutation = useOrganizerTournamentsControllerApproveTournamentRegistration({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })
  const rejectMutation = useOrganizerTournamentsControllerRejectTournamentRegistration({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })

  return {
    approveRegistration: approveMutation.mutateAsync,
    rejectRegistration: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isPending: approveMutation.isPending || rejectMutation.isPending,
  }
}
