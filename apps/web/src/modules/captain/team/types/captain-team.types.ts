import type {
  CaptainTeamResponseDto,
  CreateCaptainRosterPlayerDto,
  CreateCaptainTeamDto,
  UpdateCaptainTeamDto,
} from '@/api/generated/captain'

export type CaptainTeam = CaptainTeamResponseDto
export type CreateCaptainTeam = CreateCaptainTeamDto
export type UpdateCaptainTeam = UpdateCaptainTeamDto
export type CreateCaptainRosterMember = CreateCaptainRosterPlayerDto

export type CaptainTeamFormValues = {
  name: string
  description: string
  gameKey: string
  region: string
  discordServerUrl: string
  captainGamerTag: string
  captainGameAccountId: string
  captainRank: string
  captainCountry: string
  captainRosterType: NonNullable<CreateCaptainRosterPlayerDto['rosterType']>
}

export type CaptainTeamFormMode = 'create' | 'edit'
