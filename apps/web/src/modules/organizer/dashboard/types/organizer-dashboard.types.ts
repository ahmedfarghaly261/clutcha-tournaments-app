import type {
  OrganizerDashboardRecentTournamentDto,
  OrganizerDashboardSummaryDto,
} from '@/api/generated/organizer'

export type OrganizerDashboardRecentTournament = OrganizerDashboardRecentTournamentDto

export interface OrganizerDashboardViewModel {
  summary: OrganizerDashboardSummaryDto
  recentTournaments: OrganizerDashboardRecentTournament[]
}
