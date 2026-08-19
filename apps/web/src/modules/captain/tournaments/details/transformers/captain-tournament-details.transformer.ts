import type {
  CaptainTournamentDetails,
  CaptainTournamentDetailsView,
  TournamentPrizeDistributionItem,
  TournamentTimelineItem,
} from '../types/captain-tournament-details.types'

const gameLabels: Record<string, string> = {
  valorant: 'Valorant',
  'league-of-legends': 'League of Legends',
  'counter-strike-2': 'Counter-Strike 2',
  'rocket-league': 'Rocket League',
  'ea-sports-fc': 'EA Sports FC',
  pubg: 'PUBG',
}

export function titleCaseTournamentValue(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatTournamentDate(value: string | null | undefined, timezone: string): string {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  try {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
}

function formatMoney(value: string, currency: string, zeroLabel: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${value} ${currency}`
  if (amount === 0) return zeroLabel

  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('en')} ${currency}`
  }
}

function buildTimeline(tournament: CaptainTournamentDetails): TournamentTimelineItem[] {
  const values = [
    ['registration-opens', 'Registration opens', tournament.registrationOpensAt],
    ['registration-closes', 'Registration closes', tournament.registrationClosesAt],
    ['roster-locks', 'Roster locks', tournament.rosterLocksAt],
    ['check-in-opens', 'Check-in opens', tournament.checkInOpensAt],
    ['check-in-closes', 'Check-in closes', tournament.checkInClosesAt],
    ['tournament-starts', 'Tournament starts', tournament.startsAt],
    ['tournament-ends', 'Tournament ends', tournament.endsAt],
  ] as const

  return values.flatMap(([key, label, value]) => value ? [{
    key,
    label,
    dateLabel: formatTournamentDate(value, tournament.timezone),
  }] : [])
}

function buildPrizeDistribution(
  distribution: CaptainTournamentDetails['prizeDistribution'],
): TournamentPrizeDistributionItem[] {
  if (!distribution) return []

  return Object.entries(distribution).flatMap(([key, value]) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return []
    return [{
      label: titleCaseTournamentValue(key.replace(/Percentage$/, '')),
      value,
    }]
  })
}

export function transformTournamentDetails(
  tournament: CaptainTournamentDetails,
): CaptainTournamentDetailsView {
  const substituteLabel = tournament.maximumSubstitutes === 1 ? 'substitute' : 'substitutes'

  return {
    ...tournament,
    gameLabel: gameLabels[tournament.gameKey] ?? titleCaseTournamentValue(tournament.gameKey),
    modeLabel: titleCaseTournamentValue(tournament.mode),
    statusLabel: titleCaseTournamentValue(tournament.status),
    formatLabel: titleCaseTournamentValue(tournament.format),
    seedingLabel: titleCaseTournamentValue(tournament.seedingMethod),
    registrationFeeLabel: formatMoney(tournament.registrationFee, tournament.currency, 'Free entry'),
    prizePoolLabel: formatMoney(tournament.prizePool, tournament.currency, 'No prize listed'),
    startDateLabel: formatTournamentDate(tournament.startsAt, tournament.timezone),
    endDateLabel: formatTournamentDate(tournament.endsAt, tournament.timezone),
    registrationWindowLabel: `${formatTournamentDate(tournament.registrationOpensAt, tournament.timezone)} – ${formatTournamentDate(tournament.registrationClosesAt, tournament.timezone)}`,
    rosterSizeLabel: `${tournament.minimumStarters}–${tournament.maximumStarters} starters · up to ${tournament.maximumSubstitutes} ${substituteLabel}`,
    teamCapacityLabel: `${tournament.minimumTeams}–${tournament.maximumTeams} teams`,
    timeline: buildTimeline(tournament),
    prizeDistributionItems: buildPrizeDistribution(tournament.prizeDistribution),
  }
}
