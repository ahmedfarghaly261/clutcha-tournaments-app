import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { CircleAlert, Info, LoaderCircle, Save, ShieldPlus, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { captainTeamSchema } from '../schemas/captain-team.schema'
import {
  captainTeamDefaultValues,
  mapCaptainTeamToFormValues,
} from '../services/captain-team.service'
import type {
  CaptainTeam,
  CaptainTeamFormMode,
  CaptainTeamFormValues,
} from '../types/captain-team.types'

const gameOptions = [
  { value: 'valorant', label: 'Valorant' },
  { value: 'league-of-legends', label: 'League of Legends' },
  { value: 'counter-strike-2', label: 'Counter-Strike 2' },
  { value: 'rocket-league', label: 'Rocket League' },
  { value: 'ea-sports-fc', label: 'EA Sports FC' },
  { value: 'pubg', label: 'PUBG' },
]

type CaptainTeamFormProps = {
  mode: CaptainTeamFormMode
  team?: CaptainTeam
  isSaving: boolean
  onCancel?: () => void
  onSubmit: (values: CaptainTeamFormValues) => Promise<CaptainTeam>
  onSaved: () => void
}

function getTeamErrorMessage(error: unknown, mode: CaptainTeamFormMode): string {
  if (!isAxiosError(error)) return 'Could not save the team. Please try again.'

  if (error.response?.status === 409) {
    return 'This Captain already owns a team, or another team is using that identity.'
  }

  if (error.response?.status === 400) {
    return 'Some team information is invalid. Check each field and try again.'
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return `You are not allowed to ${mode === 'create' ? 'register' : 'update'} this team.`
  }

  return 'Could not save the team. Please try again.'
}

export function CaptainTeamForm({
  mode,
  team,
  isSaving,
  onCancel,
  onSubmit,
  onSaved,
}: CaptainTeamFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const form = useForm<CaptainTeamFormValues>({
    resolver: zodResolver(captainTeamSchema),
    defaultValues: captainTeamDefaultValues,
  })

  useEffect(() => {
    form.reset(team ? mapCaptainTeamToFormValues(team) : captainTeamDefaultValues)
  }, [form, team])

  const submitTeam = form.handleSubmit(async (values) => {
    setRequestError(null)

    try {
      const savedTeam = await onSubmit(values)
      form.reset(mapCaptainTeamToFormValues(savedTeam))
      onSaved()
    } catch (error) {
      setRequestError(getTeamErrorMessage(error, mode))
    }
  })

  return (
    <form className="space-y-6" onSubmit={submitTeam} noValidate>
      {mode === 'create' && (
        <Alert className="border-[#315363] bg-[#13262f] text-[#a7eaff]">
          <Info className="h-5 w-5" />
          <AlertTitle>One team per Captain</AlertTitle>
          <AlertDescription className="text-[#a5cbd7]">
            CLUTCHA will connect this team to your authenticated Captain account and activate it immediately. Ownership cannot be transferred from this form.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-[#2c343e] bg-[#15191f]">
        <CardHeader>
          {mode === 'create' ? <ShieldPlus className="h-5 w-5 text-[#71dcff]" /> : <Save className="h-5 w-5 text-[#71dcff]" />}
          <CardTitle>{mode === 'create' ? 'Register your team' : 'Edit team details'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TeamField label="Team name" error={form.formState.errors.name?.message}>
            <Input
              placeholder="Cairo Titans"
              autoComplete="organization"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
          </TeamField>

          <TeamField label="Primary game" error={form.formState.errors.gameKey?.message}>
            <Controller
              name="gameKey"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value ?? '')}>
                  <SelectTrigger aria-invalid={Boolean(form.formState.errors.gameKey)}>
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </TeamField>

          <TeamField label="Region" hint="Optional competitive region, for example MENA.">
            <Input placeholder="MENA" {...form.register('region')} />
          </TeamField>

          <TeamField
            label="Discord server URL"
            hint="Optional private HTTPS invite used for team coordination."
            error={form.formState.errors.discordServerUrl?.message}
          >
            <Input
              type="url"
              placeholder="https://discord.gg/cairo-titans"
              aria-invalid={Boolean(form.formState.errors.discordServerUrl)}
              {...form.register('discordServerUrl')}
            />
          </TeamField>

          <div className="md:col-span-2">
            <TeamField label="Team description" error={form.formState.errors.description?.message}>
              <Textarea
                className="min-h-32"
                placeholder="Tell organizers what your team plays and where it competes."
                aria-invalid={Boolean(form.formState.errors.description)}
                {...form.register('description')}
              />
            </TeamField>
          </div>
        </CardContent>
      </Card>

      {requestError && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Team was not saved</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">{requestError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        {onCancel && (
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
            <X /> Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSaving || (mode === 'edit' && !form.formState.isDirty)}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : mode === 'create' ? <ShieldPlus /> : <Save />}
          {isSaving
            ? mode === 'create' ? 'Registering team...' : 'Saving team...'
            : mode === 'create' ? 'Register team' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function TeamField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs leading-5 text-[#ffafb5]" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[#8492a2]">{hint}</p>
      ) : null}
    </div>
  )
}
