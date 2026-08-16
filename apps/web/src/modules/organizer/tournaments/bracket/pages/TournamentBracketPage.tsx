import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleCheckBig,
  GitBranch,
  Shuffle,
  Swords,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TournamentManagementNav } from '../../manage/components/TournamentManagementNav'
import { useTournamentBracketMutations } from '../mutations/tournament-bracket.mutations'
import { useTournamentBracketService } from '../services/tournament-bracket.service'
import { bracketGenerationStatuses } from '../types/tournament-bracket.types'
import type { TournamentBracketMatch } from '../types/tournament-bracket.types'

function getErrorMessage(error: unknown) {
  if (!isAxiosError(error)) return 'The bracket could not be generated.'
  const data: unknown = error.response?.data
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return 'The bracket could not be generated.'
}

function TeamSlot({
  team,
  score,
  winner,
}: {
  team: TournamentBracketMatch['teamA']
  score: number | null | undefined
  winner: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-11 items-center gap-2 border-b border-[#39343c] px-3 last:border-b-0',
        winner && 'bg-[#17382f] text-[#9bf0d7]',
      )}
    >
      {team?.logoUrl ? (
        <img className="h-6 w-6 rounded object-cover" src={team.logoUrl} alt="" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[#2d2731] text-[9px] font-black text-[#cdbdd4]">
          {team?.name.slice(0, 1).toUpperCase() ?? '—'}
        </span>
      )}
      <span className={cn('min-w-0 flex-1 truncate text-xs font-bold', !team && 'text-[#756c79]')}>
        {team?.name ?? 'TBD / Bye'}
      </span>
      {score !== null && score !== undefined && (
        <span className="font-mono text-sm font-black">{score}</span>
      )}
    </div>
  )
}

function BracketMatch({ match }: { match: TournamentBracketMatch }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#433c47] bg-[#1a181b] shadow-[0_10px_25px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-[#39343c] bg-[#242126] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#a99ead]">
        <span>{match.stage === 'THIRD_PLACE' ? 'Third place' : match.bracketPosition}</span>
        <span>Best of {match.bestOf}</span>
      </div>
      <TeamSlot
        team={match.teamA}
        score={match.teamAScore}
        winner={Boolean(match.teamA && match.winnerTeamId === match.teamA.id)}
      />
      <TeamSlot
        team={match.teamB}
        score={match.teamBScore}
        winner={Boolean(match.teamB && match.winnerTeamId === match.teamB.id)}
      />
    </div>
  )
}

