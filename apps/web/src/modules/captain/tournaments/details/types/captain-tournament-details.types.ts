import type { PublicTournamentDetailResponseDto } from '@/api/generated/public-tournaments'

export type CaptainTournamentDetails = PublicTournamentDetailResponseDto

export type TournamentTimelineItem = {
  key: string
  label: string
  dateLabel: string
}

export type TournamentPrizeDistributionItem = {
  label: string
  value: number
}

export type CaptainTournamentDetailsView = CaptainTournamentDetails & {
  gameLabel: string
  modeLabel: string
  statusLabel: string
  formatLabel: string
  seedingLabel: string
  registrationFeeLabel: string
  prizePoolLabel: string
  startDateLabel: string
  endDateLabel: string
  registrationWindowLabel: string
  rosterSizeLabel: string
  teamCapacityLabel: string
  timeline: TournamentTimelineItem[]
  prizeDistributionItems: TournamentPrizeDistributionItem[]
}
