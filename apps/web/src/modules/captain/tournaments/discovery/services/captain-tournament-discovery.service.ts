import { usePublicTournamentsControllerListPublicTournaments } from '@/api/generated/public-tournaments/public-tournaments'
import type { CaptainTournamentQuery } from '../types/captain-tournament-discovery.types'

export function useCaptainTournamentDiscoveryService(params: CaptainTournamentQuery) {
  return usePublicTournamentsControllerListPublicTournaments(params, {
    query: {
      placeholderData: (previousData) => previousData,
      staleTime: 15_000,
    },
  })
}
