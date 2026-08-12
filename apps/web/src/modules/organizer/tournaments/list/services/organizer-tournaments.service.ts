import { keepPreviousData } from '@tanstack/react-query'
import type { OrganizerTournamentsControllerListOrganizerTournamentsParams } from '@/api/generated/organizer-tournaments'
import { useOrganizerTournamentsControllerListOrganizerTournaments } from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useOrganizerTournamentsService(
  params: OrganizerTournamentsControllerListOrganizerTournamentsParams,
) {
  return useOrganizerTournamentsControllerListOrganizerTournaments(params, {
    query: {
      placeholderData: keepPreviousData,
      staleTime: 15_000,
    },
  })
}
