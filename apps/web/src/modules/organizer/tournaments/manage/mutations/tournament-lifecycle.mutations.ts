import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey,
  getOrganizerTournamentsControllerListOrganizerTournamentsQueryKey,
  useOrganizerTournamentsControllerCancelTournament,
  useOrganizerTournamentsControllerCloseRegistration,
  useOrganizerTournamentsControllerOpenRegistration,
  useOrganizerTournamentsControllerPublishTournament,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentLifecycleMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshTournament = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey(
          tournamentId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: getOrganizerTournamentsControllerListOrganizerTournamentsQueryKey(),
      }),
    ])
  }

  const publishMutation = useOrganizerTournamentsControllerPublishTournament({
    mutation: { onSuccess: refreshTournament },
  })
  const openRegistrationMutation = useOrganizerTournamentsControllerOpenRegistration({
    mutation: { onSuccess: refreshTournament },
  })
  const closeRegistrationMutation = useOrganizerTournamentsControllerCloseRegistration({
    mutation: { onSuccess: refreshTournament },
  })
  const cancelMutation = useOrganizerTournamentsControllerCancelTournament({
    mutation: { onSuccess: refreshTournament },
  })

  return {
    publishTournament: publishMutation.mutateAsync,
    openRegistration: openRegistrationMutation.mutateAsync,
    closeRegistration: closeRegistrationMutation.mutateAsync,
    cancelTournament: cancelMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    isOpeningRegistration: openRegistrationMutation.isPending,
    isClosingRegistration: closeRegistrationMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isPending:
      publishMutation.isPending ||
      openRegistrationMutation.isPending ||
      closeRegistrationMutation.isPending ||
      cancelMutation.isPending,
  }
}
