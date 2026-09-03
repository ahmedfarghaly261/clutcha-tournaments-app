import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck2, CheckCircle2, CircleAlert, Clock3, MapPin, Radio, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useCaptainCheckInMutation } from '../mutations/captain-check-in.mutations'
import { useCaptainCheckInRegistrationsService, useCaptainRegistrationCheckInService } from '../services/captain-check-in.service'
import type {
  CaptainCheckInDetailsProps,
  CaptainCheckInInfoProps,
  CaptainCheckInInstructionProps,
  CaptainCheckInRegistrationButtonProps,
} from '../types/captain-check-in.types'

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function RegistrationButton({ registration, selected, onSelect }: CaptainCheckInRegistrationButtonProps) {
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

function Info({ label, value }: CaptainCheckInInfoProps) {
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-1 break-words text-sm font-bold text-[#e8e1ea]">{value}</p></div>
}

function Instruction({ label, value }: CaptainCheckInInstructionProps) {
  if (!value) return null
  return <div className="rounded-md border border-[#343037] bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d2c8d6]">{value}</p></div>
}

function CheckInDetails({ registrationId }: CaptainCheckInDetailsProps) {
  const checkInQuery = useCaptainRegistrationCheckInService(registrationId)
  const checkInMutation = useCaptainCheckInMutation(registrationId)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitCheckIn = async () => {
    setMessage(null)
    setError(null)
    try {
      await checkInMutation.checkInRegistration({ registrationId })
      setMessage('Team check-in completed.')
    } catch {
      setError('Check-in could not be completed.')
    }
  }

  if (checkInQuery.isLoading) return <Skeleton className="h-[560px]" />
  if (checkInQuery.isError || !checkInQuery.data) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Check-in could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Your registration may not be approved yet.</AlertDescription></Alert>

  const checkIn = checkInQuery.data
  const instructions = checkIn.instructions

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="items-start justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle>{checkIn.tournament.name}</CardTitle>
            <p className="mt-1 text-sm text-[#9f94a4]">{formatLabel(checkIn.tournament.mode)} - {checkIn.tournament.timezone}</p>
          </div>
          <Badge variant={checkIn.checkedIn ? 'success' : checkIn.canCheckIn ? 'info' : 'warning'}>
            {checkIn.checkedIn ? 'Checked in' : checkIn.canCheckIn ? 'Ready' : 'Not ready'}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Info label="Registration" value={formatLabel(checkIn.registration.status)} />
          <Info label="Approval" value={formatLabel(checkIn.registration.approvalStatus)} />
          <Info label="Payment" value={formatLabel(checkIn.registration.paymentStatus)} />
          <Info label="Checked in at" value={formatDate(checkIn.registration.checkedInAt)} />
          <Info label="Can check in" value={checkIn.canCheckIn ? 'Yes' : 'No'} />
          <Info label="Outstanding issues" value={String(checkIn.outstandingIssues.length)} />
        </CardContent>
      </Card>

      {message && <Alert className="border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><CheckCircle2 className="h-5 w-5" /><AlertTitle>Checked in</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}
      {error && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><CircleAlert className="h-5 w-5" /><AlertTitle>Check-in failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}

      {checkIn.outstandingIssues.length > 0 && (
        <Card>
          <CardHeader><CircleAlert className="h-5 w-5 text-[#ffd08b]" /><CardTitle>Outstanding issues</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {checkIn.outstandingIssues.map((issue) => <div key={`${issue.field}-${issue.message}`} className="rounded-md border border-[#795f34] bg-[#382c19] p-3"><p className="text-xs font-black uppercase text-[#ffd08b]">{issue.field}</p><p className="mt-1 text-sm text-[#e7ca96]">{issue.message}</p></div>)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><Radio className="h-5 w-5 text-[#71dcff]" /><CardTitle>Check-in instructions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Instruction label="Check-in instructions" value={instructions.checkInInstructions} />
          <Instruction label="Arrival time" value={instructions.arrivalTime} />
          <Instruction label="Server region" value={instructions.serverRegion} />
          <Instruction label="Online instructions" value={instructions.onlineInstructions} />
          <Instruction label="Venue" value={instructions.venueName} />
          <Instruction label="Check-in location" value={instructions.checkInLocation} />
          <Instruction label="Assigned room" value={instructions.assignedRoomName} />
          <Instruction label="Assigned station" value={instructions.assignedStation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Team check-in</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-[#bfb5c4]">Complete check-in only when your team is ready for tournament operations. The API will recheck approval, registration status, check-in window, profile, and roster requirements.</p>
          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger render={<Button disabled={!checkIn.canCheckIn || checkInMutation.isCheckingIn} />}>
                <CalendarCheck2 className="h-4 w-4" /> {checkInMutation.isCheckingIn ? 'Checking in...' : 'Check in team'}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Check in your team?</AlertDialogTitle>
                  <AlertDialogDescription>This confirms your team is ready for tournament play.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={!checkIn.canCheckIn || checkInMutation.isCheckingIn} onClick={() => void submitCheckIn()}>Confirm check-in</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button render={<Link to={`/captain/registrations/${registrationId}/hub`} />} variant="secondary">Open hub</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CaptainCheckInPage() {
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const registrationsQuery = useCaptainCheckInRegistrationsService()
  const registrations = registrationsQuery.data?.items ?? []
  const activeRegistrationId = selectedRegistrationId || registrations[0]?.registrationId || ''
  const activeRegistration = useMemo(() => registrations.find((registration) => registration.registrationId === activeRegistrationId), [activeRegistrationId, registrations])

  if (registrationsQuery.isLoading) return <Skeleton className="mx-auto h-[70vh] max-w-6xl" />
  if (registrationsQuery.isError) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Check-in registrations could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]"><Clock3 className="h-4 w-4" /> Captain Workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Check-in</h1>
        <p className="mt-2 text-sm text-[#a99ead]">Review readiness and check in approved tournament registrations.</p>
      </header>

      {registrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <CalendarCheck2 className="mx-auto h-10 w-10 text-[#756a79]" />
            <p className="mt-3 text-sm font-bold text-[#c6bdc9]">No approved registrations yet</p>
            <p className="mt-1 text-xs text-[#958a99]">Check-in appears after an organizer approves your team.</p>
            <Button render={<Link to="/captain/registered" />} className="mt-5">Registered tournaments</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:sticky lg:top-6">
            {registrations.map((registration) => <RegistrationButton key={registration.registrationId} registration={registration} selected={registration.registrationId === activeRegistrationId} onSelect={() => setSelectedRegistrationId(registration.registrationId)} />)}
          </aside>
          <main>
            {activeRegistration && <div className="mb-4 flex items-center gap-2 text-xs font-bold text-[#9f94a4]"><MapPin className="h-4 w-4" /> Checking <span className="text-[#f1ebf3]">{activeRegistration.tournament.name}</span></div>}
            {activeRegistrationId && <CheckInDetails registrationId={activeRegistrationId} />}
          </main>
        </div>
      )}
    </div>
  )
}
