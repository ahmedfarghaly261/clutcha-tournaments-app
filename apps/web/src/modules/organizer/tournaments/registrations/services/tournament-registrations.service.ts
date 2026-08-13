import {
  useOrganizerTournamentsControllerGetTournamentRegistration,
  useOrganizerTournamentsControllerListTournamentRegistrations,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentRegistrationsService(tournamentId: string) {
  return useOrganizerTournamentsControllerListTournamentRegistrations(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      staleTime: 15_000,
    },
  })
}

export function useTournamentRegistrationDetailsService(
  tournamentId: string,
  registrationId: string,
) {
  return useOrganizerTournamentsControllerGetTournamentRegistration(
    tournamentId,
    registrationId,
    {
      query: {
        enabled: Boolean(tournamentId) && Boolean(registrationId),
        staleTime: 10_000,
      },
    },
  )
}
