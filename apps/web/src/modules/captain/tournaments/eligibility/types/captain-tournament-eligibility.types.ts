import type {
  TournamentEligibilityResponseDto,
  TournamentEligibilityTeamDto,
} from '@/api/generated/captain-tournaments'
import type {
  TournamentEligibilityIssueDto,
  TournamentEligibilityIssueDtoCode,
} from '@/api/generated'

export type CaptainTournamentEligibility = TournamentEligibilityResponseDto
export type CaptainTournamentEligibilityTeam = TournamentEligibilityTeamDto
export type CaptainTournamentEligibilityIssue = TournamentEligibilityIssueDto
export type CaptainTournamentEligibilityIssueCode = TournamentEligibilityIssueDtoCode

export type CaptainTournamentEligibilityAction = {
  label: string
  to: string
}

export type CaptainTournamentEligibilityIssueView = CaptainTournamentEligibilityIssue & {
  title: string
  action?: CaptainTournamentEligibilityAction
}

export type CaptainTournamentEligibilityView = {
  eligible: boolean
  team: CaptainTournamentEligibilityTeam | null
  issues: CaptainTournamentEligibilityIssueView[]
}
