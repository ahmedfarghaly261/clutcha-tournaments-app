import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleAlert,
  Clock3,
  Gamepad2,
  GitBranch,
  Globe2,
  ListChecks,
  MapPin,
  Medal,
  ShieldCheck,
  Trophy,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import type { TournamentResponseDto } from '@/api/generated/organizer-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  useOrganizerTournamentDetailsService,
  useOrganizerTournamentParticipantsService,
} from '../services/organizer-tournament-details.service'

type DetailsTab = 'overview' | 'participants'

const statusStyles: Record<string, string> = {
  DRAFT: 'border-[#77687f] bg-[#302a34] text-[#e2d7e7]',
  PUBLISHED: 'border-[#73508f] bg-[#40234f] text-[#e8c4ff]',
  REGISTRATION_OPEN: 'border-[#1d9d7d] bg-[#123d35] text-[#8ff5d8]',
  REGISTRATION_CLOSED: 'border-[#8b742c] bg-[#3e3518] text-[#ffe18a]',
  CHECK_IN_OPEN: 'border-[#25758a] bg-[#173b45] text-[#9ceaff]',
  IN_PROGRESS: 'border-[#a34d67] bg-[#4d2430] text-[#ffc0d0]',
  COMPLETED: 'border-[#446b91] bg-[#243a4f] text-[#b9dcff]',
  POSTPONED: 'border-[#8c672e] bg-[#46351e] text-[#ffd49a]',
  CANCELLED: 'border-[#8b4444] bg-[#482323] text-[#ffb8b2]',
  ARCHIVED: 'border-[#57515a] bg-[#29262b] text-[#aaa1ad]',
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function formatDate(value: string, timezone: string, withTime = true) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
    timeZone: timezone,
  }).format(new Date(value))
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value)
  return `${Number.isFinite(amount) ? amount.toLocaleString() : value} ${currency}`
}

