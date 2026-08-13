import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey,
  getOrganizerTournamentsControllerListOrganizerTournamentsQueryKey,
  useOrganizerTournamentsControllerDeleteTournamentDraft,
  useOrganizerTournamentsControllerUpdateTournamentDraft,
  useOrganizerTournamentsControllerUploadTournamentCover,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentGeneralSettingsService(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshTournament = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey(
          tournamentId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: getOrganizerTournamentsControllerListOrganizerTournamentsQueryKey(),
      }),
    ])
  }

  const updateMutation = useOrganizerTournamentsControllerUpdateTournamentDraft({
    mutation: { onSuccess: refreshTournament },
  })
  const uploadCoverMutation = useOrganizerTournamentsControllerUploadTournamentCover({
    mutation: { onSuccess: refreshTournament },
  })
  const deleteMutation = useOrganizerTournamentsControllerDeleteTournamentDraft({
    mutation: {
      onSuccess: async () => {
        queryClient.removeQueries({
          queryKey: getOrganizerTournamentsControllerGetOrganizerTournamentDetailsQueryKey(
            tournamentId,
          ),
        })
        await queryClient.invalidateQueries({
          queryKey: getOrganizerTournamentsControllerListOrganizerTournamentsQueryKey(),
        })
      },
    },
  })

  return {
    updateDraft: updateMutation.mutateAsync,
    uploadCover: uploadCoverMutation.mutateAsync,
    deleteDraft: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isUploadingCover: uploadCoverMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
