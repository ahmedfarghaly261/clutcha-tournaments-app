import type {
  OrganizerBracketMatchDto,
  OrganizerBracketResponseDto,
  OrganizerBracketRoundDto,
  OrganizerBracketTeamDto,
  TournamentResponseDto,
} from '@/api/generated/organizer-tournaments'

export type TournamentBracket = OrganizerBracketResponseDto
export type TournamentBracketRound = OrganizerBracketRoundDto
export type TournamentBracketMatch = OrganizerBracketMatchDto
export type TournamentBracketTeam = OrganizerBracketTeamDto
export type BracketTournamentSummary = TournamentResponseDto

export const bracketGenerationStatuses = ['REGISTRATION_CLOSED', 'CHECK_IN_OPEN'] as const