function getPercentage(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function DetailCard({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <span className="text-[#d7a5ff]">{icon}</span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function PrizePoolCard({ tournament }: { tournament: TournamentResponseDto }) {
  const distribution = tournament.prizeDistribution ?? {}
  const prizePool = Number(tournament.prizePool)
  const placements = [
    { label: '1st Place', percentage: getPercentage(distribution.firstPlacePercentage) },
    { label: '2nd Place', percentage: getPercentage(distribution.secondPlacePercentage) },
    { label: '3rd Place', percentage: getPercentage(distribution.thirdPlacePercentage) },
  ].filter((placement) => placement.percentage > 0)

  return (
    <DetailCard title="Prize Pool" icon={<Trophy className="h-5 w-5" />}>
      <p className="text-2xl font-black text-[#d8a5ff]">{formatMoney(tournament.prizePool, tournament.currency)}</p>
      <div className="mt-4 divide-y divide-[#39343c]">
        {placements.length > 0 ? placements.map((placement) => (
          <div className="flex items-center justify-between py-3 text-xs" key={placement.label}>
            <span className="text-[#b9aebd]">{placement.label} ({placement.percentage}%)</span>
            <strong className="text-[#f3edf5]">{formatMoney((prizePool * placement.percentage) / 100, tournament.currency)}</strong>
          </div>
        )) : (
          <p className="py-3 text-xs text-[#8f8494]">No prize distribution configured.</p>
        )}
      </div>
    </DetailCard>
  )
}

function FormatCard({ tournament }: { tournament: TournamentResponseDto }) {
  return (
    <DetailCard title="Format" icon={<GitBranch className="h-5 w-5 text-[#55ddff]" />}>
      <p className="text-lg font-black text-[#f2edf4]">{formatLabel(tournament.format)}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="border border-[#343037] bg-[#242125] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#928696]">Standard</p>
          <p className="mt-2 text-sm font-bold text-[#eee8f1]">Best of {tournament.defaultBestOf}</p>
        </div>
        <div className="border border-[#343037] bg-[#242125] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#928696]">Grand Finals</p>
          <p className="mt-2 text-sm font-bold text-[#eee8f1]">Best of {tournament.finalBestOf}</p>
        </div>
      </div>
    </DetailCard>
  )
}

function TimelineCard({ tournament }: { tournament: TournamentResponseDto }) {
  const events = [
    {
      title: 'Registration Opens',
      value: tournament.registrationOpensAt,
      description: tournament.manualApprovalRequired
        ? 'Teams can submit their rosters for organizer approval.'
        : 'Eligible teams can begin registering for the tournament.',
    },
    {
      title: 'Registration Closes',
      value: tournament.registrationClosesAt,
      description: 'Final registration deadline for competing teams.',
    },
    {
      title: 'Tournament Starts',
      value: tournament.startsAt,
      description: 'Competition begins according to the published match schedule.',
    },
    ...(tournament.endsAt
      ? [{ title: 'Tournament Ends', value: tournament.endsAt, description: 'Scheduled tournament completion.' }]
      : []),
  ]

  return (
    <DetailCard title="Registration Timeline" icon={<Clock3 className="h-5 w-5" />}>
      <ol className="ml-2 border-l border-[#4d4352]">
        {events.map((event, index) => (
          <li className="relative pb-7 pl-7 last:pb-0" key={event.title}>
            <span className={cn('absolute -left-[6px] top-1 h-3 w-3 rounded-full border-2', index === 2 ? 'border-[#d7a5ff] bg-[#d7a5ff]' : 'border-[#67596e] bg-[#1b191c]')} />
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#d6b4ed]">{formatDate(event.value, tournament.timezone)}</p>
            <h3 className="mt-2 text-base font-black text-[#f1ebf3]">{event.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#aaa0af]">{event.description}</p>
          </li>
        ))}
      </ol>
    </DetailCard>
  )
}

function RulesCard({ tournament }: { tournament: TournamentResponseDto }) {
  const rank = tournament.minimumRank || tournament.maximumRank
    ? `${tournament.minimumRank || 'Any'} to ${tournament.maximumRank || 'Any'}`
    : 'No rank restriction'

  const requirements = [
    {
      icon: UserCheck,
      label: 'Team Approval',
      value: tournament.manualApprovalRequired ? 'Organizer approval required.' : 'Eligible teams are approved automatically.',
    },
    { icon: Medal, label: 'Rank Requirement', value: rank },
    { icon: UsersRound, label: 'Age Restriction', value: tournament.minimumPlayerAge ? `Players must be ${tournament.minimumPlayerAge}+ years old.` : 'No age restriction.' },
    { icon: ShieldCheck, label: 'Game Account', value: tournament.requiredGameAccountId ? 'Game account ID is required.' : 'Game account ID is optional.' },
  ]

  return (
    <DetailCard title="Rules & Requirements" icon={<ListChecks className="h-5 w-5 text-[#55ddff]" />}>
      <div className="grid gap-5 sm:grid-cols-2">
        {requirements.map((requirement) => {
          const Icon = requirement.icon
          return (
            <div className="flex gap-3" key={requirement.label}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d9cbe0]" aria-hidden="true" />
              <div>
                <p className="text-xs font-black text-[#eee8f1]">{requirement.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#aaa0af]">{requirement.value}</p>
              </div>
            </div>
          )
        })}
      </div>
      <blockquote className="mt-6 border-l-2 border-[#d7a5ff] bg-[#242125] px-4 py-4 text-sm italic leading-6 text-[#ddd3e1]">
        “{tournament.rules}”
      </blockquote>
    </DetailCard>
  )
}

function StatusCard({ tournament, ready, issues }: { tournament: TournamentResponseDto; ready: boolean; issues: { field: string; message: string }[] }) {
  const ModeIcon = tournament.mode === 'ONLINE' ? Globe2 : MapPin
  const region = tournament.allowedCountries.length > 0
    ? tournament.allowedCountries.join(', ')
    : tournament.allowedRegion || 'Any region'

  return (
    <Card className="lg:sticky lg:top-6">
      <CardContent>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#9b8fa0]">Status</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="text-xl font-black text-[#f2edf4]">{formatLabel(tournament.status)}</h2>
          <CalendarDays className="h-7 w-7 text-[#695c70]" aria-hidden="true" />
        </div>

        <div className="mt-6 space-y-4 border-y border-[#39343c] py-5">
          <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[#b9aebd]"><UsersRound className="h-4 w-4" /> Teams</span><strong>{tournament.minimumTeams}–{tournament.maximumTeams}</strong></div>
          <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[#b9aebd]"><Gamepad2 className="h-4 w-4" /> Roster</span><strong>{tournament.maximumStarters} starters + {tournament.maximumSubstitutes} subs</strong></div>
          <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[#b9aebd]"><ModeIcon className="h-4 w-4" /> Region</span><strong className="text-right">{region}</strong></div>
        </div>

        <div className={cn('mt-5 rounded-md border p-4', ready ? 'border-[#276f5c] bg-[#15382f]' : 'border-[#795f34] bg-[#382c19]')}>
          <div className="flex items-center gap-2">
            {ready ? <BadgeCheck className="h-4 w-4 text-[#8ff5d8]" /> : <CircleAlert className="h-4 w-4 text-[#ffd08b]" />}
            <p className={cn('text-xs font-black uppercase tracking-[0.06em]', ready ? 'text-[#8ff5d8]' : 'text-[#ffd08b]')}>
              {ready ? 'Ready to publish' : `${issues.length} publication issue${issues.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {!ready && (
            <ul className="mt-3 space-y-2 text-[11px] leading-4 text-[#e1c796]">
              {issues.slice(0, 4).map((issue) => <li key={`${issue.field}-${issue.message}`}>• {issue.message}</li>)}
              {issues.length > 4 && <li>• And {issues.length - 4} more</li>}
            </ul>
          )}
        </div>

        <Button render={<Link to="/organizer/tournaments" />} variant="outline" className="mt-5 w-full">
          <ArrowLeft className="h-4 w-4" /> Back to tournaments
        </Button>
      </CardContent>
    </Card>
  )
}

function ParticipantsPanel({ tournamentId }: { tournamentId: string }) {
  const query = useOrganizerTournamentParticipantsService(tournamentId, true)

  if (query.isLoading) {
    return <Card className="animate-pulse"><CardContent><div className="h-36 rounded bg-[#262227]" /></CardContent></Card>
  }

  if (query.isError) {
    return (
      <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
        <AlertTitle>Could not load participants</AlertTitle>
        <AlertDescription className="text-[#ffcbc7]">Please try again after checking the API connection.</AlertDescription>
      </Alert>
    )
  }

  const registrations = query.data?.items ?? []

  if (registrations.length === 0) {
    return (
      <Card className="border-dashed py-10 text-center">
        <CardContent>
          <UsersRound className="mx-auto h-9 w-9 text-[#8f7b98]" />
          <h2 className="mt-4 text-lg font-black text-[#f2edf4]">No teams registered yet</h2>
          <p className="mt-2 text-sm text-[#a99dac]">Registered teams will appear here for organizer review.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {registrations.map((registration) => (
        <Card key={registration.registrationId}>
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-[#f2edf4]">{registration.team.name}</p>
                <p className="mt-1 text-xs text-[#9e929f]">{registration.team.region || 'Region not specified'} · {formatLabel(registration.team.gameKey)}</p>
              </div>
              <span className="rounded-full border border-[#55475d] bg-[#2b2430] px-2.5 py-1 text-[10px] font-black uppercase text-[#d7a5ff]">{formatLabel(registration.approvalStatus)}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#39343c] pt-4 text-xs">
              <div><p className="text-[#887d8c]">Registration</p><p className="mt-1 font-bold text-[#ded6e1]">{formatLabel(registration.status)}</p></div>
              <div><p className="text-[#887d8c]">Payment</p><p className="mt-1 font-bold text-[#ded6e1]">{formatLabel(registration.paymentStatus)}</p></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function OrganizerTournamentDetailsPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview')
  const detailsQuery = useOrganizerTournamentDetailsService(tournamentId)

  if (detailsQuery.isLoading) {
    return <div className="mx-auto h-[70vh] max-w-7xl animate-pulse rounded-xl bg-[#1b191c]" />
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
          <AlertTitle>Tournament could not be loaded</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-4 text-[#ffcbc7]">
            <span>It may not exist, or it may belong to another organizer.</span>
            <Button render={<Link to="/organizer/tournaments" />} variant="outline"><ArrowLeft className="h-4 w-4" /> Back to tournaments</Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { tournament, publicationReadiness } = detailsQuery.data
  const ModeIcon = tournament.mode === 'ONLINE' ? Globe2 : MapPin

  return (
    <div className="mx-auto max-w-7xl pb-8">
      <section className="relative min-h-[360px] overflow-hidden rounded-xl border border-[#302b33] bg-[#131114]">
        {tournament.coverUrl ? (
          <img className="absolute inset-0 h-full w-full object-cover opacity-40" src={tournament.coverUrl} alt="" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(190,102,255,0.25),transparent_38%),linear-gradient(135deg,#1c1720,#0f0e10)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131114] via-[#131114]/65 to-black/15" />
        <div className="relative flex min-h-[360px] flex-col justify-end p-6 sm:p-8">
          <Link className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/70" to="/organizer/tournaments">
            <ArrowLeft className="h-4 w-4" /> All tournaments
          </Link>
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]', statusStyles[tournament.status] ?? statusStyles.ARCHIVED)}>{formatLabel(tournament.status)}</span>
            <span className="flex items-center gap-2 rounded-full border border-white/15 bg-[#302d32]/85 px-3 py-1 text-[10px] font-black uppercase text-white"><Gamepad2 className="h-3 w-3" /> {formatLabel(tournament.gameKey)}</span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">{tournament.name}</h1>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#ddd4e1]">
            <span className="flex items-center gap-2"><Banknote className="h-5 w-5 text-[#d7a5ff]" /> <strong>{formatMoney(tournament.prizePool, tournament.currency)}</strong></span>
            <span className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#d7a5ff]" /> Starts {formatDate(tournament.startsAt, tournament.timezone, false)}</span>
            <span className="flex items-center gap-2"><ModeIcon className="h-5 w-5 text-[#d7a5ff]" /> {formatLabel(tournament.mode)} ({tournament.allowedRegion || 'Global'})</span>
          </div>
        </div>
      </section>

      <nav className="mt-5 flex gap-6 border-b border-[#302b33]" aria-label="Tournament details">
        <Button variant="ghost" className={cn('h-auto rounded-none border-b-2 px-0 py-4 text-xs font-black uppercase tracking-[0.06em] hover:bg-transparent', activeTab === 'overview' ? 'border-[#d7a5ff] text-[#e1baff]' : 'border-transparent text-[#b2a7b7] hover:text-white')} type="button" onClick={() => setActiveTab('overview')}>Overview</Button>
        <Button variant="ghost" className={cn('h-auto rounded-none border-b-2 px-0 py-4 text-xs font-black uppercase tracking-[0.06em] hover:bg-transparent', activeTab === 'participants' ? 'border-[#d7a5ff] text-[#e1baff]' : 'border-transparent text-[#b2a7b7] hover:text-white')} type="button" onClick={() => setActiveTab('participants')}>Participants</Button>
        <Button variant="ghost" className="h-auto cursor-not-allowed rounded-none border-b-2 border-transparent px-0 py-4 text-xs font-black uppercase tracking-[0.06em] text-[#5f5763]" type="button" disabled title="Organizer bracket view is not available in the API yet">Bracket</Button>
        <Button variant="ghost" className="h-auto cursor-not-allowed rounded-none border-b-2 border-transparent px-0 py-4 text-xs font-black uppercase tracking-[0.06em] text-[#5f5763]" type="button" disabled title="Organizer match view is not available in the API yet">Matches</Button>
      </nav>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2"><PrizePoolCard tournament={tournament} /><FormatCard tournament={tournament} /></div>
              <TimelineCard tournament={tournament} />
              <RulesCard tournament={tournament} />
            </div>
          ) : (
            <ParticipantsPanel tournamentId={tournament.id} />
          )}
        </main>
        <aside>
          <StatusCard tournament={tournament} ready={publicationReadiness.ready} issues={publicationReadiness.issues} />
        </aside>
      </div>
    </div>
  )
}
