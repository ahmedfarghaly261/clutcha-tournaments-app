import type {
  CreateCaptainRosterPlayerDto,
  CreateRosterPlayerDto,
  CreateRosterPlayerDtoRosterType,
  RosterPlayerResponseDto,
  UpdateRosterPlayerDto,
} from '@/api/generated/captain'

export type RosterPlayer = RosterPlayerResponseDto
export type CreateRosterPlayer = CreateRosterPlayerDto
export type UpdateRosterPlayer = UpdateRosterPlayerDto
export type RosterPlayerType = CreateRosterPlayerDtoRosterType
export type CreateCaptainRosterPlayer = CreateCaptainRosterPlayerDto

export type RosterPlayerFormValues = {
  gamerTag: string
  realName: string
  gameAccountId: string
  phoneNumber: string
  email: string
  discordUsername: string
  rank: string
  country: string
  rosterType: RosterPlayerType
}

export type RosterEditorMode = 'create' | 'edit'

export type CaptainRosterMemberFormValues = {
  gamerTag: string
  gameAccountId: string
  rank: string
  country: string
  rosterType: RosterPlayerType
}
