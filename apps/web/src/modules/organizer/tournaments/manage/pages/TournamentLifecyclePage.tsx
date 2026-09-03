import { useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Check,
  CircleAlert,
  CircleCheckBig,
  ClipboardCheck,
  DoorOpen,
  LockKeyhole,
  Rocket,
  TriangleAlert,
} from 'lucide-react'
import type {
  PublicationReadinessIssueDto,
  TournamentResponseDtoStatus,
} from '@/api/generated/organizer-tournaments'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { TournamentManagementNav } from '../components/TournamentManagementNav'
import { useTournamentLifecycleMutations } from '../mutations/tournament-lifecycle.mutations'
import { useTournamentLifecycleService } from '../services/tournament-lifecycle.service'
import type { TournamentLifecycleAction } from '../types/tournament-management.types'

const lifecycleSteps: Array<{ status: TournamentResponseDtoStatus; label: string }> = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'PUBLISHED', label: 'Published' },
  { status: 'REGISTRATION_OPEN', label: 'Registration open' },
  { status: 'REGISTRATION_CLOSED', label: 'Registration closed' },
  { status: 'CHECK_IN_OPEN', label: 'Check-in open' },
]

const cancellableStatuses: TournamentResponseDtoStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'CHECK_IN_OPEN',
  'IN_PROGRESS',
  'POSTPONED',
]

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback
  const data: unknown = error.response?.data
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return fallback
}

function issueDestination(field: string, tournamentId: string) {
  const normalized = field.toLowerCase()
  if (normalized.includes('gamingroom') || normalized.includes('gaming-room')) {
    return `/organizer/tournaments/${tournamentId}/manage/gaming-rooms`
  }
  if (
    normalized.includes('venue') ||
    normalized.includes('online') ||
    normalized.includes('server')
  ) {
    return `/organizer/tournaments/${tournamentId}/manage/configuration`
  }
  return `/organizer/tournaments/${tournamentId}/manage`
}

