import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, GitBranch, Medal, ShieldCheck, Trophy } from 'lucide-react'
import {
  useCaptainRegistrationsControllerGetRegistrationBracket,
  useCaptainRegistrationsControllerGetRegistrationStandings,
} from '@/api/generated/captain-registrations/captain-registrations'
import type {
  CaptainBracketMatchDto,
  CaptainBracketTeamDto,
  CaptainRegistrationBracketResponseDto,
  CaptainRegistrationStandingsResponseDto,
  CaptainStandingItemDto,
} from '@/api/generated/captain-registrations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function TeamRow({ team, score }: { team: CaptainBracketTeamDto | null | undefined; score: number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#343037] bg-[#151316] px-3 py-2">
      <span className={team?.isCaptainTeam ? 'font-black text-[#71dcff]' : 'font-bold text-[#e8e1ea]'}>{team?.name ?? 'TBD'}{team?.isCaptainTeam && ' (you)'}</span>
      <span className="text-lg font-black text-[#f5f1f7]">{score ?? '-'}</span>
    </div>
  )
}

function BracketMatch({ match }: { match: CaptainBracketMatchDto }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#837987]">
          <span>{match.bracketPosition ?? `Round ${match.round}`}</span>
          <span>{formatLabel(match.status)}</span>
        </div>
        <div className="space-y-2">
          <TeamRow team={match.teamA} score={match.teamAScore} />
          <TeamRow team={match.teamB} score={match.teamBScore} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#a99ead]">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(match.scheduledAt)}</span>
          <span>Official result: {formatLabel(match.officialResultStatus)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BracketView({ bracket }: { bracket: CaptainRegistrationBracketResponseDto }) {
  const matches = bracket.stages.flatMap((stage) => stage.matches)

  if (matches.length === 0) {
    return <Card className="border-dashed"><CardContent className="py-14 text-center"><GitBranch className="mx-auto h-10 w-10 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">The bracket is not available yet</p><p className="mt-1 text-xs text-[#958a99]">Matches will appear after the organizer generates the tournament bracket.</p></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      {bracket.stages.map((stage) => (
        <section key={stage.stage} className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-[#d7a5ff]"><GitBranch className="h-4 w-4" /> {formatLabel(stage.stage)}</h2>
          <div className="grid gap-4 lg:grid-cols-2">{stage.matches.map((match) => <BracketMatch key={match.id} match={match} />)}</div>
        </section>
      ))}
    </div>
  )
}

function StandingRow({ item }: { item: CaptainStandingItemDto }) {
  return (
    <tr className={item.team.isCaptainTeam ? 'bg-[#173743]' : undefined}>
      <td className="px-4 py-3 font-black text-[#f5f1f7]">#{item.rank}</td>
      <td className={item.team.isCaptainTeam ? 'px-4 py-3 font-black text-[#71dcff]' : 'px-4 py-3 font-bold text-[#e8e1ea]'}>{item.team.name}{item.team.isCaptainTeam && ' (you)'}</td>
      <td className="px-4 py-3 text-right text-[#d2c8d6]">{item.matchesPlayed}</td>
      <td className="px-4 py-3 text-right text-[#8ff5d8]">{item.wins}</td>
      <td className="px-4 py-3 text-right text-[#ffb9c2]">{item.losses}</td>
      <td className="px-4 py-3 text-right text-[#d2c8d6]">{item.mapDifferential > 0 ? `+${item.mapDifferential}` : item.mapDifferential}</td>
    </tr>
  )
}

function StandingsView({ standings }: { standings: CaptainRegistrationStandingsResponseDto }) {
  if (standings.items.length === 0) {
    return <Card className="border-dashed"><CardContent className="py-14 text-center"><Medal className="mx-auto h-10 w-10 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">No official standings yet</p><p className="mt-1 text-xs text-[#958a99]">Standings appear after confirmed match results are recorded.</p></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader><CardTitle>Official standings</CardTitle><p className="text-sm text-[#a99ead]">Only confirmed completed and forfeit results are included.</p></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-y border-[#343037] bg-[#151316] text-left text-[10px] font-black uppercase tracking-[0.08em] text-[#837987]">
            <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Team</th><th className="px-4 py-3 text-right">Played</th><th className="px-4 py-3 text-right">Wins</th><th className="px-4 py-3 text-right">Losses</th><th className="px-4 py-3 text-right">Map diff.</th></tr>
          </thead>
          <tbody className="divide-y divide-[#343037]">{standings.items.map((item) => <StandingRow key={item.team.id} item={item} />)}</tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export function CaptainTournamentCompetitionPage() {
  const { registrationId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeView = searchParams.get('view') === 'standings' ? 'standings' : 'bracket'
  const bracketQuery = useCaptainRegistrationsControllerGetRegistrationBracket(registrationId, {
    query: { enabled: Boolean(registrationId) && activeView === 'bracket', staleTime: 15_000 },
  })
  const standingsQuery = useCaptainRegistrationsControllerGetRegistrationStandings(registrationId, {
    query: { enabled: Boolean(registrationId) && activeView === 'standings', staleTime: 15_000 },
  })

  const changeView = (view: 'bracket' | 'standings') => {
    setSearchParams({ view })
  }

  const activeQuery = activeView === 'bracket' ? bracketQuery : standingsQuery

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7">
        <Button render={<Link to={`/captain/registrations/${registrationId}/hub`} />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to tournament hub</Button>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]"><ShieldCheck className="h-4 w-4" /> Competition overview</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Bracket & standings</h1>
        <p className="mt-2 text-sm text-[#a99ead]">Follow your team&apos;s tournament path and confirmed competitive results.</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#302b33] pb-3">
        <Button variant={activeView === 'bracket' ? 'default' : 'ghost'} onClick={() => changeView('bracket')}><GitBranch className="h-4 w-4" /> Bracket</Button>
        <Button variant={activeView === 'standings' ? 'default' : 'ghost'} onClick={() => changeView('standings')}><Medal className="h-4 w-4" /> Standings</Button>
      </div>

      {activeQuery.isLoading && <Skeleton className="h-[420px]" />}
      {activeQuery.isError && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>{activeView === 'bracket' ? 'Bracket' : 'Standings'} could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Your tournament data may not be available yet. Refresh and try again.</AlertDescription><Button variant="outline" className="mt-4" onClick={() => void activeQuery.refetch()}>Try again</Button></Alert>}
      {!activeQuery.isLoading && !activeQuery.isError && activeView === 'bracket' && bracketQuery.data && <BracketView bracket={bracketQuery.data} />}
      {!activeQuery.isLoading && !activeQuery.isError && activeView === 'standings' && standingsQuery.data && <StandingsView standings={standingsQuery.data} />}

      <Card className="mt-6 border-dashed">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-[#a99ead]"><Trophy className="h-5 w-5 shrink-0 text-[#d7a5ff]" /> Match details, lobby information, and reporting actions are available from the matches area.</CardContent>
      </Card>
    </div>
  )
}
