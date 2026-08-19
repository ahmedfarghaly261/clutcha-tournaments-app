import type {
  CreateRosterPlayerDto,
  CreateRosterPlayerDtoRosterType,
  RosterPlayerResponseDto,
  UpdateRosterPlayerDto,
} from '@/api/generated/captain'

export type RosterPlayer = RosterPlayerResponseDto
export type CreateRosterPlayer = CreateRosterPlayerDto
export type UpdateRosterPlayer = UpdateRosterPlayerDto
export type RosterPlayerType = CreateRosterPlayerDtoRosterType

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
