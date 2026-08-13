import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetOnlineConfigurationQueryKey,
  getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey,
  getOrganizerTournamentsControllerGetVenueQueryKey,
  useOrganizerTournamentsControllerGetOnlineConfiguration,
  useOrganizerTournamentsControllerGetVenue,
  useOrganizerTournamentsControllerUpsertOnlineConfiguration,
  useOrganizerTournamentsControllerUpsertVenue,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentModeConfigurationService(
  tournamentId: string,
  mode?: 'ONLINE' | 'ONSITE',
) {
  const queryClient = useQueryClient()
  const onlineQuery = useOrganizerTournamentsControllerGetOnlineConfiguration(tournamentId, {
    query: {
      enabled: Boolean(tournamentId) && mode === 'ONLINE',
      retry: false,
    },
  })
  const venueQuery = useOrganizerTournamentsControllerGetVenue(tournamentId, {
    query: {
      enabled: Boolean(tournamentId) && mode === 'ONSITE',
      retry: false,
    },
  })

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
    onlineQuery,
    venueQuery,
    saveOnlineConfiguration: onlineMutation.mutateAsync,
    saveVenue: venueMutation.mutateAsync,
    isSavingOnline: onlineMutation.isPending,
    isSavingVenue: venueMutation.isPending,
  }
}
