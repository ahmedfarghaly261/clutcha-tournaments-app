import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Globe2,
  MapPin,
  Plus,
  Search,
  Trophy,
  UsersRound,
} from 'lucide-react'
import {
  OrganizerTournamentsControllerListOrganizerTournamentsMode,
  OrganizerTournamentsControllerListOrganizerTournamentsSortBy,
  OrganizerTournamentsControllerListOrganizerTournamentsSortDirection,
  OrganizerTournamentsControllerListOrganizerTournamentsStatus,
  type TournamentResponseDto,
} from '@/api/generated/organizer-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useOrganizerTournamentsService } from '../services/organizer-tournaments.service'

const statusOptions = [
  { value: 'ALL', label: 'All statuses' },
  ...Object.values(OrganizerTournamentsControllerListOrganizerTournamentsStatus).map((value) => ({
    value,
    label: formatLabel(value),
  })),
]

const modeOptions = [
  { value: 'ALL', label: 'All modes' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsMode.ONLINE, label: 'Online' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsMode.ONSITE, label: 'On-site' },
]

const sortOptions = [
  { value: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.updatedAt, label: 'Recently updated' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.createdAt, label: 'Recently created' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.startsAt, label: 'Start date' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.registrationClosesAt, label: 'Registration deadline' },
  { value: OrganizerTournamentsControllerListOrganizerTournamentsSortBy.name, label: 'Tournament name' },
]

const statusStyles: Record<string, string> = {
  DRAFT: 'border-[#62586a] bg-[#302a34] text-[#d8cedc]',
  PUBLISHED: 'border-[#78549a] bg-[#412551] text-[#e8c4ff]',
  REGISTRATION_OPEN: 'border-[#197863] bg-[#123d35] text-[#8ff5d8]',
  REGISTRATION_CLOSED: 'border-[#796628] bg-[#3e3518] text-[#ffe18a]',
  CHECK_IN_OPEN: 'border-[#25758a] bg-[#173b45] text-[#9ceaff]',
  IN_PROGRESS: 'border-[#9a4d64] bg-[#4d2430] text-[#ffc0d0]',
  COMPLETED: 'border-[#446b91] bg-[#243a4f] text-[#b9dcff]',
  POSTPONED: 'border-[#8c672e] bg-[#46351e] text-[#ffd49a]',
  CANCELLED: 'border-[#8b4444] bg-[#482323] text-[#ffb8b2]',
  ARCHIVED: 'border-[#57515a] bg-[#29262b] text-[#aaa1ad]',
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value))
}

