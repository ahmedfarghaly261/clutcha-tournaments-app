import type {
  PublicTournamentListResponseDto,
  PublicTournamentsControllerListPublicTournamentsParams,
  PublicTournamentSummaryResponseDto,
} from '@/api/generated/public-tournaments'

export type CaptainTournamentList = PublicTournamentListResponseDto
export type CaptainTournamentSummary = PublicTournamentSummaryResponseDto
export type CaptainTournamentQuery = PublicTournamentsControllerListPublicTournamentsParams

export type TournamentDiscoveryFilters = {
  search: string
  gameKey: string
  mode: string
  status: string
  sort: string
}

export type TournamentDiscoveryCard = CaptainTournamentSummary & {
  gameLabel: string
  modeLabel: string
  statusLabel: string
  formatLabel: string
  startsAtLabel: string
  registrationClosesAtLabel: string
  prizeLabel: string
  registrationFeeLabel: string
}
