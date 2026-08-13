import {
  useOrganizerTournamentsControllerGetOrganizerTournamentDetails,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentLifecycleService(tournamentId: string) {
  return useOrganizerTournamentsControllerGetOrganizerTournamentDetails(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      staleTime: 10_000,
    },
  })
}
