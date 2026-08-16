import type {
  OrganizerBracketMatchDto,
  OrganizerBracketResponseDto,
  OrganizerBracketRoundDto,
  OrganizerBracketTeamDto,
  OrganizerBracketTournamentDtoMode,
  GamingRoomResponseDto,
  TournamentResponseDto,
} from '@/api/generated/organizer-tournaments'

export type TournamentBracket = OrganizerBracketResponseDto
export type TournamentBracketRound = OrganizerBracketRoundDto
export type TournamentBracketMatch = OrganizerBracketMatchDto
export type TournamentBracketTeam = OrganizerBracketTeamDto
export type BracketTournamentSummary = TournamentResponseDto
export type TournamentBracketMode = OrganizerBracketTournamentDtoMode
export type TournamentMatchGamingRoom = GamingRoomResponseDto

export interface TournamentMatchScheduleFormValues {
  scheduledAt: string
  serverRegion: string
  lobbyName: string
  lobbyCode: string
  lobbyPassword: string
  notes: string
  gamingRoomId: string
  onsiteStationLabel: string
}

export const bracketGenerationStatuses = ['REGISTRATION_CLOSED', 'CHECK_IN_OPEN'] as const
