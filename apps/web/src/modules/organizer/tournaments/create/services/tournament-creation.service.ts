import {
  useOrganizerTournamentsControllerCreateDraft,
  useOrganizerTournamentsControllerUploadTournamentCover,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentCreationService() {
  const createDraftMutation = useOrganizerTournamentsControllerCreateDraft()
  const uploadCoverMutation = useOrganizerTournamentsControllerUploadTournamentCover()

  return {
    createDraft: createDraftMutation.mutateAsync,
    uploadCover: uploadCoverMutation.mutateAsync,
    isCreating: createDraftMutation.isPending || uploadCoverMutation.isPending,
  }
}
