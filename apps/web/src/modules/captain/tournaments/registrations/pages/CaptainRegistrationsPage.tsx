import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CreditCard, FileUp, ShieldCheck, Trophy } from 'lucide-react'
import {
  getCaptainRegistrationsControllerGetRegistrationQueryKey,
  getCaptainRegistrationsControllerListRegistrationsQueryKey,
  useCaptainRegistrationsControllerGetRegistration,
  useCaptainRegistrationsControllerListRegistrations,
  useCaptainRegistrationsControllerSubmitPaymentProof,
} from '@/api/generated/captain-registrations/captain-registrations'
import { useCaptainTournamentEligibilityControllerListPaymentMethods } from '@/api/generated/captain-tournaments/captain-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PaymentMethodDetails } from '../../payment/components/PaymentMethodDetails'

const paymentNeedsProof = new Set(['AWAITING_PROOF', 'REJECTED'])

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
}

export function CaptainRegistrationsPage() {
  const [selectedId, setSelectedId] = useState('')
  const listQuery = useCaptainRegistrationsControllerListRegistrations({}, {
    query: { staleTime: 15_000 },
  })
  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items])
  const selectedRegistrationId = selectedId || items[0]?.registrationId || ''

  if (listQuery.isLoading) return <Skeleton className="mx-auto h-[70vh] max-w-6xl" />
  if (listQuery.isError) return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Registrations could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">Refresh and try again.</AlertDescription></Alert>

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#71dcff]">Captain Workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Registrations</h1>
        <p className="mt-2 text-sm text-[#a99ead]">Track tournament registrations, manual payment proof, and organizer approval.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {items.map((registration) => (
            <Button key={registration.registrationId} variant="ghost" onClick={() => setSelectedId(registration.registrationId)} className={cn('h-auto w-full justify-start rounded-xl border bg-[#1b191c] p-4 text-left hover:border-[#6b5a74]', selectedRegistrationId === registration.registrationId ? 'border-[#71dcff] ring-1 ring-[#71dcff]/25' : 'border-[#39343c]')}>
              <div className="w-full">
                <p className="font-black text-[#f2edf4]">{registration.tournament.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="info">Payment {formatLabel(registration.paymentStatus)}</Badge>
                  <Badge variant="accent">Approval {formatLabel(registration.approvalStatus)}</Badge>
                </div>
              </div>
            </Button>
          ))}
          {items.length === 0 && <Card><CardContent className="py-12 text-center"><Trophy className="mx-auto h-10 w-10 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">No registrations yet</p></CardContent></Card>}
        </aside>
        <main>{selectedRegistrationId ? <CaptainRegistrationDetail registrationId={selectedRegistrationId} /> : <Card className="border-dashed"><CardContent className="flex min-h-[360px] items-center justify-center text-sm text-[#958a99]">Select a registration.</CardContent></Card>}</main>
      </div>
    </div>
  )
}