export function TournamentBracketPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const bracketQuery = useTournamentBracketService(tournamentId)
  const mutations = useTournamentBracketMutations(tournamentId)
  const [orderedTeamIds, setOrderedTeamIds] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const approvedTeamIds = useMemo(
    () => bracketQuery.data?.approvedTeams.map((team) => team.id) ?? [],
    [bracketQuery.data?.approvedTeams],
  )
  const displayedTeamIds = orderedTeamIds.length > 0 ? orderedTeamIds : approvedTeamIds

  const teamsById = useMemo(
    () => new Map(bracketQuery.data?.approvedTeams.map((team) => [team.id, team]) ?? []),
    [bracketQuery.data?.approvedTeams],
  )

  const moveTeam = (index: number, direction: -1 | 1) => {
    setOrderedTeamIds(() => {
      const current = displayedTeamIds
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  const generateBracket = async () => {
    setMessage(null)
    setError(null)
    try {
      await mutations.generateBracket({
        tournamentId,
        data: { orderedTeamIds: displayedTeamIds },
      })
      setMessage('The single-elimination bracket was generated successfully.')
    } catch (generationError) {
      setError(getErrorMessage(generationError))
    }
  }

  if (bracketQuery.isLoading) {
    return <div className="mx-auto h-[70vh] max-w-6xl animate-pulse rounded-xl bg-[#1b191c]" />
  }

  if (bracketQuery.isError || !bracketQuery.data) {
    return (
      <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
        <AlertTitle>Tournament bracket could not be loaded</AlertTitle>
        <AlertDescription className="text-[#ffcbc7]">
          The tournament may not exist or may belong to another organizer.
        </AlertDescription>
      </Alert>
    )
  }

  const bracket = bracketQuery.data
  const canGenerate =
    bracket.tournament.format === 'SINGLE_ELIMINATION' &&
    bracketGenerationStatuses.some((status) => status === bracket.tournament.status) &&
    bracket.approvedTeams.length >= 2

  return (
    <div className="mx-auto max-w-[1400px] pb-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Button
            render={<Link to={`/organizer/tournaments/${bracket.tournament.id}`} />}
            variant="link"
            className="mb-2 h-auto px-0 text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to tournament
          </Button>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">
            Tournament management
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">
            Bracket & Seeding
          </h1>
          <p className="mt-2 text-sm text-[#a99ead]">{bracket.tournament.name}</p>
        </div>
        <span className="rounded-full border border-[#62586a] bg-[#302a34] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e2d7e7]">
          {bracket.generated ? `${bracket.bracketSize}-slot bracket` : 'Not generated'}
        </span>
      </header>

      <TournamentManagementNav tournamentId={bracket.tournament.id} active="bracket" />

      {message && (
        <Alert className="mb-6 border-[#276f5c] bg-[#15382f] text-[#8ff5d8]">
          <CircleCheckBig className="h-5 w-5" />
          <AlertTitle>Bracket generated</AlertTitle>
          <AlertDescription className="text-[#a7ead7]">{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="mb-6 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
          <TriangleAlert className="h-5 w-5" />
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription>
        </Alert>
      )}

      {!bracket.generated ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <UsersRound className="h-5 w-5 text-[#d7a5ff]" />
              <CardTitle>Approved teams and seed order</CardTitle>
            </CardHeader>
            <CardContent>
              {displayedTeamIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#4a424e] p-8 text-center text-sm text-[#958a99]">
                  No approved teams are available yet.
                </div>
              ) : (
                <ol className="space-y-2">
                  {displayedTeamIds.map((teamId, index) => {
                    const team = teamsById.get(teamId)
                    return (
                      <li
                        key={teamId}
                        className="flex items-center gap-3 rounded-lg border border-[#3e3841] bg-[#171518] p-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#30233a] text-xs font-black text-[#ddb7ff]">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#eee8f0]">
                          {team?.name ?? teamId}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={index === 0}
                          aria-label={`Move ${team?.name ?? 'team'} up`}
                          onClick={() => moveTeam(index, -1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={index === displayedTeamIds.length - 1}
                          aria-label={`Move ${team?.name ?? 'team'} down`}
                          onClick={() => moveTeam(index, 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              {bracket.tournament.seedingMethod === 'RANDOM' ? (
                <Shuffle className="h-5 w-5 text-[#64d9f3]" />
              ) : (
                <GitBranch className="h-5 w-5 text-[#d7a5ff]" />
              )}
              <CardTitle>Generate bracket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-[#39343c] bg-[#151316] p-3">
                  <p className="text-xl font-black text-[#f0eaf2]">{bracket.teamCount}</p>
                  <p className="text-[10px] font-bold uppercase text-[#8f8494]">Approved teams</p>
                </div>
                <div className="rounded-lg border border-[#39343c] bg-[#151316] p-3">
                  <p className="text-xl font-black text-[#f0eaf2]">{bracket.bracketSize || '—'}</p>
                  <p className="text-[10px] font-bold uppercase text-[#8f8494]">Bracket slots</p>
                </div>
              </div>
              <p className="text-xs leading-5 text-[#a99ead]">
                Seeding method: <strong className="text-[#e7dce9]">{bracket.tournament.seedingMethod}</strong>.
                {bracket.tournament.seedingMethod === 'RANDOM'
                  ? ' The API will randomize the approved teams when generated.'
                  : ' Arrange the teams above in seed order before generating.'}
              </p>
              {!canGenerate && (
                <Alert className="border-[#6b5630] bg-[#382c19] text-[#ffd08b]">
                  <AlertTitle>Bracket is not ready</AlertTitle>
                  <AlertDescription className="text-[#e7ca96]">
                    Use single elimination, approve at least two teams, and close registration first.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full"
                disabled={!canGenerate || mutations.isGenerating}
                onClick={() => void generateBracket()}
              >
                <Swords className="h-4 w-4" />
                {mutations.isGenerating ? 'Generating...' : 'Generate bracket'}
              </Button>
              <p className="text-center text-[10px] leading-4 text-[#7f7583]">
                Generation is one-time. Match scheduling and results will be handled in later sprints.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <GitBranch className="h-5 w-5 text-[#d7a5ff]" />
            <CardTitle>Single-elimination bracket</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-6">
            <div className="flex min-w-max items-stretch gap-6">
              {bracket.rounds.map((round) => (
                <section key={round.round} className="flex w-64 flex-col">
                  <div className="mb-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#d7a5ff]">
                      {round.label}
                    </p>
                    <p className="mt-1 text-[10px] text-[#807685]">Round {round.round}</p>
                  </div>
                  <div className="flex flex-1 flex-col justify-around gap-5">
                    {round.matches.map((match) => (
                      <BracketMatch key={match.id} match={match} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
