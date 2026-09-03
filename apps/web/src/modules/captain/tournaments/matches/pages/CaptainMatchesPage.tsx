import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CircleAlert, Gamepad2, MapPin, Swords, Trophy } from 'lucide-react'
import {
  CaptainRegistrationsControllerListRegistrationsSortBy,
  CaptainRegistrationsControllerListRegistrationsSortDirection,
  CaptainRegistrationsControllerListRegistrationsStatus,
} from '@/api/generated/captain-registrations'
import type { CaptainMatchResponseDto, CaptainRegistrationListItemDto } from '@/api/generated/captain-registrations'
import {
  useCaptainRegistrationsControllerGetRegistrationMatch,
  useCaptainRegistrationsControllerListRegistrationMatches,
  useCaptainRegistrationsControllerListRegistrations,
} from '@/api/generated/captain-registrations/captain-registrations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function stringValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return null
}

function RegistrationButton({
  registration,
  selected,
  onSelect,
}: {
  registration: CaptainRegistrationListItemDto
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button variant="ghost" onClick={onSelect} className={cn('h-auto w-full justify-start rounded-lg border bg-[#1b191c] p-4 text-left hover:border-[#6b5a74]', selected ? 'border-[#71dcff] ring-1 ring-[#71dcff]/25' : 'border-[#39343c]')}>
      <div className="w-full">
        <p className="font-black text-[#f2edf4]">{registration.tournament.name}</p>
        <p className="mt-1 text-xs font-bold text-[#9f94a4]">{formatLabel(registration.tournament.gameKey)} - {formatLabel(registration.tournament.mode)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="success">{formatLabel(registration.status)}</Badge>
          <Badge variant="info">{formatLabel(registration.tournament.status)}</Badge>
        </div>
      </div>
    </Button>
  )
}

function MatchButton({ match, selected, onSelect }: { match: CaptainMatchResponseDto; selected: boolean; onSelect: () => void }) {
  return (
    <Button variant="ghost" onClick={onSelect} className={cn('h-auto w-full justify-start rounded-lg border bg-[#151316] p-4 text-left hover:border-[#6b5a74]', selected ? 'border-[#d7a5ff] ring-1 ring-[#d7a5ff]/20' : 'border-[#343037]')}>
      <div className="w-full">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#f2edf4]">{match.opponent?.teamName ?? 'Opponent TBD'}</p>
            <p className="mt-1 text-xs text-[#9f94a4]">{match.stage} - Round {match.round}</p>
          </div>
          <Badge variant="info">{formatLabel(match.status)}</Badge>
        </div>
        <p className="mt-3 text-xs font-bold text-[#c9becd]">{formatDate(match.scheduledAt)}</p>
      </div>
    </Button>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-1 wrap-break-word text-sm font-bold text-[#e8e1ea]">{value}</p></div>
}

function MatchDetails({ registrationId, matchId }: { registrationId: string; matchId: string }) {
  const matchQuery = useCaptainRegistrationsControllerGetRegistrationMatch(registrationId, matchId, {
    query: { enabled: Boolean(registrationId && matchId), staleTime: 15_000 },
  })

  if (matchQuery.isLoading) return <Skeleton className="h-[520px]" />
  if (matchQuery.isError || !matchQuery.data) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Match could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  const match = matchQuery.data
  const onlineInfo = match.onlineServer?.onlineServerInfo
  const lobbyName = stringValue(onlineInfo, ['lobbyName', 'name', 'serverName'])
  const lobbyCode = stringValue(onlineInfo, ['lobbyCode', 'code'])
  const lobbyPassword = stringValue(onlineInfo, ['lobbyPassword', 'password'])
  const notes = stringValue(onlineInfo, ['notes', 'instructions'])

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="items-start justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle>{match.tournament.name}</CardTitle>
            <p className="mt-1 text-sm text-[#9f94a4]">vs {match.opponent?.teamName ?? 'Opponent TBD'}</p>
          </div>
          <Badge variant="info">{formatLabel(match.status)}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Info label="Scheduled" value={formatDate(match.scheduledAt)} />
          <Info label="Stage" value={match.stage} />
          <Info label="Round" value={String(match.round)} />
          <Info label="Best of" value={String(match.bestOf)} />
          <Info label="Score" value={`${match.captainTeamScore ?? '-'} - ${match.opponentScore ?? '-'}`} />
          <Info label="Result" value={formatLabel(match.officialResultStatus)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Gamepad2 className="h-5 w-5 text-[#71dcff]" /><CardTitle>Match access</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {match.tournament.mode === 'ONLINE' ? (
            <>
              <Info label="Lobby" value={lobbyName ?? '-'} />
              <Info label="Code" value={lobbyCode ?? '-'} />
              <Info label="Password" value={lobbyPassword ?? '-'} />
              <Info label="Notes" value={notes ?? '-'} />
            </>
          ) : (
            <>
              <Info label="Gaming room" value={match.onsiteAssignment?.roomName ?? '-'} />
              <Info label="Station" value={match.onsiteAssignment?.stationLabel ?? '-'} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Trophy className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Map results</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {match.mapResults.map((game) => <div key={game.id} className="grid gap-3 rounded-md border border-[#343037] bg-[#151316] p-3 sm:grid-cols-4"><Info label="Game" value={String(game.gameNumber)} /><Info label="Map" value={game.mapName ?? '-'} /><Info label="Score" value={`${game.captainTeamScore ?? '-'} - ${game.opponentScore ?? '-'}`} /><Info label="Evidence" value={game.evidenceAvailable ? 'Available' : 'Not available'} /></div>)}
          {match.mapResults.length === 0 && <p className="text-sm text-[#9f94a4]">No map results yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CircleAlert className="h-5 w-5 text-[#ffd08b]" /><CardTitle>Review state</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Info label="Forfeit" value={formatLabel(match.forfeitStatus)} />
          <Info label="Dispute" value={formatLabel(match.disputeStatus)} />
          <Info label="Evidence" value={match.evidenceAvailable ? 'Available' : 'Not available'} />
        </CardContent>
      </Card>
    </div>
  )
}

function RegistrationMatches({ registrationId }: { registrationId: string }) {
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const matchesQuery = useCaptainRegistrationsControllerListRegistrationMatches(registrationId, {
    query: { enabled: Boolean(registrationId), staleTime: 15_000 },
  })
  const matches = matchesQuery.data?.items ?? []
  const activeMatchId = selectedMatchId || matches[0]?.id || ''

  if (matchesQuery.isLoading) return <Skeleton className="h-[560px]" />
  if (matchesQuery.isError) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Matches could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-3">
        {matches.map((match) => <MatchButton key={match.id} match={match} selected={activeMatchId === match.id} onSelect={() => setSelectedMatchId(match.id)} />)}
        {matches.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center"><Swords className="mx-auto h-10 w-10 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">No matches yet</p><p className="mt-1 text-xs text-[#958a99]">Matches appear after the organizer generates the bracket.</p></CardContent></Card>}
      </aside>
      <main>{activeMatchId ? <MatchDetails registrationId={registrationId} matchId={activeMatchId} /> : <Card className="border-dashed"><CardContent className="flex min-h-105 items-center justify-center text-sm text-[#958a99]">Select a match.</CardContent></Card>}</main>
    </div>
  )
}

export function CaptainMatchesPage() {
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const registrationsQuery = useCaptainRegistrationsControllerListRegistrations({
    limit: 100,
    status: CaptainRegistrationsControllerListRegistrationsStatus.CONFIRMED,
    sortBy: CaptainRegistrationsControllerListRegistrationsSortBy.tournamentStartsAt,
    sortDirection: CaptainRegistrationsControllerListRegistrationsSortDirection.asc,
  }, {
    query: { staleTime: 20_000 },
  })
  const registrations = useMemo(() => registrationsQuery.data?.items ?? [], [registrationsQuery.data?.items])
  const activeRegistrationId = selectedRegistrationId || registrations[0]?.registrationId || ''
  const activeRegistration = useMemo(() => registrations.find((registration) => registration.registrationId === activeRegistrationId), [activeRegistrationId, registrations])

  if (registrationsQuery.isLoading) return <Skeleton className="mx-auto h-[70vh] max-w-6xl" />
  if (registrationsQuery.isError) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Matches could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]"><Swords className="h-4 w-4" /> Captain Workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Matches</h1>
        <p className="mt-2 text-sm text-[#a99ead]">View match schedule, opponent, lobby or venue assignment, and official result state.</p>
      </header>

      {registrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-[#756a79]" />
            <p className="mt-3 text-sm font-bold text-[#c6bdc9]">No approved tournaments yet</p>
            <p className="mt-1 text-xs text-[#958a99]">Matches are available after your team is approved for a tournament.</p>
            <Button render={<Link to="/captain/registered" />} className="mt-5">Registered tournaments</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {registrations.map((registration) => <RegistrationButton key={registration.registrationId} registration={registration} selected={registration.registrationId === activeRegistrationId} onSelect={() => setSelectedRegistrationId(registration.registrationId)} />)}
          </div>
          {activeRegistration && <div className="flex items-center gap-2 text-xs font-bold text-[#9f94a4]"><MapPin className="h-4 w-4" /> Showing matches for <span className="text-[#f1ebf3]">{activeRegistration.tournament.name}</span></div>}
          {activeRegistrationId && <RegistrationMatches registrationId={activeRegistrationId} />}
        </div>
      )}
    </div>
  )
}