function TournamentCard({ tournament }: { tournament: TournamentResponseDto }) {
  const ModeIcon = tournament.mode === 'ONLINE' ? Globe2 : MapPin
  const prizePool = Number(tournament.prizePool)

  return (
    <Card className="group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-[#665470] hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
      <div className="relative h-40 overflow-hidden border-b border-[#39343c] bg-[radial-gradient(circle_at_top_right,rgba(183,91,246,0.34),transparent_45%),linear-gradient(135deg,#211a25,#111013)]">
        {tournament.coverUrl ? (
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            src={tournament.coverUrl}
            alt=""
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#8e7d96]">
            <Trophy className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <span className={cn('absolute left-4 top-4 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] backdrop-blur', statusStyles[tournament.status] ?? statusStyles.ARCHIVED)}>
          {formatLabel(tournament.status)}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          <ModeIcon className="h-3 w-3" aria-hidden="true" /> {formatLabel(tournament.mode)}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#c98cff]">{formatLabel(tournament.gameKey.replaceAll('-', '_'))}</p>
            <h2 className="mt-1 truncate text-lg font-black tracking-[-0.025em] text-[#f4eff6]">{tournament.name}</h2>
          </div>
          <span className="shrink-0 rounded border border-[#443b49] bg-[#151317] px-2 py-1 text-[9px] font-bold uppercase text-[#a99dac]">
            {formatLabel(tournament.visibility)}
          </span>
        </div>

        <p className="mt-3 min-h-10 line-clamp-2 text-xs leading-5 text-[#a99dac]">
          {tournament.shortDescription || 'No tournament description has been added yet.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#342f37] py-4">
          <div className="flex items-center gap-2 text-xs text-[#b9aebd]">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#d49aff]" aria-hidden="true" />
            <span className="truncate">{formatDate(tournament.startsAt, tournament.timezone)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#b9aebd]">
            <UsersRound className="h-4 w-4 shrink-0 text-[#58ddff]" aria-hidden="true" />
            <span>{tournament.minimumTeams}–{tournament.maximumTeams} teams</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#b9aebd]">
            <Gamepad2 className="h-4 w-4 shrink-0 text-[#8cf1d2]" aria-hidden="true" />
            <span>{formatLabel(tournament.format)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#b9aebd]">
            <CircleDollarSign className="h-4 w-4 shrink-0 text-[#ffd280]" aria-hidden="true" />
            <span>{prizePool.toLocaleString()} {tournament.currency}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="truncate font-mono text-[10px] text-[#796f7e]">{tournament.slug}</p>
          <span className="text-[10px] font-bold text-[#9e919f]">Updated {formatDate(tournament.updatedAt, tournament.timezone)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TournamentCardSkeleton() {
  return (
    <Card className="animate-pulse overflow-hidden">
      <div className="h-40 border-b border-[#39343c] bg-[#252126]" />
      <CardContent>
        <div className="h-3 w-24 rounded bg-[#312b33]" />
        <div className="mt-3 h-6 w-3/4 rounded bg-[#312b33]" />
        <div className="mt-5 h-10 rounded bg-[#252126]" />
        <div className="mt-5 h-20 rounded bg-[#252126]" />
      </CardContent>
    </Card>
  )
}

export function OrganizerTournamentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [mode, setMode] = useState('ALL')
  const [sortBy, setSortBy] = useState<OrganizerTournamentsControllerListOrganizerTournamentsSortBy>(
    OrganizerTournamentsControllerListOrganizerTournamentsSortBy.updatedAt,
  )
  const deferredSearch = useDeferredValue(search.trim())

  const tournamentsQuery = useOrganizerTournamentsService({
    page,
    limit: 9,
    search: deferredSearch || undefined,
    status: status === 'ALL'
      ? undefined
      : status as OrganizerTournamentsControllerListOrganizerTournamentsStatus,
    mode: mode === 'ALL'
      ? undefined
      : mode as OrganizerTournamentsControllerListOrganizerTournamentsMode,
    sortBy,
    sortDirection: OrganizerTournamentsControllerListOrganizerTournamentsSortDirection.desc,
  })

  const data = tournamentsQuery.data
  const tournaments = data?.items ?? []
  const meta = data?.meta

  const updateFilter = (setter: (value: string) => void, value: string | null) => {
    setter(value ?? 'ALL')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl pb-8">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7] sm:text-4xl">Your Tournaments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99ead]">
            Explore, filter, and track every tournament created by your organization.
          </p>
        </div>
        <Button render={<Link to="/organizer/tournaments/new" />} size="lg" className="text-xs font-black uppercase tracking-[0.08em]">
          <Plus className="h-4 w-4" aria-hidden="true" /> New tournament
        </Button>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_190px_170px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d8291]" aria-hidden="true" />
            <Input
              className="pl-10"
              type="search"
              placeholder="Search by name, game, or slug…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              aria-label="Search tournaments"
            />
          </div>

          <Select value={status} onValueChange={(value) => updateFilter(setStatus, value)}>
            <SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={mode} onValueChange={(value) => updateFilter(setMode, value)}>
            <SelectTrigger aria-label="Filter by mode"><SelectValue /></SelectTrigger>
            <SelectContent>{modeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => {
              if (value) setSortBy(value as OrganizerTournamentsControllerListOrganizerTournamentsSortBy)
              setPage(1)
            }}
          >
            <SelectTrigger aria-label="Sort tournaments"><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {meta && (
        <div className="mb-5 flex items-center justify-between text-xs text-[#978b9b]">
          <p><strong className="text-[#e6dee9]">{meta.totalItems}</strong> tournament{meta.totalItems === 1 ? '' : 's'} found</p>
          {tournamentsQuery.isFetching && <p className="text-[#d7a5ff]">Refreshing…</p>}
        </div>
      )}

      {tournamentsQuery.isLoading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <TournamentCardSkeleton key={index} />)}
        </div>
      )}

      {tournamentsQuery.isError && (
        <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
          <AlertTitle>Could not load tournaments</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 text-[#ffcbc7] sm:flex-row sm:items-center sm:justify-between">
            <span>Please check the API connection and try again.</span>
            <Button variant="outline" size="sm" type="button" onClick={() => void tournamentsQuery.refetch()}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      {!tournamentsQuery.isLoading && !tournamentsQuery.isError && tournaments.length === 0 && (
        <Card className="border-dashed py-14 text-center">
          <CardContent>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d7a5ff]/10 text-[#d7a5ff]">
              <Trophy className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-black text-[#f2edf4]">No tournaments found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a99dac]">
              {search || status !== 'ALL' || mode !== 'ALL'
                ? 'Try changing your search or filters.'
                : 'Create your first tournament to start building your competition calendar.'}
            </p>
            {!search && status === 'ALL' && mode === 'ALL' && (
              <Button render={<Link to="/organizer/tournaments/new" />} className="mt-5">
                <Plus className="h-4 w-4" aria-hidden="true" /> Create tournament
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {tournaments.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} />)}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between rounded-xl border border-[#39343c] bg-[#1b191c] p-4" aria-label="Tournament pages">
          <Button variant="outline" type="button" disabled={!meta.hasPreviousPage || tournamentsQuery.isFetching} onClick={() => setPage((current) => current - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
          </Button>
          <p className="text-xs font-bold text-[#a99dac]">Page <span className="text-white">{meta.page}</span> of <span className="text-white">{meta.totalPages}</span></p>
          <Button variant="outline" type="button" disabled={!meta.hasNextPage || tournamentsQuery.isFetching} onClick={() => setPage((current) => current + 1)}>
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}
