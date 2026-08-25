import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey,
  getOrganizerTournamentsControllerListPaymentMethodsQueryKey,
  useOrganizerTournamentsControllerCreatePaymentMethod,
  useOrganizerTournamentsControllerDeletePaymentMethod,
  useOrganizerTournamentsControllerUpdatePaymentMethod,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentPaymentMethodsMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshPaymentMethods = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getOrganizerTournamentsControllerListPaymentMethodsQueryKey(
          tournamentId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey(
            tournamentId,
          ),
      }),
    ])
  }

  const createMutation = useOrganizerTournamentsControllerCreatePaymentMethod({
    mutation: { onSuccess: refreshPaymentMethods },
  })
  const updateMutation = useOrganizerTournamentsControllerUpdatePaymentMethod({
    mutation: { onSuccess: refreshPaymentMethods },
  })
  const deleteMutation = useOrganizerTournamentsControllerDeletePaymentMethod({
    mutation: { onSuccess: refreshPaymentMethods },
  })

  return {
    createPaymentMethod: createMutation.mutateAsync,
    updatePaymentMethod: updateMutation.mutateAsync,
    deletePaymentMethod: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  }
}
