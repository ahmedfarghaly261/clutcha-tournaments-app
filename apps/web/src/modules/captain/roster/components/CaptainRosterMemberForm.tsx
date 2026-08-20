import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  CircleAlert,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateCaptainRosterPlayerDtoRosterType } from '@/api/generated/captain'
import type { CaptainProfile } from '../../profile/types/captain-profile.types'
import { captainRosterMemberSchema } from '../schemas/captain-roster.schema'
import { captainRosterMemberDefaultValues } from '../transformers/captain-roster.transformer'
import type {
  CaptainRosterMemberFormValues,
  RosterPlayer,
} from '../types/captain-roster.types'

type CaptainRosterMemberFormProps = {
  profile: CaptainProfile
  isSaving: boolean
  onSubmit: (values: CaptainRosterMemberFormValues) => Promise<RosterPlayer>
}

function getCaptainMemberError(error: unknown): string {
  if (!isAxiosError(error)) return 'Could not create your Captain roster member.'
  if (error.response?.status === 409) return 'Your Captain roster member already exists, or this game account ID is already in use.'
  if (error.response?.status === 422) return 'Add the required phone number to your Captain profile first.'
  if (error.response?.status === 400) return 'Check your playing identity and try again.'
  return 'Could not create your Captain roster member. Please try again.'
}

export function CaptainRosterMemberForm({
  profile,
  isSaving,
  onSubmit,
}: CaptainRosterMemberFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const form = useForm<CaptainRosterMemberFormValues>({
    resolver: zodResolver(captainRosterMemberSchema),
    defaultValues: captainRosterMemberDefaultValues,
  })

  const submit = form.handleSubmit(async (values) => {
    setRequestError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setRequestError(getCaptainMemberError(error))
    }
  })

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Alert className="border-[#735f2c] bg-[#332916] text-[#f1d384]">
        <ShieldCheck className="h-5 w-5" />
        <AlertTitle>Complete your Captain roster member</AlertTitle>
        <AlertDescription className="text-[#d9c387]">
          This team was created before Captains became roster members. Add your playing identity to complete the roster setup.
        </AlertDescription>
      </Alert>

      <Card className="border-[#6c5c31] bg-[#17191b]">
        <CardHeader>
          <UserRound className="h-5 w-5 text-[#71dcff]" />
          <div>
            <CardTitle>Your player record</CardTitle>
            <p className="mt-1 text-xs leading-5 text-[#8f9bab]">
              Personal contact fields are copied from your profile. Enter the same playing details required for every roster member.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail icon={UserRound} label="Real name" value={profile.displayName} />
            <ProfileDetail icon={Mail} label="Email" value={profile.email} />
            <ProfileDetail icon={Phone} label="Phone" value={profile.phoneNumber} />
            <ProfileDetail icon={MessageCircle} label="Discord" value={profile.discordUsername} optional />
          </div>

          <div className="grid gap-4 border-t border-[#2c343e] pt-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Gamer tag" error={form.formState.errors.gamerTag?.message}>
              <Input placeholder="Fegoo" aria-invalid={Boolean(form.formState.errors.gamerTag)} {...form.register('gamerTag')} />
            </Field>
            <Field label="Game account ID" error={form.formState.errors.gameAccountId?.message}>
              <Input placeholder="VALORANT#1234" aria-invalid={Boolean(form.formState.errors.gameAccountId)} {...form.register('gameAccountId')} />
            </Field>
            <Field label="Roster role">
              <Controller name="rosterType" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CreateCaptainRosterPlayerDtoRosterType.STARTER}>Starter</SelectItem>
                    <SelectItem value={CreateCaptainRosterPlayerDtoRosterType.SUBSTITUTE}>Substitute</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Competitive rank" error={form.formState.errors.rank?.message}>
              <Input placeholder="Immortal 2" {...form.register('rank')} />
            </Field>
            <Field label="Country" error={form.formState.errors.country?.message}>
              <Input placeholder="EG" {...form.register('country')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {requestError && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Captain member was not saved</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">{requestError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
          {isSaving ? 'Creating Captain member...' : 'Add me to the roster'}
        </Button>
      </div>
    </form>
  )
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
  optional = false,
}: {
  icon: typeof UserRound
  label: string
  value?: string | null
  optional?: boolean
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#2c343e] bg-[#11161b] p-3">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#81909f]">
        <Icon className="h-3.5 w-3.5 text-[#71dcff]" /> {label}
      </p>
      <p className="mt-2 truncate text-sm font-bold text-[#e6eef5]">
        {value || (optional ? 'Not provided' : 'Required in profile')}
      </p>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs leading-5 text-[#ffafb5]" role="alert">{error}</p>}
    </div>
  )
}
