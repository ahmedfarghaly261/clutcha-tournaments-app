import { useDeferredValue, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react'
import {
  PublicTournamentsControllerListPublicTournamentsMode,
  PublicTournamentsControllerListPublicTournamentsSortBy,
  PublicTournamentsControllerListPublicTournamentsSortDirection,
  PublicTournamentsControllerListPublicTournamentsStatus,
} from '@/api/generated/public-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CaptainTournamentCard } from '../components/CaptainTournamentCard'
import { useCaptainTournamentDiscoveryService } from '../services/captain-tournament-discovery.service'
import { transformTournamentSummaryToDiscoveryCard } from '../transformers/captain-tournament-discovery.transformer'
import type { CaptainTournamentQuery } from '../types/captain-tournament-discovery.types'

const pageSize = 9
const allFilter = 'ALL'

export function CaptainTournamentDiscoveryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gameKey, setGameKey] = useState(allFilter)
  const [mode, setMode] = useState(allFilter)
  const [status, setStatus] = useState(allFilter)
  const [sort, setSort] = useState('startsAt:asc')
  const deferredSearch = useDeferredValue(search.trim())
  const [sortBy, sortDirection] = sort.split(':')

  const params = useMemo<CaptainTournamentQuery>(() => ({
    page,
    limit: pageSize,
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(gameKey !== allFilter ? { gameKey } : {}),
    ...(mode !== allFilter ? { mode: mode as CaptainTournamentQuery['mode'] } : {}),
    ...(status !== allFilter ? { status: status as CaptainTournamentQuery['status'] } : {}),
    sortBy: sortBy as CaptainTournamentQuery['sortBy'],
    sortDirection: sortDirection as CaptainTournamentQuery['sortDirection'],
  }), [deferredSearch, gameKey, mode, page, sortBy, sortDirection, status])

  const tournamentQuery = useCaptainTournamentDiscoveryService(params)
  const cards = (tournamentQuery.data?.items ?? []).map(transformTournamentSummaryToDiscoveryCard)
  const meta = tournamentQuery.data?.meta
  const filtersActive = Boolean(search || gameKey !== allFilter || mode !== allFilter || status !== allFilter || sort !== 'startsAt:asc')

  const updateFilter = (setter: (value: string) => void, value: string | null) => {
    setter(value ?? allFilter)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setGameKey(allFilter)
    setMode(allFilter)
    setStatus(allFilter)
    setSort('startsAt:asc')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.11em] text-[#71dcff]">Captain Workspace</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#f2f6fb]">Find Tournaments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9da9b8]">Explore published competitions and find the right opportunity for your team.</p>
        </div>
        {meta && <p className="text-xs font-black uppercase tracking-[0.08em] text-[#8e9baa]">{meta.totalItems} tournament{meta.totalItems === 1 ? '' : 's'} found</p>}
      </header>

      <Card className="border-[#2c3842] bg-[#14191e]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(150px,0.7fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#83919f]" />
            <Input className="pl-10" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search tournaments..." />
          </div>
          <Select value={gameKey} onValueChange={(value) => updateFilter(setGameKey, value)}><SelectTrigger aria-label="Filter by game"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={allFilter}>All games</SelectItem><SelectItem value="valorant">Valorant</SelectItem><SelectItem value="league-of-legends">League of Legends</SelectItem><SelectItem value="counter-strike-2">Counter-Strike 2</SelectItem><SelectItem value="rocket-league">Rocket League</SelectItem><SelectItem value="ea-sports-fc">EA Sports FC</SelectItem><SelectItem value="pubg">PUBG</SelectItem></SelectContent></Select>
          <Select value={mode} onValueChange={(value) => updateFilter(setMode, value)}><SelectTrigger aria-label="Filter by mode"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={allFilter}>All modes</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsMode.ONLINE}>Online</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsMode.ONSITE}>On-site</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={(value) => updateFilter(setStatus, value)}><SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={allFilter}>All statuses</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.REGISTRATION_OPEN}>Registration open</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.PUBLISHED}>Upcoming</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.REGISTRATION_CLOSED}>Registration closed</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.CHECK_IN_OPEN}>Check-in open</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.IN_PROGRESS}>In progress</SelectItem><SelectItem value={PublicTournamentsControllerListPublicTournamentsStatus.COMPLETED}>Completed</SelectItem></SelectContent></Select>
          <Select value={sort} onValueChange={(value) => updateFilter(setSort, value)}><SelectTrigger aria-label="Sort tournaments"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={`${PublicTournamentsControllerListPublicTournamentsSortBy.startsAt}:${PublicTournamentsControllerListPublicTournamentsSortDirection.asc}`}>Starting soon</SelectItem><SelectItem value={`${PublicTournamentsControllerListPublicTournamentsSortBy.registrationClosesAt}:${PublicTournamentsControllerListPublicTournamentsSortDirection.asc}`}>Registration closing</SelectItem><SelectItem value={`${PublicTournamentsControllerListPublicTournamentsSortBy.publishedAt}:${PublicTournamentsControllerListPublicTournamentsSortDirection.desc}`}>Recently published</SelectItem><SelectItem value={`${PublicTournamentsControllerListPublicTournamentsSortBy.name}:${PublicTournamentsControllerListPublicTournamentsSortDirection.asc}`}>Name A–Z</SelectItem></SelectContent></Select>
          <Button variant="outline" disabled={!filtersActive} onClick={clearFilters}><RotateCcw /> Reset</Button>
        </CardContent>
      </Card>

      {tournamentQuery.isLoading && <div className="flex min-h-72 items-center justify-center rounded-xl border border-[#2c343e] bg-[#15191f] text-sm text-[#9da9b8]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#71dcff]" /> Loading tournaments...</div>}

      {tournamentQuery.isError && <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]"><CircleAlert className="h-5 w-5" /><AlertTitle>Tournaments could not be loaded</AlertTitle><AlertDescription className="text-[#e6b8bc]">Refresh this request and try again.</AlertDescription><Button className="mt-3 w-fit" variant="outline" size="sm" onClick={() => void tournamentQuery.refetch()}>Try again</Button></Alert>}

      {tournamentQuery.isSuccess && cards.length === 0 && <Card className="border-dashed border-[#385361] bg-[#121a20]"><CardContent className="py-14 text-center"><Trophy className="mx-auto h-11 w-11 text-[#71dcff]" /><h2 className="mt-4 text-xl font-black text-[#eef5fa]">No tournaments found</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#96a4b4]">Try changing the search or filters. Only public tournament lifecycle states are returned.</p>{filtersActive && <Button className="mt-5" variant="outline" onClick={clearFilters}><RotateCcw /> Clear filters</Button>}</CardContent></Card>}

      {cards.length > 0 && <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy={tournamentQuery.isFetching}>{cards.map((tournament) => <CaptainTournamentCard key={tournament.id} tournament={tournament} />)}</section>}

      {meta && meta.totalPages > 1 && <nav className="flex items-center justify-center gap-4" aria-label="Tournament pages"><Button variant="outline" disabled={!meta.hasPreviousPage || tournamentQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft /> Previous</Button><span className="text-xs font-bold text-[#a4b0bd]">Page {meta.page} of {meta.totalPages}</span><Button variant="outline" disabled={!meta.hasNextPage || tournamentQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next <ChevronRight /></Button></nav>}
    </div>
  )
}
