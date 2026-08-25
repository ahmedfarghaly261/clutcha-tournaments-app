import { useOrganizerTournamentsControllerListPaymentMethods } from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentPaymentMethodsService(tournamentId: string) {
  return useOrganizerTournamentsControllerListPaymentMethods(tournamentId, {
    query: {
      enabled: Boolean(tournamentId),
      staleTime: 10_000,
    },
  })
}
