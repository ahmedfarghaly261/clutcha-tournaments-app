import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  CircleAlert,
  Gamepad2,
  Info,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Save,
  ShieldPlus,
  UserRound,
  X,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CreateCaptainRosterPlayerDtoRosterType } from '@/api/generated/captain'
import {
  captainTeamCreateSchema,
  captainTeamUpdateSchema,
} from '../schemas/captain-team.schema'
import {
  captainTeamDefaultValues,
  transformCaptainTeamToFormValues,
} from '../transformers/captain-team.transformer'
import type { CaptainProfile } from '../../profile/types/captain-profile.types'
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
  profile?: CaptainProfile
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
  profile,
  isSaving,
  onCancel,
  onSubmit,
  onSaved,
}: CaptainTeamFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const form = useForm<CaptainTeamFormValues>({
    resolver: zodResolver(mode === 'create' ? captainTeamCreateSchema : captainTeamUpdateSchema),
    defaultValues: captainTeamDefaultValues,
  })

  useEffect(() => {
    form.reset(team ? transformCaptainTeamToFormValues(team) : captainTeamDefaultValues)
  }, [form, team])

  const submitTeam = form.handleSubmit(async (values) => {
    setRequestError(null)

    try {
      const savedTeam = await onSubmit(values)
      form.reset(transformCaptainTeamToFormValues(savedTeam))
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

      {mode === 'create' && (
        <Card className="border-[#34505e] bg-[#151b21] shadow-[0_0_55px_rgba(82,205,244,0.06)]">
          <CardHeader>
            <UserRound className="h-5 w-5 text-[#71dcff]" />
            <div>
              <CardTitle>Your Captain roster member</CardTitle>
              <p className="mt-1 text-xs leading-5 text-[#8f9bab]">
                You will be added to the roster when the team is created. Identity and contact details come from your Captain profile.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProfileValue icon={UserRound} label="Real name" value={profile?.displayName} />
              <ProfileValue icon={Mail} label="Email" value={profile?.email} />
              <ProfileValue icon={Phone} label="Phone" value={profile?.phoneNumber} />
              <ProfileValue icon={MessageCircle} label="Discord" value={profile?.discordUsername} optional />
            </div>

            <div className="grid gap-4 border-t border-[#2c343e] pt-5 md:grid-cols-2 xl:grid-cols-3">
              <TeamField label="Your gamer tag" error={form.formState.errors.captainGamerTag?.message}>
                <Input
                  placeholder="Fegoo"
                  aria-invalid={Boolean(form.formState.errors.captainGamerTag)}
                  {...form.register('captainGamerTag')}
                />
              </TeamField>
              <TeamField label="Your game account ID" error={form.formState.errors.captainGameAccountId?.message}>
                <Input
                  placeholder="VALORANT#1234"
                  aria-invalid={Boolean(form.formState.errors.captainGameAccountId)}
                  {...form.register('captainGameAccountId')}
                />
              </TeamField>
              <TeamField label="Roster role">
                <Controller
                  name="captainRosterType"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CreateCaptainRosterPlayerDtoRosterType.STARTER}>Starter</SelectItem>
                        <SelectItem value={CreateCaptainRosterPlayerDtoRosterType.SUBSTITUTE}>Substitute</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </TeamField>
              <TeamField label="Competitive rank" error={form.formState.errors.captainRank?.message}>
                <Input placeholder="Immortal 2" {...form.register('captainRank')} />
              </TeamField>
              <TeamField label="Country" error={form.formState.errors.captainCountry?.message}>
                <Input placeholder="EG" {...form.register('captainCountry')} />
              </TeamField>
            </div>
          </CardContent>
        </Card>
      )}

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

function ProfileValue({
  icon: Icon,
  label,
  value,
  optional = false,
}: {
  icon: typeof Gamepad2
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
