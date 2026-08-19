import type {
  CaptainProfileResponseDto,
  UpdateCaptainProfileDto,
} from '@/api/generated/captain'

export type CaptainProfile = CaptainProfileResponseDto
export type CaptainProfileUpdate = UpdateCaptainProfileDto

export type CaptainProfileFormValues = {
  displayName: string
  email: string
  phoneNumber: string
  discordUsername: string
}
