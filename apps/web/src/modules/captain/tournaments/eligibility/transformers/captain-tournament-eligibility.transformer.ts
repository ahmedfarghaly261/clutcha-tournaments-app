import { TournamentEligibilityIssueDtoCode } from '@/api/generated'
import type {
  CaptainTournamentEligibility,
  CaptainTournamentEligibilityAction,
  CaptainTournamentEligibilityIssueCode,
  CaptainTournamentEligibilityView,
} from '../types/captain-tournament-eligibility.types'

const issueTitles: Record<CaptainTournamentEligibilityIssueCode, string> = {
  CAPTAIN_PROFILE_INCOMPLETE: 'Captain profile incomplete',
  TEAM_NOT_CREATED: 'Team not registered',
  TEAM_INACTIVE: 'Team is not active',
  REGISTRATION_NOT_OPEN: 'Registration is not open',
  REGISTRATION_DEADLINE_PASSED: 'Registration deadline passed',
  TOURNAMENT_FULL: 'Tournament capacity reached',
  ALREADY_REGISTERED: 'Team already registered',
  GAME_MISMATCH: 'Team game does not match',
  INSUFFICIENT_STARTERS: 'More starters required',
  TOO_MANY_STARTERS: 'Too many starters',
  TOO_MANY_SUBSTITUTES: 'Too many substitutes',
  MISSING_GAME_ACCOUNT_ID: 'Game account ID missing',
  MISSING_PLAYER_PHONE: 'Player phone number missing',
  REGION_NOT_ALLOWED: 'Team region is not allowed',
  COUNTRY_NOT_ALLOWED: 'Player country is not allowed',
  PLATFORM_NOT_ALLOWED: 'Platform is not allowed',
  RANK_NOT_ALLOWED: 'Player rank does not qualify',
  PLAYER_INELIGIBLE: 'Roster player is ineligible',
}

const profileCodes = new Set<CaptainTournamentEligibilityIssueCode>([
  TournamentEligibilityIssueDtoCode.CAPTAIN_PROFILE_INCOMPLETE,
])

const teamCodes = new Set<CaptainTournamentEligibilityIssueCode>([
  TournamentEligibilityIssueDtoCode.TEAM_NOT_CREATED,
  TournamentEligibilityIssueDtoCode.TEAM_INACTIVE,
  TournamentEligibilityIssueDtoCode.GAME_MISMATCH,
  TournamentEligibilityIssueDtoCode.REGION_NOT_ALLOWED,
])

const rosterCodes = new Set<CaptainTournamentEligibilityIssueCode>([
  TournamentEligibilityIssueDtoCode.INSUFFICIENT_STARTERS,
  TournamentEligibilityIssueDtoCode.TOO_MANY_STARTERS,
  TournamentEligibilityIssueDtoCode.TOO_MANY_SUBSTITUTES,
  TournamentEligibilityIssueDtoCode.MISSING_GAME_ACCOUNT_ID,
  TournamentEligibilityIssueDtoCode.MISSING_PLAYER_PHONE,
  TournamentEligibilityIssueDtoCode.COUNTRY_NOT_ALLOWED,
  TournamentEligibilityIssueDtoCode.RANK_NOT_ALLOWED,
  TournamentEligibilityIssueDtoCode.PLAYER_INELIGIBLE,
])

function getIssueAction(
  code: CaptainTournamentEligibilityIssueCode,
): CaptainTournamentEligibilityAction | undefined {
  if (profileCodes.has(code)) return { label: 'Complete profile', to: '/captain/profile' }
  if (teamCodes.has(code)) return { label: 'Manage team', to: '/captain/team' }
  if (rosterCodes.has(code)) return { label: 'Manage roster', to: '/captain/roster' }
  if (code === TournamentEligibilityIssueDtoCode.ALREADY_REGISTERED) {
    return { label: 'View registrations', to: '/captain/registrations' }
  }

  return undefined
}

export function transformTournamentEligibility(
  eligibility: CaptainTournamentEligibility,
): CaptainTournamentEligibilityView {
  return {
    eligible: eligibility.eligible,
    team: eligibility.team ?? null,
    issues: eligibility.issues.map((issue) => ({
      ...issue,
      title: issueTitles[issue.code],
      action: getIssueAction(issue.code),
    })),
  }
}
