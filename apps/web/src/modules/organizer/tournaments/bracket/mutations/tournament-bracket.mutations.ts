import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetTournamentBracketQueryKey,
  useOrganizerTournamentsControllerGenerateTournamentBracket,
  useOrganizerTournamentsControllerScheduleTournamentMatch,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentBracketMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const generateMutation = useOrganizerTournamentsControllerGenerateTournamentBracket({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            getOrganizerTournamentsControllerGetTournamentBracketQueryKey(tournamentId),
        })
      },
    },
  })
  const scheduleMutation = useOrganizerTournamentsControllerScheduleTournamentMatch({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey:
            getOrganizerTournamentsControllerGetTournamentBracketQueryKey(tournamentId),
        })
      },
    },
  })

  return {
    generateBracket: generateMutation.mutateAsync,
    scheduleMatch: scheduleMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    isScheduling: scheduleMutation.isPending,
  }
}
