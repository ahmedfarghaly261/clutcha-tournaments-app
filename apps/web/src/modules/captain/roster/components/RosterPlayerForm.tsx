import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { CircleAlert, LoaderCircle, Save, UserPlus, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateRosterPlayerDtoRosterType } from '@/api/generated/captain'
import { captainRosterPlayerSchema } from '../schemas/captain-roster.schema'
import {
  rosterPlayerDefaultValues,
  transformRosterPlayerToFormValues,
} from '../transformers/captain-roster.transformer'
import type {
  RosterEditorMode,
  RosterPlayer,
  RosterPlayerFormValues,
} from '../types/captain-roster.types'

type RosterPlayerFormProps = {
  mode: RosterEditorMode
  player?: RosterPlayer
  isSaving: boolean
  onCancel: () => void
  onSubmit: (values: RosterPlayerFormValues) => Promise<RosterPlayer>
  onSaved: () => void
}

function getRosterError(error: unknown): string {
  if (!isAxiosError(error)) return 'Could not save this roster player.'
  if (error.response?.status === 409) return 'A player with this game account ID already exists on your team.'
  if (error.response?.status === 400) return 'Some player information is invalid. Check the fields and try again.'
  if (error.response?.status === 404) return 'Create your Captain team before adding roster players.'
  return 'Could not save this roster player. Please try again.'
}

export function RosterPlayerForm({
  mode,
  player,
  isSaving,
  onCancel,
  onSubmit,
  onSaved,
}: RosterPlayerFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const form = useForm<RosterPlayerFormValues>({
    resolver: zodResolver(captainRosterPlayerSchema),
    defaultValues: rosterPlayerDefaultValues,
  })

  useEffect(() => {
    form.reset(player ? transformRosterPlayerToFormValues(player) : rosterPlayerDefaultValues)
  }, [form, player])

  const submit = form.handleSubmit(async (values) => {
    setRequestError(null)
    try {
      await onSubmit(values)
      onSaved()
    } catch (error) {
      setRequestError(getRosterError(error))
    }
  })

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <Card className="border-[#34505e] bg-[#151b21] shadow-[0_0_55px_rgba(82,205,244,0.06)]">
        <CardHeader>
          {mode === 'create' ? <UserPlus className="h-5 w-5 text-[#71dcff]" /> : <Save className="h-5 w-5 text-[#71dcff]" />}
          <div>
            <CardTitle>{mode === 'create' ? 'Add roster player' : `Edit ${player?.gamerTag ?? 'player'}`}</CardTitle>
            <p className="mt-1 text-xs text-[#8f9bab]">
              {player?.isCaptain
                ? 'Your identity and contact fields are managed from the Captain profile.'
                : 'Roster players are managed records and do not receive CLUTCHA login accounts.'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Gamer tag" error={form.formState.errors.gamerTag?.message}>
            <Input placeholder="Fegoo" aria-invalid={Boolean(form.formState.errors.gamerTag)} {...form.register('gamerTag')} />
          </Field>
          <Field label="Real name" hint="Optional private identity.">
            <Input readOnly={player?.isCaptain} placeholder="Ahmed Farghaly" {...form.register('realName')} />
          </Field>
          <Field label="Roster role">
            <Controller name="rosterType" control={form.control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CreateRosterPlayerDtoRosterType.STARTER}>Starter</SelectItem>
                  <SelectItem value={CreateRosterPlayerDtoRosterType.SUBSTITUTE}>Substitute</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Game account ID" error={form.formState.errors.gameAccountId?.message}>
            <Input placeholder="VALORANT#1234" aria-invalid={Boolean(form.formState.errors.gameAccountId)} {...form.register('gameAccountId')} />
          </Field>
          <Field label="Phone number" hint="Required private contact in international format." error={form.formState.errors.phoneNumber?.message}>
            <Input readOnly={player?.isCaptain} inputMode="tel" placeholder="+201001234567" aria-invalid={Boolean(form.formState.errors.phoneNumber)} {...form.register('phoneNumber')} />
          </Field>
          <Field label="Email" hint="Optional private contact." error={form.formState.errors.email?.message}>
            <Input readOnly={player?.isCaptain} type="email" placeholder="player@example.com" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          </Field>
          <Field label="Discord username" error={form.formState.errors.discordUsername?.message}>
            <Input readOnly={player?.isCaptain} placeholder="player.username" {...form.register('discordUsername')} />
          </Field>
          <Field label="Competitive rank" error={form.formState.errors.rank?.message}>
            <Input placeholder="Immortal 2" {...form.register('rank')} />
          </Field>
          <Field label="Country" error={form.formState.errors.country?.message}>
            <Input placeholder="EG" {...form.register('country')} />
          </Field>
        </CardContent>
      </Card>

      {requestError && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Player was not saved</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">{requestError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}><X /> Cancel</Button>
        <Button type="submit" disabled={isSaving || (mode === 'edit' && !form.formState.isDirty)}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : mode === 'create' ? <UserPlus /> : <Save />}
          {isSaving ? 'Saving player...' : mode === 'create' ? 'Add player' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs leading-5 text-[#ffafb5]" role="alert">{error}</p> : hint ? <p className="text-xs leading-5 text-[#8492a2]">{hint}</p> : null}
    </div>
  )
}
