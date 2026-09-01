import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarDays, CreditCard, Gamepad2, Trophy } from 'lucide-react'
import {
  CaptainRegistrationsControllerListRegistrationsSortBy,
  CaptainRegistrationsControllerListRegistrationsSortDirection,
  CaptainRegistrationsControllerListRegistrationsStatus,
} from '@/api/generated/captain-registrations'
import { useCaptainRegistrationsControllerListRegistrations } from '@/api/generated/captain-registrations/captain-registrations'
import type { CaptainRegistrationListItemDto } from '@/api/generated/captain-registrations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMoney(amount: string, currency: string) {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) return 'Free'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric)
}

function RegisteredTournamentCard({ registration }: { registration: CaptainRegistrationListItemDto }) {
  const tournament = registration.tournament

  return (
    <Card>
      <CardHeader className="items-start justify-between gap-4 sm:flex-row">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#3c3540] bg-[#17151a]">
            {tournament.logoUrl ? <img src={tournament.logoUrl} alt="" className="h-full w-full rounded-md object-cover" /> : <Trophy className="h-5 w-5 text-[#71dcff]" />}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{tournament.name}</CardTitle>
            <p className="mt-1 text-xs font-bold text-[#9f94a4]">{formatLabel(tournament.gameKey)} - {formatLabel(tournament.mode)}</p>
          </div>
        </div>
        <span className="rounded-full border border-[#276f5c] bg-[#15382f] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#8ff5d8]">
          Approved
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Info icon={CalendarDays} label="Starts" value={formatDate(tournament.startsAt)} />
          <Info icon={Gamepad2} label="Tournament status" value={formatLabel(tournament.status)} />
          <Info icon={CreditCard} label="Payment" value={formatLabel(registration.paymentStatus)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#343037] pt-4">
          <p className="text-xs text-[#9f94a4]">Entry fee <span className="font-bold text-[#e8e1ea]">{formatMoney(tournament.registrationFee, tournament.currency)}</span></p>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link to={`/captain/tournaments/${tournament.slug}`} />} variant="secondary" size="sm">Tournament details</Button>
            <Button render={<Link to={`/captain/registrations/${registration.registrationId}/hub`} />} size="sm">Open hub</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#343037] bg-[#151316] p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#837987]"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-2 text-sm font-bold text-[#e8e1ea]">{value}</p>
    </div>
  )
}

export function CaptainRegisteredTournamentsPage() {
  const query = useCaptainRegistrationsControllerListRegistrations({
    limit: 100,
    status: CaptainRegistrationsControllerListRegistrationsStatus.CONFIRMED,
    sortBy: CaptainRegistrationsControllerListRegistrationsSortBy.tournamentStartsAt,
    sortDirection: CaptainRegistrationsControllerListRegistrationsSortDirection.asc,
  }, {
    query: { staleTime: 20_000 },
  })

  const registrations = query.data?.items ?? []

  if (query.isLoading) return <div className="mx-auto h-[70vh] max-w-6xl animate-pulse rounded-xl bg-[#1b191c]" />
  if (query.isError) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Registered tournaments could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-7">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]"><BadgeCheck className="h-4 w-4" /> Captain Workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Registered tournaments</h1>
        <p className="mt-2 text-sm text-[#a99ead]">Tournaments where your team has been approved by the organizer.</p>
      </header>

      <div className="space-y-4">
        {registrations.map((registration) => <RegisteredTournamentCard key={registration.registrationId} registration={registration} />)}
        {registrations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center">
              <Trophy className="mx-auto h-10 w-10 text-[#756a79]" />
              <p className="mt-3 text-sm font-bold text-[#c6bdc9]">No approved tournaments yet</p>
              <p className="mt-1 text-xs text-[#958a99]">Approved tournaments appear here after an organizer accepts your team.</p>
              <Button render={<Link to="/captain/tournaments" />} className="mt-5">Find tournaments</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

