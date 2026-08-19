import { usePublicTournamentsControllerGetPublicTournamentDetails } from '@/api/generated/public-tournaments/public-tournaments'

export function useCaptainTournamentDetailsService(slug: string) {
  return usePublicTournamentsControllerGetPublicTournamentDetails(slug, {
    query: {
      enabled: Boolean(slug),
      retry: false,
      staleTime: 15_000,
    },
  })
}
