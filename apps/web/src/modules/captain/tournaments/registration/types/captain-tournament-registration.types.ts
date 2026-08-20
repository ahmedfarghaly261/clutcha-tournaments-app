import type {
  CreateTournamentRegistrationDto,
  TournamentRegistrationResponseDto,
} from '@/api/generated/captain-tournaments'

export type CreateCaptainTournamentRegistration = CreateTournamentRegistrationDto
export type CaptainTournamentRegistration = TournamentRegistrationResponseDto

export type CaptainTournamentRegistrationFormValues = {
  acceptRules: boolean
}

export type CaptainTournamentRegistrationDialogDetails = {
  tournamentId: string
  tournamentName: string
  rules: string
  rulesVersion: string
  registrationFeeLabel: string
}
