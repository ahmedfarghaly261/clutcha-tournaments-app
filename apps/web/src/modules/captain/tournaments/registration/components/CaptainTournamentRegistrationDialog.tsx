import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useCreateCaptainTournamentRegistrationMutation } from '../mutations/captain-tournament-registration.mutations'
import { captainTournamentRegistrationSchema } from '../schemas/captain-tournament-registration.schema'
import {
  captainTournamentRegistrationDefaultValues,
  transformRegistrationFormToRequest,
} from '../transformers/captain-tournament-registration.transformer'
import type {
  CaptainTournamentRegistrationDialogDetails,
  CaptainTournamentRegistrationFormValues,
} from '../types/captain-tournament-registration.types'

type ApiErrorBody = {
  message?: string | string[]
  issues?: Array<{ message?: string }>
}

function getRegistrationErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return 'Registration could not be submitted. Please try again.'
  }

  if (error.response?.status === 409) {
    return 'Your team is already registered for this tournament.'
  }

  if (error.response?.status === 422) {
    const firstIssue = error.response.data?.issues?.find((issue) => issue.message)?.message
    return firstIssue ?? 'Your team is no longer eligible. Close this dialog, resolve the eligibility issue, and recheck.'
  }

  if (error.response?.status === 400) {
    return 'Tournament rules must be accepted before registration.'
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'Your Captain session cannot submit this registration. Sign in again and retry.'
  }

  return 'Registration could not be submitted. Please try again.'
}

export function CaptainTournamentRegistrationDialog({
  tournamentId,
  tournamentName,
  rules,
  rulesVersion,
  registrationFeeLabel,
}: CaptainTournamentRegistrationDialogDetails) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const registrationMutation = useCreateCaptainTournamentRegistrationMutation(tournamentId)
  const form = useForm<CaptainTournamentRegistrationFormValues>({
    resolver: zodResolver(captainTournamentRegistrationSchema),
    defaultValues: captainTournamentRegistrationDefaultValues,
  })

  const changeOpen = (nextOpen: boolean) => {
    if (registrationMutation.isPending) return
    setOpen(nextOpen)
    if (!nextOpen) {
      form.reset(captainTournamentRegistrationDefaultValues)
      setRequestError(null)
    }
  }

  const submitRegistration = form.handleSubmit(async (values) => {
    setRequestError(null)

    try {
      const registration = await registrationMutation.mutateAsync({
        tournamentId,
        data: transformRegistrationFormToRequest(values),
      })

      navigate(`/captain/registrations?submitted=${encodeURIComponent(registration.id)}`, {
        state: {
          submittedRegistration: registration,
        },
      })
    } catch (error) {
      setRequestError(getRegistrationErrorMessage(error))
    }
  })

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger render={<Button className="mt-4 w-full" />}>
        <ClipboardCheck /> Register team
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <form className="space-y-5" onSubmit={submitRegistration} noValidate>
          <AlertDialogHeader>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl border border-[#3b745f] bg-[#18372e]">
              <ShieldCheck className="h-5 w-5 text-[#8ef0cf]" />
            </div>
            <AlertDialogTitle>Register for {tournamentName}</AlertDialogTitle>
            <AlertDialogDescription>
              CLUTCHA will recheck your team and roster, then store an immutable registration snapshot for organizer review.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryValue label="Entry fee" value={registrationFeeLabel} />
            <SummaryValue label="Rules version" value={rulesVersion} />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-lg border border-[#38323b] bg-[#121113] p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#d7a5ff]">
              Tournament rules
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#c9becd]">
              {rules || 'The organizer has not provided additional rules.'}
            </p>
          </div>

          <Controller
            name="acceptRules"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#443a48] bg-[#171519] p-4"
                  htmlFor="accept-tournament-rules"
                >
                  <Checkbox
                    id="accept-tournament-rules"
                    className="mt-0.5"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-invalid={Boolean(form.formState.errors.acceptRules)}
                  />
                  <span>
                    <span className="block text-sm font-bold text-[#f0eaf2]">
                      I accept tournament rules version {rulesVersion}
                    </span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-[#9f94a4]">
                      I confirm that my team and its submitted roster will follow these rules.
                    </span>
                  </span>
                </Label>
                {form.formState.errors.acceptRules?.message && (
                  <p className="mt-2 text-xs text-[#ffafb5]" role="alert">
                    {form.formState.errors.acceptRules.message}
                  </p>
                )}
              </div>
            )}
          />

          <Alert className="border-[#315363] bg-[#13262f] text-[#a7eaff]">
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle>Organizer approval is required</AlertTitle>
            <AlertDescription className="text-[#a5cbd7]">
              Free and paid registrations remain pending until the organizer accepts the team. Any payment is arranged directly with the organizer.
            </AlertDescription>
          </Alert>

          {requestError && (
            <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>Registration was not submitted</AlertTitle>
              <AlertDescription className="text-[#e6b8bc]">{requestError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={registrationMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={registrationMutation.isPending}>
              {registrationMutation.isPending ? <LoaderCircle className="animate-spin" /> : <ClipboardCheck />}
              {registrationMutation.isPending ? 'Submitting...' : 'Confirm registration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#38323b] bg-[#121113] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8e8392]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#eee7f0]">{value}</p>
    </div>
  )
}
