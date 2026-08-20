import { useCaptainTournamentEligibilityControllerGetEligibility } from '@/api/generated/captain-tournaments/captain-tournaments'

export function useCaptainTournamentEligibilityService(tournamentId: string) {
  return useCaptainTournamentEligibilityControllerGetEligibility(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      retry: false,
      staleTime: 0,
      refetchOnMount: 'always',
    },
  })
}
