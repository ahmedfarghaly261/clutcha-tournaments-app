import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CreditCard, Plus, Save, Trash2 } from 'lucide-react'
import {
  UpsertTournamentPaymentMethodDtoType,
  type UpsertTournamentPaymentMethodDto,
} from '@/api/generated/organizer-tournaments'
import type { TournamentPaymentMethodResponseDto } from '@/api/generated'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOrganizerTournamentDetailsService } from '../../details/services/organizer-tournament-details.service'
import { TournamentManagementNav } from '../components/TournamentManagementNav'
import { useTournamentPaymentMethodsMutations } from '../mutations/tournament-payment-methods.mutations'
import { useTournamentPaymentMethodsService } from '../services/tournament-payment-methods.service'

type PaymentMethodFormValues = {
  type: UpsertTournamentPaymentMethodDtoType
  displayName: string
  enabled: boolean
  accountHolderName: string
  accountIdentifier: string
  phoneNumber: string
  instapayAddress: string
  bankName: string
  bankBranch: string
  bankAccountNumber: string
  iban: string
  swiftCode: string
  externalUrl: string
  instructions: string
  notes: string
}

const defaultValues: PaymentMethodFormValues = {
  type: UpsertTournamentPaymentMethodDtoType.INSTAPAY,
  displayName: '',
  enabled: true,
  accountHolderName: '',
  accountIdentifier: '',
  phoneNumber: '',
  instapayAddress: '',
  bankName: '',
  bankBranch: '',
  bankAccountNumber: '',
  iban: '',
  swiftCode: '',
  externalUrl: '',
  instructions: '',
  notes: '',
}

