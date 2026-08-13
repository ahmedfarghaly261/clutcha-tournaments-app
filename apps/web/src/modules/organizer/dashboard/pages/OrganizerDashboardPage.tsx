import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleCheckBig,
  CircleDot,
  FilePenLine,
  Gamepad2,
  Globe2,
  MapPin,
  Plus,
  Radio,
  Trophy,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useOrganizerDashboardService } from '../services/organizer-dashboard.service'
import type { OrganizerDashboardRecentTournament } from '../types/organizer-dashboard.types'

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
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function formatDate(value: string) {
  if (!value) return 'Date not set'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function MetricCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string
  value: number
  description: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative">
        <div className={cn('absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg', accent)}>{icon}</div>
        <p className="pr-12 text-[10px] font-black uppercase tracking-[0.09em] text-[#978c9c]">{label}</p>
        <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#f5f0f7]">{value}</p>
        <p className="mt-2 text-xs leading-5 text-[#948999]">{description}</p>
      </CardContent>
    </Card>
  )
}

function RecentTournamentCard({
  tournament,
}: {
  tournament: OrganizerDashboardRecentTournament
}) {
  const ModeIcon = tournament.mode === 'ONLINE' ? Globe2 : MapPin
  return (
    <Link
      to={`/organizer/tournaments/${tournament.id}`}
      className="group grid overflow-hidden rounded-xl border border-[#39343c] bg-[#1b191c] transition hover:border-[#6c5777] sm:grid-cols-[150px_minmax(0,1fr)_auto]"
    >
      <div className="relative min-h-28 bg-[radial-gradient(circle_at_top_right,rgba(183,91,246,0.34),transparent_45%),linear-gradient(135deg,#211a25,#111013)]">
        {tournament.coverUrl ? <img src={tournament.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Trophy className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-[#765f80]" />}
      </div>
      <div className="min-w-0 p-4">
        <div className="flex flex-wrap items-center gap-2"><span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em]', statusStyles[tournament.status] ?? 'border-[#4c444f] bg-[#29252b] text-[#c7bdca]')}>{formatLabel(tournament.status)}</span><span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#9e929f]"><ModeIcon className="h-3 w-3" /> {formatLabel(tournament.mode)}</span></div>
        <h3 className="mt-3 truncate text-base font-black text-[#f2edf4]">{tournament.name}</h3>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9d929f]"><span className="flex items-center gap-1.5"><Gamepad2 className="h-3.5 w-3.5 text-[#d7a5ff]" /> {formatLabel(tournament.gameKey)}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#55ddff]" /> {formatDate(tournament.startsAt)}</span></div>
      </div>
      <div className="hidden items-center px-5 text-[#8d7a94] transition group-hover:text-[#d7a5ff] sm:flex"><ArrowRight className="h-5 w-5" /></div>
    </Link>
  )
}

export function OrganizerDashboardPage() {
  const { user } = useAuth()
  const dashboardQuery = useOrganizerDashboardService()

  if (dashboardQuery.isLoading) return <div className="h-[70vh] animate-pulse rounded-xl bg-[#1b191c]" />
  if (dashboardQuery.isError || !dashboardQuery.data) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Dashboard could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Check the API connection and try again.</AlertDescription></Alert>

  const { summary, recentTournaments } = dashboardQuery.data
  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Organizer command center</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Welcome back, {user?.displayName || 'Organizer'}</h1><p className="mt-2 text-sm text-[#a99ead]">Monitor your tournament portfolio and jump back into recent work.</p></div>
        <Button render={<Link to="/organizer/tournaments/new" />} size="lg"><Plus className="h-4 w-4" /> New tournament</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total tournaments" value={summary.totalTournaments} description="All tournaments in your workspace" icon={<Trophy className="h-5 w-5" />} accent="bg-[#35283d] text-[#d7a5ff]" />
        <MetricCard label="Drafts" value={summary.draftTournaments} description="Tournaments still being configured" icon={<FilePenLine className="h-5 w-5" />} accent="bg-[#302a34] text-[#ded2e2]" />
        <MetricCard label="Registration open" value={summary.registrationOpenTournaments} description="Currently accepting team submissions" icon={<Radio className="h-5 w-5" />} accent="bg-[#15382f] text-[#8ff5d8]" />
        <MetricCard label="Live" value={summary.liveTournaments} description="Tournaments currently in progress" icon={<Activity className="h-5 w-5" />} accent="bg-[#4d2430] text-[#ffc0d0]" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Card>
          <CardHeader className="justify-between"><div><CardTitle>Recently updated</CardTitle><p className="mt-1 text-xs text-[#918697]">Your five latest tournament workspaces</p></div><Button render={<Link to="/organizer/tournaments" />} variant="ghost" size="sm">View all <ArrowRight className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">{recentTournaments.length > 0 ? recentTournaments.map((tournament) => <RecentTournamentCard key={tournament.id} tournament={tournament} />) : <div className="flex min-h-64 flex-col items-center justify-center text-center"><Trophy className="h-10 w-10 text-[#66596c]" /><h2 className="mt-4 font-black text-[#eee8f0]">No tournaments yet</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#958a99]">Create your first tournament draft to start building your organizer workspace.</p><Button render={<Link to="/organizer/tournaments/new" />} className="mt-5"><Plus className="h-4 w-4" /> Create tournament</Button></div>}</CardContent>
        </Card>

        <aside className="space-y-6">
          <Card><CardHeader><CircleDot className="h-5 w-5 text-[#55ddff]" /><CardTitle>Portfolio status</CardTitle></CardHeader><CardContent className="space-y-4"><StatusRow label="Published" value={summary.publishedTournaments} /><StatusRow label="Upcoming" value={summary.upcomingTournaments} /><StatusRow label="Completed" value={summary.completedTournaments} /><StatusRow label="Cancelled" value={summary.cancelledTournaments} /></CardContent></Card>
          <Card><CardHeader><CircleCheckBig className="h-5 w-5 text-[#8ff5d8]" /><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="space-y-2"><Button render={<Link to="/organizer/tournaments" />} variant="outline" className="w-full justify-between">Manage tournaments <ArrowRight className="h-4 w-4" /></Button><Button render={<Link to="/organizer/profile" />} variant="outline" className="w-full justify-between">Organizer profile <ArrowRight className="h-4 w-4" /></Button></CardContent></Card>
        </aside>
      </section>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between border-b border-[#39343c] pb-4 last:border-0 last:pb-0"><span className="text-sm text-[#aaa0ae]">{label}</span><strong className="text-lg text-[#f0eaf2]">{value}</strong></div>
}
