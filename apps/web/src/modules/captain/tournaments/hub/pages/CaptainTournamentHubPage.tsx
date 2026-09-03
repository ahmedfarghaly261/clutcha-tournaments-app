import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, CircleAlert, Gamepad2, MapPin, Radio, ShieldCheck, Trophy, UsersRound } from 'lucide-react'
import { useCaptainRegistrationsControllerGetRegistrationHub } from '@/api/generated/captain-registrations/captain-registrations'
import type { CaptainRegistrationHubResponseDto } from '@/api/generated/captain-registrations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function summaryValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stringValue(record[key])
    if (value) return value
  }
  return null
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{value}</p></div>
}

function ActionCard({ action }: { action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#3f3542] bg-[#17151a] p-3">
      <div className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 text-[#ffd08b]" />
        <p className="text-sm font-bold text-[#f1ebf3]">{formatLabel(action)}</p>
      </div>
    </div>
  )
}

function JsonSummary({ item }: { item: Record<string, unknown> }) {
  const title = summaryValue(item, ['title', 'name', 'label', 'round', 'stage']) ?? 'Item'
  const description = summaryValue(item, ['description', 'message', 'status', 'startsAt', 'scheduledAt'])
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-sm font-bold text-[#e8e1ea]">{title}</p>{description && <p className="mt-1 text-xs leading-5 text-[#9f94a4]">{description}</p>}</div>
}

function PrivateInformation({ hub }: { hub: CaptainRegistrationHubResponseDto }) {
  if (!hub.privateInformationAvailable) {
    return <p className="text-sm text-[#9f94a4]">Private tournament information is not available yet.</p>
  }

  if (hub.onlinePrivateInfo) {
    const info = hub.onlinePrivateInfo
    return (
      <div className="space-y-3">
        <Info label="Server region" value={info.serverRegion} />
        {info.discordServerUrl && <Info label="Discord server" value={info.discordServerUrl} />}
        {info.captainSupportChannel && <Info label="Captain support" value={info.captainSupportChannel} />}
        {info.matchReportingChannel && <Info label="Match reporting" value={info.matchReportingChannel} />}
        {info.privateSupportContact && <Info label="Private support contact" value={info.privateSupportContact} />}
        {info.connectionRules && <TextBlock label="Connection rules" value={info.connectionRules} />}
        {info.lobbyInstructions && <TextBlock label="Lobby instructions" value={info.lobbyInstructions} />}
      </div>
    )
  }

  if (hub.venuePrivateInfo) {
    const venue = hub.venuePrivateInfo
    return (
      <div className="space-y-3">
        <Info label="Venue" value={venue.name} />
        <Info label="Location" value={`${venue.city}, ${venue.country}`} />
        <Info label="Address" value={venue.address} />
        <Info label="Check-in location" value={venue.checkInLocation} />
        {venue.mapUrl && <Info label="Map" value={venue.mapUrl} />}
        {venue.parkingInfo && <TextBlock label="Parking" value={venue.parkingInfo} />}
        {venue.venueRules && <TextBlock label="Venue rules" value={venue.venueRules} />}
      </div>
    )
  }

  return <p className="text-sm text-[#9f94a4]">No private instructions were published for this tournament.</p>
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d2c8d6]">{value}</p></div>
}

export function CaptainTournamentHubPage() {
  const { registrationId = '' } = useParams()
  const hubQuery = useCaptainRegistrationsControllerGetRegistrationHub(registrationId, {
    query: { enabled: Boolean(registrationId), staleTime: 15_000 },
  })

  if (hubQuery.isLoading) return <Skeleton className="mx-auto h-[70vh] max-w-6xl" />
  if (hubQuery.isError || !hubQuery.data) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Tournament hub could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Your team may not be approved for this registration yet.</AlertDescription><Button render={<Link to="/captain/registered" />} variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4" /> Back to registered tournaments</Button></Alert>

  const hub = hubQuery.data
  const tournament = hub.tournament
  const progress = hub.progress

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7">
        <Button render={<Link to="/captain/registered" />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to registered tournaments</Button>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]"><ShieldCheck className="h-4 w-4" /> Approved tournament hub</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">{tournament.name}</h1>
        <p className="mt-2 text-sm text-[#a99ead]">{formatLabel(tournament.gameKey)} - {formatLabel(tournament.mode)} - {formatLabel(tournament.status)}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <Card>
            <CardHeader><Trophy className="h-5 w-5 text-[#71dcff]" /><CardTitle>Tournament status</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Info label="Team" value={hub.team.name} />
              <Info label="Registration" value={formatLabel(hub.registration.status)} />
              <Info label="Payment" value={formatLabel(hub.registration.paymentStatus)} />
              <Info label="Starts" value={formatDate(tournament.startsAt)} />
              <Info label="Ends" value={formatDate(tournament.endsAt)} />
              <Info label="Check-in" value={hub.checkedIn ? 'Completed' : 'Not checked in'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Gamepad2 className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Info label="Stage" value={progress.currentStage ?? '-'} />
              <Info label="Round" value={progress.currentRound ?? '-'} />
              <Info label="Record" value={`${progress.wins ?? 0}W - ${progress.losses ?? 0}L`} />
              <Info label="Placement" value={progress.placement ? `#${progress.placement}` : '-'} />
              <Info label="Qualification" value={progress.qualificationState ?? '-'} />
              <Info label="Upcoming matches" value={String(progress.upcomingMatches.length)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><UsersRound className="h-5 w-5 text-[#8ff5d8]" /><CardTitle>Submitted roster</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {hub.rosterSnapshot.map((player, index) => <JsonSummary key={index} item={player} />)}
              {hub.rosterSnapshot.length === 0 && <p className="text-sm text-[#9f94a4]">No roster snapshot is available.</p>}
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader><CircleAlert className="h-5 w-5 text-[#ffd08b]" /><CardTitle>Required actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {hub.requiredActions.filter((action) => action !== 'NONE').map((action) => <ActionCard key={action} action={action} />)}
              {hub.requiredActions.filter((action) => action !== 'NONE').length === 0 && <div className="flex items-center gap-2 rounded-md border border-[#276f5c] bg-[#15382f] p-3 text-sm font-bold text-[#8ff5d8]"><CheckCircle2 className="h-4 w-4" /> No actions needed</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Radio className="h-5 w-5 text-[#71dcff]" /><CardTitle>Private information</CardTitle></CardHeader>
            <CardContent><PrivateInformation hub={hub} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CalendarDays className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Upcoming matches</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {progress.upcomingMatches.map((match, index) => <JsonSummary key={index} item={match} />)}
              {progress.upcomingMatches.length === 0 && <p className="text-sm text-[#9f94a4]">No upcoming matches yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><MapPin className="h-5 w-5 text-[#ff9d92]" /><CardTitle>Announcements</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {hub.announcements.map((announcement, index) => <JsonSummary key={index} item={announcement} />)}
              {hub.announcements.length === 0 && <p className="text-sm text-[#9f94a4]">No announcements yet.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
