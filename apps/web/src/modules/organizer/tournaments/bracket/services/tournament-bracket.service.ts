import {
  OrganizerTournamentsControllerListOrganizerTournamentsSortBy,
  OrganizerTournamentsControllerListOrganizerTournamentsSortDirection,
} from '@/api/generated/organizer-tournaments'
import {
  useOrganizerTournamentsControllerGetTournamentBracket,
  useOrganizerTournamentsControllerListOrganizerTournaments,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentBracketService(tournamentId: string) {
  return useOrganizerTournamentsControllerGetTournamentBracket(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      staleTime: 10_000,
    },
  })
}

export function useBracketTournamentListService() {
  return useOrganizerTournamentsControllerListOrganizerTournaments(
    {
      page: 1,
      limit: 100,
      sortBy: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.startsAt,
      sortDirection:
        OrganizerTournamentsControllerListOrganizerTournamentsSortDirection.asc,
    },
    {
      query: {
        staleTime: 15_000,
      },
    },
  )
}
