import type {
  CreateTournamentDtoFormat,
  CreateTournamentDtoMode,
  CreateTournamentDtoSeedingMethod,
  CreateTournamentDtoVisibility,
} from '@/api/generated/organizer-tournaments'

export type TournamentCreationStep = 1 | 2 | 3 | 4

export interface TournamentCreationFormValues {
  name: string
  shortDescription: string
  description: string
  coverUrl: string
  gameKey: string
  mode: CreateTournamentDtoMode
  visibility: CreateTournamentDtoVisibility
  format: CreateTournamentDtoFormat
  seedingMethod: CreateTournamentDtoSeedingMethod
  minimumTeams: number
  maximumTeams: number
  minimumStarters: number
  maximumStarters: number
  maximumSubstitutes: number
  defaultBestOf: number
  finalBestOf: number
  thirdPlaceMatch: boolean
  requiredGameAccountId: boolean
  allowedRegion: string
  allowedCountries: string
  allowedPlatforms: string[]
  minimumPlayerAge: number
  minimumRank: string
  maximumRank: string
  rules: string
  registrationOpensAt: string
  registrationClosesAt: string
  startsAt: string
  endsAt: string
  timezone: string
  waitlistEnabled: boolean
  maximumWaitlistSize: number
  manualApprovalRequired: boolean
  registrationFee: number
  currency: string
  prizePool: number
  firstPlacePercentage: number
  secondPlacePercentage: number
  thirdPlacePercentage: number
  refundPolicy: string
  cancellationPolicy: string
}
