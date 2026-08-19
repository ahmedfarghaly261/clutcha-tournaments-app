import type {
  CaptainTournamentSummary,
  TournamentDiscoveryCard,
} from '../types/captain-tournament-discovery.types'

const gameLabels: Record<string, string> = {
  valorant: 'Valorant',
  'league-of-legends': 'League of Legends',
  'counter-strike-2': 'Counter-Strike 2',
  'rocket-league': 'Rocket League',
  'ea-sports-fc': 'EA Sports FC',
  pubg: 'PUBG',
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatMoney(value: string, currency: string, freeLabel: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${value} ${currency}`
  if (amount === 0) return freeLabel

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

export function transformTournamentSummaryToDiscoveryCard(
  tournament: CaptainTournamentSummary,
): TournamentDiscoveryCard {
  return {
    ...tournament,
    gameLabel: gameLabels[tournament.gameKey] ?? titleCase(tournament.gameKey),
    modeLabel: titleCase(tournament.mode),
    statusLabel: titleCase(tournament.status),
    formatLabel: titleCase(tournament.format),
    startsAtLabel: formatDate(tournament.startsAt),
    registrationClosesAtLabel: formatDate(tournament.registrationClosesAt),
    prizeLabel: formatMoney(tournament.prizePool, tournament.currency, 'No prize listed'),
    registrationFeeLabel: formatMoney(tournament.registrationFee, tournament.currency, 'Free entry'),
  }
}
