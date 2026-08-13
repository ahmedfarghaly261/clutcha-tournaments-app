import type { OrganizerDashboardResponseDto } from '@/api/generated/organizer'
import { useOrganizersControllerGetDashboard } from '@/api/generated/organizer/organizer'
import type { OrganizerDashboardViewModel } from '../types/organizer-dashboard.types'

function toDashboardViewModel(
  response: OrganizerDashboardResponseDto,
): OrganizerDashboardViewModel {
  return {
    summary: response.summary,
    recentTournaments: response.recentTournaments,
  }
}

export function useOrganizerDashboardService() {
  return useOrganizersControllerGetDashboard<OrganizerDashboardViewModel>({
    query: {
      staleTime: 15_000,
      select: toDashboardViewModel,
    },
  })
}
