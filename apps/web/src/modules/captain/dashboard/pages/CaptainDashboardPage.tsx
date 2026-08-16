import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CircleCheckBig,
  CircleUserRound,
  Gamepad2,
  ListChecks,
  Search,
  Shield,
  ShieldAlert,
  Swords,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { CaptainDashboardResponseDtoRequiredActionsItem } from '@/api/generated/captain'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCaptainDashboardService } from '../services/captain-dashboard.service'
import type {
  CaptainDashboardAction,
  CaptainDashboardTeam,
} from '../types/captain-dashboard.types'

type ActionDefinition = {
  title: string
  description: string
  to: string
  icon: LucideIcon
}

const actionDefinitions: Record<CaptainDashboardAction, ActionDefinition> = {
  COMPLETE_PROFILE: {
    title: 'Complete captain profile',
    description: 'Add the required contact information before entering tournaments.',
    to: '/captain/profile',
    icon: CircleUserRound,
  },
  CREATE_TEAM: {
    title: 'Create your team',
    description: 'Set up the team that you will register in CLUTCHA tournaments.',
    to: '/captain/team',
    icon: Shield,
  },
  ADD_ROSTER_PLAYERS: {
    title: 'Build your roster',
    description: 'Add starters and substitutes so tournament eligibility can be checked.',
    to: '/captain/roster',
    icon: UserPlus,
  },
  COMPLETE_PAYMENT: {
    title: 'Complete tournament payment',
    description: 'Open the registration to review its payment instructions.',
    to: '/captain/registrations',
    icon: ListChecks,
  },
  WAIT_FOR_APPROVAL: {
    title: 'Organizer approval pending',
    description: 'Your submitted team is waiting for the organizer decision.',
    to: '/captain/registrations',
    icon: ListChecks,
  },
  CHECK_IN: {
    title: 'Tournament check-in available',
    description: 'Open your registration and complete team check-in.',
    to: '/captain/registrations',
    icon: ListChecks,
  },
  OPEN_TOURNAMENT_HUB: {
    title: 'Open tournament hub',
    description: 'Review tournament progress, bracket, standings, and information.',
    to: '/captain/registrations',
    icon: Gamepad2,
  },
  VIEW_MATCH: {
    title: 'Upcoming match ready',
    description: 'Review the match schedule and assigned lobby or station.',
    to: '/captain/matches',
    icon: Swords,
  },
  NONE: {
    title: 'Workspace ready',
    description: 'Your captain workspace has no required setup actions.',
    to: '/captain',
    icon: CircleCheckBig,
  },
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent,
}: {
  label: string
  value: number | string
  description: string
  icon: LucideIcon
  accent: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative">
        <span className={cn('absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="pr-12 text-[10px] font-black uppercase tracking-[0.09em] text-[#929dac]">{label}</p>
        <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#f4f7fb]">{value}</p>
        <p className="mt-2 text-xs leading-5 text-[#929eae]">{description}</p>
      </CardContent>
    </Card>
  )
}

function TeamOverview({ team }: { team: CaptainDashboardTeam }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 border-b border-[#303641] bg-[radial-gradient(circle_at_top_right,rgba(89,211,251,0.25),transparent_50%),linear-gradient(135deg,#1d2630,#101319)]">
        {team.coverUrl && <img className="absolute inset-0 h-full w-full object-cover opacity-60" src={team.coverUrl} alt="" />}
        <div className="absolute inset-x-5 bottom-4 flex items-end gap-3">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#718096] bg-[#10141a] shadow-xl">
            {team.logoUrl ? <img className="h-full w-full object-cover" src={team.logoUrl} alt="" /> : <Shield className="h-7 w-7 text-[#71dcff]" />}
          </span>
          <div className="min-w-0 pb-1">
            <h2 className="truncate text-xl font-black text-white">{team.name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#bcecff]">{team.gameKey}</p>
          </div>
        </div>
      </div>
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.07em]">
          <span className="rounded-full border border-[#326b7d] bg-[#173743] px-2.5 py-1 text-[#a8efff]">{team.status}</span>
          <span className="rounded-full border border-[#3d4653] bg-[#22272f] px-2.5 py-1 text-[#c6d0df]">{team.region ?? 'Region not set'}</span>
        </div>
        <Button render={<Link to="/captain/team" />} variant="outline" size="sm">Manage team <ArrowRight className="h-4 w-4" /></Button>
      </CardContent>
    </Card>
  )
}

export function CaptainDashboardPage() {
  const dashboardQuery = useCaptainDashboardService()

  if (dashboardQuery.isLoading) {
    return <div className="h-[70vh] animate-pulse rounded-xl bg-[#171a20]" />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle>Captain dashboard could not be loaded</AlertTitle>
        <AlertDescription className="text-[#ffcbc7]">Check the API connection and sign in again if necessary.</AlertDescription>
      </Alert>
    )
  }

  const dashboard = dashboardQuery.data
  const roster = dashboard.roster
  const requiredActions = dashboard.requiredActions.filter(
    (action) => action !== CaptainDashboardResponseDtoRequiredActionsItem.NONE,
  )

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]">Captain command center</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f3f7fc]">Welcome back, {dashboard.profile.displayName}</h1>
          <p className="mt-2 text-sm text-[#a8b3c3]">Prepare your team, complete required actions, and enter tournaments.</p>
        </div>
        <Button render={<Link to="/captain/tournaments" />} size="lg"><Search className="h-4 w-4" /> Find tournaments</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile" value={dashboard.profile.profileComplete ? 'Ready' : 'Incomplete'} description="Captain contact and account readiness" icon={CircleUserRound} accent={dashboard.profile.profileComplete ? 'bg-[#15382f] text-[#8ff5d8]' : 'bg-[#3b2f1d] text-[#ffd08b]'} />
        <MetricCard label="Team" value={dashboard.team ? 'Active' : 'Missing'} description="Competitive team workspace" icon={Shield} accent={dashboard.team ? 'bg-[#173743] text-[#a8efff]' : 'bg-[#3b2529] text-[#ffb9c2]'} />
        <MetricCard label="Roster players" value={roster?.totalCount ?? 0} description="Starters and substitutes combined" icon={UsersRound} accent="bg-[#292540] text-[#d2c5ff]" />
        <MetricCard label="Starters" value={roster?.starterCount ?? 0} description={`${roster?.substituteCount ?? 0} substitute players`} icon={Gamepad2} accent="bg-[#253125] text-[#b8efb3]" />
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {dashboard.team ? (
            <TeamOverview team={dashboard.team} />
          ) : (
            <Card className="border-dashed border-[#3d5865]">
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <Shield className="h-11 w-11 text-[#4f7180]" />
                <h2 className="mt-4 text-xl font-black text-[#edf4fa]">Create your competitive team</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#9daabb]">A team and roster are required before you can register for tournaments.</p>
                <Button render={<Link to="/captain/team" />} className="mt-5"><Shield className="h-4 w-4" /> Create team</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="justify-between">
              <div><CardTitle>Roster readiness</CardTitle><p className="mt-1 text-xs text-[#909baa]">Current team composition reported by the Captain API</p></div>
              <Button render={<Link to="/captain/roster" />} variant="ghost" size="sm">Manage roster <ArrowRight className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {roster ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['Total players', roster.totalCount],
                    ['Starters', roster.starterCount],
                    ['Substitutes', roster.substituteCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#303641] bg-[#12151a] p-4 text-center">
                      <p className="text-2xl font-black text-[#f1f5fa]">{value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#8995a5]">{label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-[#303641] bg-[#12151a] p-6 text-center text-sm text-[#98a5b5]">Create a team before building its roster.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader><ListChecks className="h-5 w-5 text-[#71dcff]" /><CardTitle>Required actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {requiredActions.length > 0 ? requiredActions.map((action) => {
                const definition = actionDefinitions[action]
                const Icon = definition.icon
                return (
                  <Link key={action} to={definition.to} className="group block rounded-lg border border-[#343b46] bg-[#14171c] p-4 transition hover:border-[#4d879b] hover:bg-[#182229]">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#20343c] text-[#8de5ff]"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0"><p className="text-sm font-black text-[#edf3f9]">{definition.title}</p><p className="mt-1 text-xs leading-5 text-[#929eae]">{definition.description}</p></div>
                    </div>
                  </Link>
                )
              }) : (
                <div className="rounded-lg border border-[#2c5f52] bg-[#15342c] p-4 text-[#a5f0d9]">
                  <div className="flex items-center gap-2 text-sm font-black"><CircleCheckBig className="h-5 w-5" /> Workspace ready</div>
                  <p className="mt-2 text-xs leading-5 text-[#9cd8c7]">No setup actions are currently required.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Swords className="h-5 w-5 text-[#cabdff]" /><CardTitle>Tournament activity</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[#98a4b4]">Tournament registrations and upcoming matches will appear here after your team enters a tournament.</p>
              <Button render={<Link to="/captain/registrations" />} variant="outline" className="mt-4 w-full justify-between">View registrations <ArrowRight className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
