import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  CreditCard,
  ExternalLink,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import type {
  OrganizerRegistrationDetailResponseDto,
  OrganizerRegistrationListItemDto,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useOrganizerTournamentDetailsService } from '../../details/services/organizer-tournament-details.service'
import { useTournamentRegistrationMutations } from '../mutations/tournament-registrations.mutations'
import {
  useTournamentRegistrationDetailsService,
  useTournamentRegistrationsService,
} from '../services/tournament-registrations.service'
import type {
  CaptainContactSnapshot,
  RegistrationApprovalFilter,
  RosterSnapshotMember,
} from '../types/tournament-registrations.types'

const approvalStyles: Record<string, string> = {
  PENDING: 'border-[#795f34] bg-[#382c19] text-[#ffd08b]',
  APPROVED: 'border-[#276f5c] bg-[#15382f] text-[#8ff5d8]',
  REJECTED: 'border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]',
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function nullableStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

function toCaptainContact(value: unknown): CaptainContactSnapshot | null {
  if (!isRecord(value)) return null
  return {
    displayName: stringValue(value, 'displayName'),
    email: stringValue(value, 'email'),
    phoneNumber: nullableStringValue(value, 'phoneNumber'),
    discordUsername: nullableStringValue(value, 'discordUsername'),
  }
}

function toRoster(value: unknown): RosterSnapshotMember[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((member) => ({
    rosterPlayerId: stringValue(member, 'rosterPlayerId'),
    gamerTag: stringValue(member, 'gamerTag'),
    realName: nullableStringValue(member, 'realName'),
    gameAccountId: stringValue(member, 'gameAccountId'),
    phoneNumber: stringValue(member, 'phoneNumber'),
    email: nullableStringValue(member, 'email'),
    discordUsername: nullableStringValue(member, 'discordUsername'),
    rosterType: stringValue(member, 'rosterType'),
    rank: nullableStringValue(member, 'rank'),
    country: nullableStringValue(member, 'country'),
  }))
}

function getApprovalUnavailableReason(
  registration: OrganizerRegistrationDetailResponseDto,
) {
  if (registration.approvalStatus !== 'PENDING') {
    return 'Only pending registrations can be approved.'
  }

  if (!registration.eligibility.eligible) {
    return 'Resolve the eligibility issues before approving this team.'
  }

  if (!['PROOF_SUBMITTED', 'VERIFIED', 'PAID', 'NOT_REQUIRED'].includes(registration.paymentStatus)) {
    return 'Paid registrations require submitted payment proof before approval.'
  }

  if (!['PENDING_APPROVAL', 'WAITLISTED'].includes(registration.status)) {
    return 'This registration status does not allow approval.'
  }

  return null
}

function canReject(registration: OrganizerRegistrationDetailResponseDto) {
  return (
    registration.approvalStatus === 'PENDING' &&
    !['WITHDRAWN', 'CHECKED_IN', 'DISQUALIFIED', 'REFUNDED'].includes(
      registration.status,
    )
  )
}

function StatusBadge({ value, className }: { value: string; className?: string }) {
  return <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.05em]', approvalStyles[value] ?? 'border-[#4c444f] bg-[#29252b] text-[#c7bdca]', className)}>{formatLabel(value)}</span>
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return <Card><CardContent className="flex items-center gap-4"><span className={cn('flex h-11 w-11 items-center justify-center rounded-lg', accent)}>{icon}</span><div><p className="text-2xl font-black text-[#f5f0f7]">{value}</p><p className="text-xs font-bold uppercase tracking-[0.06em] text-[#948999]">{label}</p></div></CardContent></Card>
}

function RegistrationListCard({
  registration,
  selected,
  onSelect,
}: {
  registration: OrganizerRegistrationListItemDto
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" onClick={onSelect} className={cn('w-full rounded-xl border bg-[#1b191c] p-4 text-left transition hover:border-[#6b5a74] hover:bg-[#211e22]', selected ? 'border-[#b96cff] ring-1 ring-[#b96cff]/25' : 'border-[#39343c]')}>
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-[#f2edf4]">{registration.team.name}</p><p className="mt-1 text-xs text-[#918696]">{formatLabel(registration.team.gameKey)} · {registration.team.region || 'No region'}</p></div><StatusBadge value={registration.approvalStatus} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#39343c] pt-3 text-xs"><div><p className="text-[#7f7583]">Registration</p><p className="mt-1 font-bold text-[#d8d0db]">{formatLabel(registration.status)}</p></div><div><p className="text-[#7f7583]">Payment</p><p className="mt-1 font-bold text-[#d8d0db]">{formatLabel(registration.paymentStatus)}</p></div></div>
      <div className={cn('mt-3 flex items-center gap-2 text-xs font-bold', registration.eligibility.eligible ? 'text-[#8ff5d8]' : 'text-[#ffd08b]')}>{registration.eligibility.eligible ? <BadgeCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}{registration.eligibility.eligible ? 'Eligible' : `${registration.eligibility.issues.length} eligibility issue${registration.eligibility.issues.length === 1 ? '' : 's'}`}</div>
    </button>
  )
}

function RejectDialog({
  pending,
  onReject,
}: {
  pending: boolean
  onReject: (reason: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const valid = reason.trim().length > 0 && reason.trim().length <= 500
  const confirm = async () => {
    if (valid && await onReject(reason.trim())) {
      setReason('')
      setOpen(false)
    }
  }
  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger render={<Button variant="destructive" disabled={pending} />}><X className="h-4 w-4" /> Reject team</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject this registration?</AlertDialogTitle><AlertDialogDescription>The captain will see the rejection reason. Keep it clear and actionable.</AlertDialogDescription></AlertDialogHeader><div><Label htmlFor="registration-rejection-reason" className="mb-2">Rejection reason</Label><Textarea id="registration-rejection-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this registration cannot be accepted..." /><p className="mt-1.5 text-xs text-[#8f8494]">{reason.trim().length}/500 characters</p></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={!valid || pending} onClick={() => void confirm()}>{pending ? 'Rejecting...' : 'Confirm rejection'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function RejectPaymentDialog({
  pending,
  onReject,
}: {
  pending: boolean
  onReject: (reason: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 3 && reason.trim().length <= 500
  const confirm = async () => {
    if (valid && await onReject(reason.trim())) {
      setReason('')
      setOpen(false)
    }
  }

  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger render={<Button variant="destructive" disabled={pending} />}><X className="h-4 w-4" /> Reject payment</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject payment proof?</AlertDialogTitle><AlertDialogDescription>The captain will see this reason and may upload new proof while registration is still open.</AlertDialogDescription></AlertDialogHeader><div><Label htmlFor="payment-rejection-reason" className="mb-2">Rejection reason</Label><Textarea id="payment-rejection-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Payment was not received, incorrect amount, unreadable proof..." /><p className="mt-1.5 text-xs text-[#8f8494]">{reason.trim().length}/500 characters</p></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={!valid || pending} onClick={() => void confirm()}>{pending ? 'Rejecting...' : 'Reject proof'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function RegistrationDetails({
  tournamentId,
  registrationId,
  onMessage,
}: {
  tournamentId: string
  registrationId: string
  onMessage: (message: string | null, error: string | null) => void
}) {
  const detailsQuery = useTournamentRegistrationDetailsService(tournamentId, registrationId)
  const mutations = useTournamentRegistrationMutations(tournamentId)
  const registration = detailsQuery.data

  const approve = async () => {
    onMessage(null, null)
    try {
      await mutations.approveRegistration({ tournamentId, registrationId })
      onMessage('Team registration approved successfully.', null)
      return true
    } catch (error) {
      onMessage(null, getErrorMessage(error, 'Could not approve this registration.'))
      return false
    }
  }

  const reject = async (reason: string) => {
    onMessage(null, null)
    try {
      await mutations.rejectRegistration({ tournamentId, registrationId, data: { reason } })
      onMessage('Team registration rejected.', null)
      return true
    } catch (error) {
      onMessage(null, getErrorMessage(error, 'Could not reject this registration.'))
      return false
    }
  }

  const verifyPayment = async () => {
    onMessage(null, null)
    try {
      await mutations.verifyPaymentProof({ tournamentId, registrationId })
      onMessage('Payment proof manually verified.', null)
      return true
    } catch (error) {
      onMessage(null, getErrorMessage(error, 'Could not verify this payment proof.'))
      return false
    }
  }

  const rejectPayment = async (reason: string) => {
    onMessage(null, null)
    try {
      await mutations.rejectPaymentProof({ tournamentId, registrationId, data: { reason } })
      onMessage('Payment proof rejected.', null)
      return true
    } catch (error) {
      onMessage(null, getErrorMessage(error, 'Could not reject this payment proof.'))
      return false
    }
  }

  if (detailsQuery.isLoading) return <div className="h-[620px] animate-pulse rounded-xl bg-[#1b191c]" />
  if (detailsQuery.isError || !registration) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Registration could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">It may have been removed or no longer belongs to this tournament.</AlertDescription></Alert>

  const contact = toCaptainContact(registration.captainContactSnapshot)
  const roster = toRoster(registration.rosterSnapshot)
  const approvalUnavailableReason = getApprovalUnavailableReason(registration)
  const paymentProof = registration.latestPaymentProof
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="justify-between"><div className="min-w-0"><CardTitle className="truncate text-xl">{registration.team.name}</CardTitle><p className="mt-1 text-xs text-[#94899a]">Submitted {formatDate(registration.submittedAt)}</p></div><StatusBadge value={registration.approvalStatus} /></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Status</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{formatLabel(registration.status)}</p></div><div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Payment</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{formatLabel(registration.paymentStatus)}</p></div><div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Rules version</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{registration.rulesVersion}</p></div></div>
          <div className={cn('rounded-lg border p-4', registration.eligibility.eligible ? 'border-[#276f5c] bg-[#15382f]' : 'border-[#795f34] bg-[#382c19]')}><div className={cn('flex items-center gap-2 font-black', registration.eligibility.eligible ? 'text-[#8ff5d8]' : 'text-[#ffd08b]')}>{registration.eligibility.eligible ? <ShieldCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}{registration.eligibility.eligible ? 'Team meets current eligibility rules' : 'Team is not currently eligible'}</div>{!registration.eligibility.eligible && <ul className="mt-3 space-y-2 text-xs text-[#e7ca96]">{registration.eligibility.issues.map((issue) => <li key={`${issue.code}-${issue.field}`}>• {issue.message}</li>)}</ul>}</div>
          {registration.rejectionReason && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Rejection reason</AlertTitle><AlertDescription className="text-[#ffcbc7]">{registration.rejectionReason}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      <Card><CardHeader><UserRound className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Captain contact</CardTitle></CardHeader><CardContent>{contact ? <div><p className="font-black text-[#f1ebf3]">{contact.displayName || 'Captain'}</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p className="flex items-center gap-2 text-[#c4bac8]"><Mail className="h-4 w-4 text-[#d7a5ff]" /> {contact.email || 'Not provided'}</p><p className="flex items-center gap-2 text-[#c4bac8]"><Phone className="h-4 w-4 text-[#d7a5ff]" /> {contact.phoneNumber || 'Not provided'}</p><p className="text-[#c4bac8]">Discord: <strong>{contact.discordUsername || 'Not provided'}</strong></p></div></div> : <p className="text-sm text-[#958a99]">Captain contact was not included in this submission.</p>}</CardContent></Card>

      <Card>
        <CardHeader><CreditCard className="h-5 w-5 text-[#8ff5d8]" /><CardTitle>Manual payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Payment status</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{formatLabel(registration.paymentStatus)}</p></div>
            <div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Expected amount</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{paymentProof ? `${paymentProof.expectedAmount} ${paymentProof.currency}` : 'Not submitted'}</p></div>
            <div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">Proof status</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{paymentProof ? formatLabel(paymentProof.status) : 'No proof'}</p></div>
          </div>
          {paymentProof ? (
            <div className="rounded-lg border border-[#39343c] bg-[#151316] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-black text-[#f0eaf2]">{paymentProof.paymentMethod.displayName}</p><p className="mt-1 text-xs text-[#928798]">Submitted {formatDate(paymentProof.submittedAt)}</p></div>
                <Button render={<a href={paymentProof.proofUrl} target="_blank" rel="noreferrer" />} variant="outline" size="sm"><ExternalLink className="h-4 w-4" /> View proof</Button>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-[#b5abb9] sm:grid-cols-2">
                <p>Reference: <strong className="text-[#e2dbe5]">{paymentProof.transactionReference || 'Not provided'}</strong></p>
                <p>Paid at: <strong className="text-[#e2dbe5]">{paymentProof.paidAt ? formatDate(paymentProof.paidAt) : 'Not provided'}</strong></p>
              </div>
              {paymentProof.captainNote && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#cfc6d2]">{paymentProof.captainNote}</p>}
              {paymentProof.rejectionReason && <Alert className="mt-4 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Payment rejection reason</AlertTitle><AlertDescription className="text-[#ffcbc7]">{paymentProof.rejectionReason}</AlertDescription></Alert>}
              {paymentProof.status === 'SUBMITTED' && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button disabled={mutations.isPending} />}><Check className="h-4 w-4" /> Verify payment</AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Manually verify this payment?</AlertDialogTitle><AlertDialogDescription>You are confirming that the money reached your real payment account. CLUTCHA does not validate or guarantee this transaction.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={mutations.isPending} onClick={() => void verifyPayment()}>{mutations.isVerifyingPayment ? 'Verifying...' : 'Confirm payment received'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                  <RejectPaymentDialog pending={mutations.isRejectingPayment} onReject={rejectPayment} />
                </div>
              )}
            </div>
          ) : <p className="text-sm text-[#958a99]">No payment proof has been submitted for this registration.</p>}
        </CardContent>
      </Card>

      <Card><CardHeader><UsersRound className="h-5 w-5 text-[#55ddff]" /><CardTitle>Submitted roster ({roster.length})</CardTitle></CardHeader><CardContent>{roster.length === 0 ? <p className="text-sm text-[#958a99]">No roster snapshot was included.</p> : <div className="space-y-3">{roster.map((member, index) => <div key={member.rosterPlayerId || `${member.gamerTag}-${index}`} className="rounded-lg border border-[#39343c] bg-[#151316] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-[#f0eaf2]">{member.gamerTag || 'Unnamed player'}</p><p className="mt-1 text-xs text-[#928798]">{member.realName || 'Real name not provided'}</p></div><span className="rounded-full border border-[#504556] px-2.5 py-1 text-[10px] font-black uppercase text-[#d7a5ff]">{formatLabel(member.rosterType || 'player')}</span></div><div className="mt-4 grid gap-2 text-xs text-[#b5abb9] sm:grid-cols-3"><p>Account: <strong className="text-[#e2dbe5]">{member.gameAccountId || '—'}</strong></p><p>Rank: <strong className="text-[#e2dbe5]">{member.rank || '—'}</strong></p><p>Country: <strong className="text-[#e2dbe5]">{member.country || '—'}</strong></p></div></div>)}</div>}</CardContent></Card>

      {(registration.approvalStatus === 'PENDING' || canReject(registration)) && (
        <Card>
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-[#d7a5ff]" />
            <CardTitle>Organizer decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      disabled={
                        mutations.isPending || Boolean(approvalUnavailableReason)
                      }
                    />
                  }
                >
                  <Check className="h-4 w-4" /> Approve team
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Approve {registration.team.name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This confirms the team's place in the tournament. The API
                      will recheck eligibility, submitted payment proof, and
                      capacity before approval.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={mutations.isPending}
                      onClick={() => void approve()}
                    >
                      {mutations.isApproving
                        ? 'Approving...'
                        : 'Approve registration'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {canReject(registration) && (
                <RejectDialog pending={mutations.isRejecting} onReject={reject} />
              )}
            </div>
            {approvalUnavailableReason && (
              <p className="text-xs leading-5 text-[#ffd08b]">
                {approvalUnavailableReason}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TournamentRegistrationsPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const tournamentQuery = useOrganizerTournamentDetailsService(tournamentId)
  const registrationsQuery = useTournamentRegistrationsService(tournamentId)
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [search, setSearch] = useState('')
  const [approvalFilter, setApprovalFilter] = useState<RegistrationApprovalFilter>('ALL')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const items = useMemo(
    () => registrationsQuery.data?.items ?? [],
    [registrationsQuery.data?.items],
  )
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((registration) => {
      const matchesStatus = approvalFilter === 'ALL' || registration.approvalStatus === approvalFilter
      const matchesSearch = !term || registration.team.name.toLowerCase().includes(term) || registration.team.gameKey.toLowerCase().includes(term) || (registration.team.region ?? '').toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [approvalFilter, items, search])

  if (tournamentQuery.isLoading || registrationsQuery.isLoading) return <div className="mx-auto h-[70vh] max-w-7xl animate-pulse rounded-xl bg-[#1b191c]" />
  if (tournamentQuery.isError || !tournamentQuery.data || registrationsQuery.isError) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Registrations could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Check that the tournament exists and belongs to this organizer.</AlertDescription></Alert>
  const tournament = tournamentQuery.data.tournament
  const pendingCount = items.filter((item) => item.approvalStatus === 'PENDING').length
  const approvedCount = items.filter((item) => item.approvalStatus === 'APPROVED').length
  const rejectedCount = items.filter((item) => item.approvalStatus === 'REJECTED').length

  return <div className="mx-auto max-w-7xl pb-10"><header className="mb-7"><Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to tournament</Button><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">{tournament.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Team Registrations</h1><p className="mt-2 text-sm text-[#a99ead]">Review submitted teams, private roster snapshots, eligibility, and approval status.</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SummaryCard icon={<UsersRound className="h-5 w-5" />} label="Total" value={items.length} accent="bg-[#30283a] text-[#d7a5ff]" /><SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Pending" value={pendingCount} accent="bg-[#382c19] text-[#ffd08b]" /><SummaryCard icon={<BadgeCheck className="h-5 w-5" />} label="Approved" value={approvedCount} accent="bg-[#15382f] text-[#8ff5d8]" /><SummaryCard icon={<X className="h-5 w-5" />} label="Rejected" value={rejectedCount} accent="bg-[#361b20] text-[#ffcbc7]" /></div>
    {message && <Alert className="mb-5 border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Decision saved</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}{error && <Alert className="mb-5 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Decision failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]"><aside className="space-y-4 lg:sticky lg:top-6"><Card><CardContent className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#887d8c]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams..." className="pl-10" /></div><Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as RegistrationApprovalFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All approval statuses</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select></CardContent></Card><div className="max-h-[calc(100vh-180px)] space-y-3 overflow-y-auto pr-1">{filteredItems.map((registration) => <RegistrationListCard key={registration.registrationId} registration={registration} selected={selectedRegistrationId === registration.registrationId} onSelect={() => { setSelectedRegistrationId(registration.registrationId); setMessage(null); setError(null) }} />)}{filteredItems.length === 0 && <Card><CardContent className="py-10 text-center"><UsersRound className="mx-auto h-8 w-8 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">No matching registrations</p></CardContent></Card>}</div></aside><main>{selectedRegistrationId ? <RegistrationDetails tournamentId={tournament.id} registrationId={selectedRegistrationId} onMessage={(nextMessage, nextError) => { setMessage(nextMessage); setError(nextError) }} /> : <Card className="border-dashed"><CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center"><ShieldCheck className="h-12 w-12 text-[#65586c]" /><h2 className="mt-4 text-xl font-black text-[#f1ebf3]">Select a registration to review</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#9e939f]">Open a team to view its captain contact, submitted roster, current eligibility, and available organizer decisions.</p></CardContent></Card>}</main></div>
  </div>
}
