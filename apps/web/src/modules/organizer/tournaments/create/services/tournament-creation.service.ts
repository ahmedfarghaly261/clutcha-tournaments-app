import { useOrganizerTournamentsControllerCreateDraft } from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentCreationService() {
  const createDraftMutation = useOrganizerTournamentsControllerCreateDraft()

  return {
    createDraft: createDraftMutation.mutateAsync,
    isCreating: createDraftMutation.isPending,
  }
}
