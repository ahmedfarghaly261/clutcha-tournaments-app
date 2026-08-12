import {
  useOrganizerTournamentsControllerGetOrganizerTournamentDetails,
  useOrganizerTournamentsControllerListTournamentRegistrations,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useOrganizerTournamentDetailsService(tournamentId: string) {
  return useOrganizerTournamentsControllerGetOrganizerTournamentDetails(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      staleTime: 15_000,
    },
  })
}

export function useOrganizerTournamentParticipantsService(
  tournamentId: string,
  enabled: boolean,
) {
  return useOrganizerTournamentsControllerListTournamentRegistrations(tournamentId, {
    query: {
      enabled: Boolean(tournamentId) && enabled,
      staleTime: 15_000,
    },
  })
}
