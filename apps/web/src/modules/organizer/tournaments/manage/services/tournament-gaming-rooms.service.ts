import {
  useOrganizerTournamentsControllerListGamingRooms,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentGamingRoomsService(tournamentId: string, enabled: boolean) {
  return useOrganizerTournamentsControllerListGamingRooms(tournamentId, {
    query: { enabled: Boolean(tournamentId) && enabled, staleTime: 15_000, retry: false },
  })
}
