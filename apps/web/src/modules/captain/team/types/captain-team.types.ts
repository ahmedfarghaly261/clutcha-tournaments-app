import type {
  CaptainTeamResponseDto,
  CreateCaptainTeamDto,
  UpdateCaptainTeamDto,
} from '@/api/generated/captain'

export type CaptainTeam = CaptainTeamResponseDto
export type CreateCaptainTeam = CreateCaptainTeamDto
export type UpdateCaptainTeam = UpdateCaptainTeamDto

export type CaptainTeamFormValues = {
  name: string
  description: string
  gameKey: string
  region: string
  discordServerUrl: string
}

export type CaptainTeamFormMode = 'create' | 'edit'