const methodTypeLabels: Record<string, string> = {
  INSTAPAY: 'InstaPay',
  VODAFONE_CASH: 'Vodafone Cash',
  BANK_TRANSFER: 'Bank transfer',
  EXTERNAL_LINK: 'External payment link',
  OTHER: 'Other manual method',
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function toFormValues(method: TournamentPaymentMethodResponseDto): PaymentMethodFormValues {
  return {
    type: method.type as UpsertTournamentPaymentMethodDtoType,
    displayName: method.displayName,
    enabled: method.enabled,
    accountHolderName: method.accountHolderName ?? '',
    accountIdentifier: method.accountIdentifier ?? '',
    phoneNumber: method.phoneNumber ?? '',
    instapayAddress: method.instapayAddress ?? '',
    bankName: method.bankName ?? '',
    bankBranch: method.bankBranch ?? '',
    bankAccountNumber: method.bankAccountNumber ?? '',
    iban: method.iban ?? '',
    swiftCode: method.swiftCode ?? '',
    externalUrl: method.externalUrl ?? '',
    instructions: method.instructions,
    notes: method.notes ?? '',
  }
}

function toDto(values: PaymentMethodFormValues): UpsertTournamentPaymentMethodDto {
  return {
    type: values.type,
    displayName: values.displayName.trim(),
    enabled: values.enabled,
    accountHolderName: emptyToNull(values.accountHolderName),
    accountIdentifier: emptyToNull(values.accountIdentifier),
    phoneNumber: emptyToNull(values.phoneNumber),
    instapayAddress: emptyToNull(values.instapayAddress),
    bankName: emptyToNull(values.bankName),
    bankBranch: emptyToNull(values.bankBranch),
    bankAccountNumber: emptyToNull(values.bankAccountNumber),
    iban: emptyToNull(values.iban),
    swiftCode: emptyToNull(values.swiftCode),
    externalUrl: emptyToNull(values.externalUrl),
    instructions: values.instructions.trim(),
    notes: emptyToNull(values.notes),
  }
}

export function TournamentPaymentMethodsPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const detailsQuery = useOrganizerTournamentDetailsService(tournamentId)
  const methodsQuery = useTournamentPaymentMethodsService(tournamentId)
  const mutations = useTournamentPaymentMethodsMutations(tournamentId)
  const [editing, setEditing] = useState<TournamentPaymentMethodResponseDto | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<PaymentMethodFormValues>({ defaultValues })
  const tournament = detailsQuery.data?.tournament
  const methods = methodsQuery.data ?? []

  useEffect(() => {
    form.reset(editing ? toFormValues(editing) : defaultValues)
  }, [editing, form])

  const submit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)
    try {
      if (editing) {
        await mutations.updatePaymentMethod({
          tournamentId,
          paymentMethodId: editing.id,
          data: toDto(values),
        })
        setMessage('Payment method updated.')
      } else {
        await mutations.createPaymentMethod({ tournamentId, data: toDto(values) })
        setMessage('Payment method added.')
      }
      setEditing(null)
      form.reset(defaultValues)
    } catch {
      setError('Payment method could not be saved.')
    }
  })

  if (detailsQuery.isLoading || methodsQuery.isLoading) {
    return <div className="mx-auto h-[70vh] max-w-6xl animate-pulse rounded-xl bg-[#1b191c]" />
  }

  if (detailsQuery.isError || !tournament || methodsQuery.isError) {
    return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Payment settings could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">The tournament may not exist or may belong to another organizer.</AlertDescription></Alert>
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-7">
        <Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to tournament
        </Button>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">{tournament.name}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Payment methods</h1>
        <p className="mt-2 text-sm text-[#a99ead]">Configure manual payment instructions. Captains pay you directly; CLUTCHA only stores instructions and proof.</p>
      </header>

      <TournamentManagementNav tournamentId={tournament.id} active="payments" />

      {message && <Alert className="mb-5 border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Saved</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}
      {error && <Alert className="mb-5 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><CircleAlert className="h-5 w-5" /><AlertTitle>Save failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          {methods.map((method) => (
            <Card key={method.id} className="border-[#39343c] bg-[#171519]">
              <CardHeader className="justify-between">
                <div>
                  <CardTitle>{method.displayName}</CardTitle>
                  <p className="mt-1 text-xs text-[#958a99]">{methodTypeLabels[method.type] ?? method.type}</p>
                </div>
                <span className={method.enabled ? 'rounded-full border border-[#276f5c] bg-[#15382f] px-2.5 py-1 text-[10px] font-black uppercase text-[#8ff5d8]' : 'rounded-full border border-[#55475d] bg-[#2b2430] px-2.5 py-1 text-[10px] font-black uppercase text-[#bdb2c2]'}>
                  {method.enabled ? 'Active' : 'Disabled'}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#d2c8d6]">{method.instructions}</p>
                <div className="grid gap-2 text-xs text-[#b8adbD] sm:grid-cols-2">
                  <Detail label="Holder" value={method.accountHolderName} />
                  <Detail label="Account" value={method.accountIdentifier || method.phoneNumber || method.instapayAddress || method.bankAccountNumber || method.externalUrl} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(method)}>
                    <Save className="h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button type="button" size="sm" variant="destructive" disabled={mutations.isPending} />}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Remove payment method?</AlertDialogTitle><AlertDialogDescription>Captains will no longer be able to choose this method for new proof submissions.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void mutations.deletePaymentMethod({ tournamentId, paymentMethodId: method.id })}>Remove method</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {methods.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center"><CreditCard className="mx-auto h-10 w-10 text-[#756a79]" /><p className="mt-3 text-sm font-bold text-[#c6bdc9]">No payment methods yet</p><p className="mt-1 text-xs text-[#958a99]">Paid tournaments need at least one active payment method before publishing.</p></CardContent></Card>}
        </section>

        <Card className="border-[#39343c] bg-[#171519]">
          <CardHeader><Plus className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>{editing ? 'Edit payment method' : 'Add payment method'}</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Method type"><Controller name="type" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(UpsertTournamentPaymentMethodDtoType).map((type) => <SelectItem key={type} value={type}>{methodTypeLabels[type]}</SelectItem>)}</SelectContent></Select>} /></Field>
              <Field label="Display name"><Input {...form.register('displayName', { required: true, minLength: 2 })} placeholder="Vodafone Cash" /></Field>
              <Field label="Account holder"><Input {...form.register('accountHolderName')} placeholder="Organizer legal name" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone"><Input {...form.register('phoneNumber')} placeholder="+20..." /></Field>
                <Field label="InstaPay"><Input {...form.register('instapayAddress')} placeholder="name@instapay" /></Field>
                <Field label="Account ID"><Input {...form.register('accountIdentifier')} /></Field>
                <Field label="External link"><Input {...form.register('externalUrl')} placeholder="https://..." /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bank"><Input {...form.register('bankName')} /></Field>
                <Field label="Branch"><Input {...form.register('bankBranch')} /></Field>
                <Field label="Account number"><Input {...form.register('bankAccountNumber')} /></Field>
                <Field label="IBAN"><Input {...form.register('iban')} /></Field>
              </div>
              <Field label="Instructions"><Textarea className="min-h-28" {...form.register('instructions', { required: true, minLength: 10 })} placeholder="Tell captains exactly how to pay and what reference to include." /></Field>
              <Field label="Notes"><Textarea {...form.register('notes')} /></Field>
              <Controller name="enabled" control={form.control} render={({ field }) => <Label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#39343c] bg-[#121113] p-3"><Checkbox checked={field.value} onCheckedChange={field.onChange} /> Available to captains</Label>} />
              <div className="flex flex-wrap justify-end gap-2">
                {editing && <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel edit</Button>}
                <Button type="submit" disabled={mutations.isPending}><Save className="h-4 w-4" /> {mutations.isPending ? 'Saving...' : 'Save method'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <p><span className="text-[#807686]">{label}:</span> <strong className="text-[#e4dce7]">{value || 'Not provided'}</strong></p>
}