function ReadinessCard({
  ready,
  issues,
  tournamentId,
}: {
  ready: boolean
  issues: PublicationReadinessIssueDto[]
  tournamentId: string
}) {
  return (
    <Card className={ready ? 'border-[#276f5c]' : 'border-[#6b5630]'}>
      <CardHeader>
        {ready ? <BadgeCheck className="h-5 w-5 text-[#8ff5d8]" /> : <ClipboardCheck className="h-5 w-5 text-[#ffd08b]" />}
        <CardTitle>Publication readiness</CardTitle>
      </CardHeader>
      <CardContent>
        {ready ? (
          <div className="rounded-lg border border-[#276f5c] bg-[#15382f] p-5">
            <div className="flex items-center gap-3 text-[#8ff5d8]"><CircleCheckBig className="h-6 w-6" /><p className="font-black">This tournament is ready to publish.</p></div>
            <p className="mt-2 pl-9 text-sm leading-6 text-[#a7ead7]">All required tournament, mode, venue, and hardware information has passed validation.</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#795f34] bg-[#382c19] p-4 text-[#ffd08b]"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">{issues.length} issue{issues.length === 1 ? '' : 's'} must be resolved</p><p className="mt-1 text-xs leading-5 text-[#e7ca96]">Publishing stays disabled until the API reports that the tournament is ready.</p></div></div>
            <ul className="space-y-3">
              {issues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`} className="flex flex-col justify-between gap-3 rounded-lg border border-[#3e3841] bg-[#151316] p-4 sm:flex-row sm:items-center">
                  <div><p className="text-sm font-bold text-[#eee8f0]">{issue.message}</p><p className="mt-1 font-mono text-[10px] text-[#887d8c]">{issue.field}</p></div>
                  <Button render={<Link to={issueDestination(issue.field, tournamentId)} />} variant="outline" size="sm">Fix issue</Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LifecycleProgress({ status }: { status: TournamentResponseDtoStatus }) {
  const currentIndex = lifecycleSteps.findIndex((step) => step.status === status)
  return (
    <Card>
      <CardHeader><Rocket className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Lifecycle progress</CardTitle></CardHeader>
      <CardContent>
        <ol className="grid gap-3 md:grid-cols-4">
          {lifecycleSteps.map((step, index) => {
            const completed = currentIndex > index
            const current = currentIndex === index
            return <li key={step.status} className={cn('relative rounded-lg border p-4', current ? 'border-[#b96cff] bg-[#2e2037]' : completed ? 'border-[#276f5c] bg-[#153028]' : 'border-[#39343c] bg-[#151316]')}><span className={cn('mb-3 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black', current ? 'border-[#d7a5ff] bg-[#d7a5ff] text-[#2a0b3f]' : completed ? 'border-[#62d9b6] text-[#8ff5d8]' : 'border-[#5b525f] text-[#918695]')}>{completed ? <Check className="h-4 w-4" /> : index + 1}</span><p className={cn('text-xs font-black uppercase tracking-[0.06em]', current ? 'text-[#e4c2ff]' : completed ? 'text-[#9be8d2]' : 'text-[#968b9a]')}>{step.label}</p></li>
          })}
        </ol>
        {currentIndex === -1 && <Alert className="mt-4 border-[#544b58] bg-[#242126]"><AlertTitle>Current status: {formatStatus(status)}</AlertTitle><AlertDescription className="text-[#aaa0ae]">This status is outside the publication and registration sequence shown above.</AlertDescription></Alert>}
      </CardContent>
    </Card>
  )
}

function ActionDialog({
  title,
  description,
  trigger,
  actionLabel,
  pending,
  destructive = false,
  onConfirm,
}: {
  title: string
  description: string
  trigger: ReactNode
  actionLabel: string
  pending: boolean
  destructive?: boolean
  onConfirm: () => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const confirm = async () => {
    if (await onConfirm()) setOpen(false)
  }
  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger render={trigger as React.ReactElement} /><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current status</AlertDialogCancel><AlertDialogAction variant={destructive ? 'destructive' : 'default'} disabled={pending} onClick={() => void confirm()}>{pending ? 'Processing...' : actionLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function CancellationDialog({
  pending,
  onConfirm,
}: {
  pending: boolean
  onConfirm: (reason: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 5 && reason.trim().length <= 500
  const confirm = async () => {
    if (valid && await onConfirm(reason.trim())) {
      setOpen(false)
      setReason('')
    }
  }
  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger render={<Button variant="destructive" className="w-full" />}><Ban className="h-4 w-4" /> Cancel tournament</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel this tournament?</AlertDialogTitle><AlertDialogDescription>Cancellation is a terminal action. Participants will no longer be able to continue with this tournament.</AlertDialogDescription></AlertDialogHeader><div><Label htmlFor="cancellation-reason" className="mb-2">Cancellation reason</Label><Textarea id="cancellation-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this tournament is being cancelled..." /><p className="mt-1.5 text-xs text-[#8f8494]">{reason.trim().length}/500 characters · minimum 5</p></div><AlertDialogFooter><AlertDialogCancel>Keep tournament</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending || !valid} onClick={() => void confirm()}>{pending ? 'Cancelling...' : 'Confirm cancellation'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

export function TournamentLifecyclePage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const lifecycleQuery = useTournamentLifecycleService(tournamentId)
  const mutations = useTournamentLifecycleMutations(tournamentId)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const data = lifecycleQuery.data

  const runAction = async (
    action: TournamentLifecycleAction,
    cancellationReason?: string,
  ) => {
    setMessage(null)
    setError(null)
    try {
      if (action === 'publish') await mutations.publishTournament({ tournamentId })
      if (action === 'open-registration') await mutations.openRegistration({ tournamentId })
      if (action === 'close-registration') await mutations.closeRegistration({ tournamentId })
      if (action === 'open-check-in') await mutations.openCheckIn({ tournamentId })
      if (action === 'cancel') await mutations.cancelTournament({ tournamentId, data: { reason: cancellationReason ?? '' } })
      const labels: Record<TournamentLifecycleAction, string> = {
        publish: 'Tournament published successfully.',
        'open-registration': 'Registration is now open.',
        'close-registration': 'Registration was closed.',
        'open-check-in': 'Check-in is now open.',
        cancel: 'Tournament cancelled successfully.',
      }
      setMessage(labels[action])
      return true
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'The lifecycle action could not be completed.'))
      return false
    }
  }

  if (lifecycleQuery.isLoading) return <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-xl bg-[#1b191c]" />
  if (lifecycleQuery.isError || !data) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Tournament lifecycle could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">It may not exist or may belong to another organizer.</AlertDescription></Alert>

  const { tournament, publicationReadiness } = data
  const canCancel = cancellableStatuses.includes(tournament.status)

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to tournament</Button><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament management</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Publish & Lifecycle</h1><p className="mt-2 text-sm text-[#a99ead]">Validate publication requirements and control tournament registration status.</p></div><span className="rounded-full border border-[#62586a] bg-[#302a34] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e2d7e7]">{formatStatus(tournament.status)}</span></header>
      <TournamentManagementNav tournamentId={tournament.id} active="lifecycle" />
      {message && <Alert className="mb-6 border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><CircleCheckBig className="h-5 w-5" /><AlertTitle>Action completed</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}
      {error && <Alert className="mb-6 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><TriangleAlert className="h-5 w-5" /><AlertTitle>Action failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}
      <div className="space-y-6"><LifecycleProgress status={tournament.status} /><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><ReadinessCard ready={publicationReadiness.ready} issues={publicationReadiness.issues} tournamentId={tournament.id} /><Card className="lg:sticky lg:top-6"><CardHeader><Rocket className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Available actions</CardTitle></CardHeader><CardContent className="space-y-3">
        {tournament.status === 'DRAFT' && <ActionDialog title="Publish tournament?" description="The tournament becomes visible according to its visibility setting. Draft-only settings will no longer be editable." trigger={<Button className="w-full" disabled={!publicationReadiness.ready || mutations.isPending}><Rocket className="h-4 w-4" /> Publish tournament</Button>} actionLabel="Publish" pending={mutations.isPublishing} onConfirm={() => runAction('publish')} />}
        {tournament.status === 'PUBLISHED' && <ActionDialog title="Open registration?" description="Eligible captains will be able to submit their teams for this tournament." trigger={<Button className="w-full" disabled={mutations.isPending}><DoorOpen className="h-4 w-4" /> Open registration</Button>} actionLabel="Open registration" pending={mutations.isOpeningRegistration} onConfirm={() => runAction('open-registration')} />}
        {tournament.status === 'REGISTRATION_OPEN' && <ActionDialog title="Close registration?" description="No new tournament registrations will be accepted after this action." trigger={<Button className="w-full" disabled={mutations.isPending}><LockKeyhole className="h-4 w-4" /> Close registration</Button>} actionLabel="Close registration" pending={mutations.isClosingRegistration} onConfirm={() => runAction('close-registration')} />}
        {tournament.status === 'REGISTRATION_CLOSED' && <ActionDialog title="Open check-in?" description="Approved captains will be able to complete team check-in immediately, even if the scheduled check-in open date is later." trigger={<Button className="w-full" disabled={mutations.isPending}><ClipboardCheck className="h-4 w-4" /> Open check-in</Button>} actionLabel="Open check-in" pending={mutations.isOpeningCheckIn} onConfirm={() => runAction('open-check-in')} />}
        {!['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'].includes(tournament.status) && <div className="rounded-lg border border-[#39343c] bg-[#151316] p-4"><p className="text-sm font-bold text-[#ddd5df]">No forward lifecycle action is available.</p><p className="mt-2 text-xs leading-5 text-[#958a99]">Current status: {formatStatus(tournament.status)}</p></div>}
        {tournament.status === 'DRAFT' && !publicationReadiness.ready && <p className="text-xs leading-5 text-[#c5a86e]">Resolve every publication issue before publishing.</p>}
        {canCancel && <div className="border-t border-[#39343c] pt-4"><CancellationDialog pending={mutations.isCancelling} onConfirm={(reason) => runAction('cancel', reason)} /></div>}
        {!canCancel && <Alert className="border-[#49414d] bg-[#242126]"><AlertTitle>Terminal status</AlertTitle><AlertDescription className="text-[#9f94a4]">This tournament can no longer be cancelled.</AlertDescription></Alert>}
      </CardContent></Card></div></div>
    </div>
  )
}