function CaptainRegistrationDetail({ registrationId }: { registrationId: string }) {
  const queryClient = useQueryClient()
  const detailQuery = useCaptainRegistrationsControllerGetRegistration(registrationId, {
    query: { enabled: Boolean(registrationId), staleTime: 10_000 },
  })
  const mutation = useCaptainRegistrationsControllerSubmitPaymentProof({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getCaptainRegistrationsControllerListRegistrationsQueryKey({}) }),
          queryClient.invalidateQueries({ queryKey: getCaptainRegistrationsControllerGetRegistrationQueryKey(registrationId) }),
        ])
      },
    },
  })
  const registration = detailQuery.data
  const tournamentId = registration?.tournament.id ?? ''
  const paidTournament = Number(registration?.tournament.registrationFee ?? '0') > 0
  const methodsQuery = useCaptainTournamentEligibilityControllerListPaymentMethods(tournamentId, {
    query: { enabled: Boolean(tournamentId) && paidTournament, staleTime: 30_000 },
  })
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [transactionReference, setTransactionReference] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [captainNote, setCaptainNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentMethodId && methodsQuery.data?.[0]) {
      setPaymentMethodId(methodsQuery.data[0].id)
    }
  }, [methodsQuery.data, paymentMethodId])

  const submitProof = async () => {
    if (!file || !paymentMethodId) return
    setMessage(null)
    setError(null)
    try {
      await mutation.mutateAsync({
        registrationId,
        data: {
          paymentMethodId,
          file,
          transactionReference: transactionReference.trim() || undefined,
          paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
          captainNote: captainNote.trim() || undefined,
        },
      })
      setMessage('Payment proof submitted for organizer review.')
      setFile(null)
      setTransactionReference('')
      setPaidAt('')
      setCaptainNote('')
    } catch {
      setError('Payment proof could not be submitted.')
    }
  }

  if (detailQuery.isLoading) return <Skeleton className="h-[560px]" />
  if (detailQuery.isError || !registration) return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Registration could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">It may no longer exist.</AlertDescription></Alert>

  const requiresProof = paymentNeedsProof.has(registration.lifecycle.paymentStatus)
  const selectedPaymentMethod = methodsQuery.data?.find((method) => method.id === paymentMethodId)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#71dcff]" /><CardTitle>{registration.tournament.name}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Status label="Registration" value={registration.lifecycle.status} />
          <Status label="Payment" value={registration.lifecycle.paymentStatus} />
          <Status label="Approval" value={registration.lifecycle.approvalStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CreditCard className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Manual payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {registration.lifecycle.paymentStatus === 'NOT_REQUIRED' && <p className="text-sm text-[#bfb5c4]">This tournament is free. No payment proof is required.</p>}
          {registration.lifecycle.paymentStatus === 'PROOF_SUBMITTED' && <p className="text-sm text-[#bfb5c4]">Your proof is submitted. The organizer is checking their account and will manually verify or reject it.</p>}
          {registration.lifecycle.paymentStatus === 'VERIFIED' && <p className="text-sm text-[#bfb5c4]">The organizer manually verified your payment. Team approval is still a separate step.</p>}
          {paidTournament && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#d7a5ff]">Organizer payment coordinates</p>
              {methodsQuery.isLoading && <p className="text-sm text-[#9f94a4]">Loading payment methods...</p>}
              {methodsQuery.data?.map((method) => <PaymentMethodDetails key={method.id} method={method} />)}
              {!methodsQuery.isLoading && methodsQuery.data?.length === 0 && <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]"><AlertTitle>No payment methods available</AlertTitle><AlertDescription className="text-[#e6b8bc]">The organizer has not configured payment coordinates yet.</AlertDescription></Alert>}
            </div>
          )}
          {requiresProof && (
            <div className="space-y-4">
              <Alert className="border-[#735f2c] bg-[#332916] text-[#f1d384]"><AlertTitle>Pay the organizer directly</AlertTitle><AlertDescription className="text-[#d9c387]">CLUTCHA does not process or verify payments automatically. Complete the payment using one method below, then upload proof.</AlertDescription></Alert>
              <Field label="Payment method"><Select value={paymentMethodId} onValueChange={(value) => setPaymentMethodId(value ?? '')}><SelectTrigger><SelectValue placeholder={methodsQuery.isLoading ? 'Loading methods...' : 'Choose payment method'} /></SelectTrigger><SelectContent>{methodsQuery.data?.map((method) => <SelectItem key={method.id} value={method.id}>{method.displayName}</SelectItem>)}</SelectContent></Select></Field>
              {selectedPaymentMethod && <p className="text-xs text-[#a99ead]">Selected method: <span className="font-bold text-[#f0eaf2]">{selectedPaymentMethod.displayName}</span></p>}
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Transaction reference"><Input value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} /></Field><Field label="Payment date/time"><Input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} /></Field></div>
              <Field label="Proof file"><Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></Field>
              <Field label="Note to organizer"><Textarea value={captainNote} onChange={(event) => setCaptainNote(event.target.value)} /></Field>
              {message && <Alert className="border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Proof submitted</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}
              {error && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Upload failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}
              <Button disabled={!file || !paymentMethodId || mutation.isPending} onClick={() => void submitProof()}><FileUp className="h-4 w-4" /> {mutation.isPending ? 'Uploading...' : 'Submit payment proof'}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#151316] p-3"><p className="text-[10px] font-black uppercase text-[#837987]">{label}</p><p className="mt-1 text-sm font-bold text-[#e8e1ea]">{formatLabel(value)}</p></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
