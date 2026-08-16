import { Link } from 'react-router-dom'
import { CalendarDays, GitBranch, ShieldCheck, Trophy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBracketTournamentListService } from '../services/tournament-bracket.service'

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export function OrganizerMatchmakingPage() {
  const tournamentsQuery = useBracketTournamentListService()

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">
          Tournament operations
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">
          Matchmaking & Brackets
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99ead]">
          Choose a tournament to seed approved teams and operate its competitive bracket.
        </p>
      </header>

      {tournamentsQuery.isLoading && (
        <div className="h-72 animate-pulse rounded-xl border border-[#39343c] bg-[#1b191c]" />
      )}

      {tournamentsQuery.isError && (
        <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
          <AlertTitle>Tournaments could not be loaded</AlertTitle>
          <AlertDescription className="text-[#ffcbc7]">
            Refresh the page and try again.
          </AlertDescription>
        </Alert>
      )}

      {tournamentsQuery.data?.items.length === 0 && (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <Trophy className="mb-4 h-10 w-10 text-[#8f8196]" />
            <h2 className="text-lg font-black text-[#eee8f0]">No tournaments yet</h2>
            <p className="mt-2 text-sm text-[#9e929f]">
              Create a tournament before building its bracket.
            </p>
            <Button render={<Link to="/organizer/tournaments/new" />} className="mt-5">
              Create tournament
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tournamentsQuery.data?.items.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="h-24 border-b border-[#39343c] bg-[radial-gradient(circle_at_top_right,rgba(183,91,246,0.3),transparent_55%),#151316]">
              {tournament.coverUrl && (
                <img className="h-full w-full object-cover opacity-60" src={tournament.coverUrl} alt="" />
              )}
            </div>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#54495a] bg-[#2a252d] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#d8cedc]">
                  {formatLabel(tournament.status)}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#8f8494]">
                  {formatLabel(tournament.format)}
                </span>
              </div>
              <h2 className="truncate text-lg font-black text-[#f3edf5]">{tournament.name}</h2>
              <div className="mt-4 space-y-2 text-xs text-[#a99ead]">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#d7a5ff]" />
                  {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                    new Date(tournament.startsAt),
                  )}
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#69e0c1]" />
                  {formatLabel(tournament.seedingMethod)} seeding
                </p>
              </div>
              <Button
                render={
                  <Link to={`/organizer/tournaments/${tournament.id}/manage/bracket`} />
                }
                className="mt-5 w-full"
              >
                <GitBranch className="h-4 w-4" /> Manage bracket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
