import {
  useOrganizerTournamentsControllerGetOnlineConfiguration,
  useOrganizerTournamentsControllerGetVenue,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentModeConfigurationService(
  tournamentId: string,
  mode?: 'ONLINE' | 'ONSITE',
) {
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

  return { onlineQuery, venueQuery }
}
