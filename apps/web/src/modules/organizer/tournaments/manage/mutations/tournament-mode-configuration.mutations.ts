import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetOnlineConfigurationQueryKey,
  getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey,
  getOrganizerTournamentsControllerGetVenueQueryKey,
  useOrganizerTournamentsControllerUpsertOnlineConfiguration,
  useOrganizerTournamentsControllerUpsertVenue,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentModeConfigurationMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const onlineMutation = useOrganizerTournamentsControllerUpsertOnlineConfiguration({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            getOrganizerTournamentsControllerGetOnlineConfigurationQueryKey(tournamentId),
        })
      },
    },
  })
  const venueMutation = useOrganizerTournamentsControllerUpsertVenue({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getOrganizerTournamentsControllerGetVenueQueryKey(tournamentId),
          }),
          queryClient.invalidateQueries({
            queryKey:
              getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey(
                tournamentId,
              ),
          }),
        ])
      },
    },
  })

  return {
    saveOnlineConfiguration: onlineMutation.mutateAsync,
    saveVenue: venueMutation.mutateAsync,
    isSavingOnline: onlineMutation.isPending,
    isSavingVenue: venueMutation.isPending,
  }
}
