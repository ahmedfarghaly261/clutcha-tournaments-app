import { useEffect, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { Controller, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  Gamepad2,
  Image,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from 'lucide-react'
import {
  CreateTournamentDtoFormat,
  CreateTournamentDtoMode,
  CreateTournamentDtoSeedingMethod,
  CreateTournamentDtoVisibility,
  type CreateTournamentDto,
  type TournamentResponseDto,
} from '@/api/generated/organizer-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CheckField, SelectField, TextAreaField, TextField } from '../components/TournamentFormFields'
import { TournamentCreationStepper } from '../components/TournamentCreationStepper'
import { useTournamentCreationService } from '../services/tournament-creation.service'
import type {
  TournamentCreationFormValues,
  TournamentCreationStep,
} from '../types/tournament-creation.types'

const gameOptions = [
  { value: 'valorant', label: 'Valorant' },
  { value: 'counter-strike-2', label: 'Counter-Strike 2' },
  { value: 'league-of-legends', label: 'League of Legends' },
  { value: 'dota-2', label: 'Dota 2' },
  { value: 'rocket-league', label: 'Rocket League' },
  { value: 'fortnite', label: 'Fortnite' },
]

const formatOptions = [
  { value: CreateTournamentDtoFormat.SINGLE_ELIMINATION, label: 'Single Elimination' },
  { value: CreateTournamentDtoFormat.DOUBLE_ELIMINATION, label: 'Double Elimination' },
  { value: CreateTournamentDtoFormat.ROUND_ROBIN, label: 'Round Robin' },
  { value: CreateTournamentDtoFormat.GROUPS_THEN_PLAYOFFS, label: 'Groups then Playoffs' },
  { value: CreateTournamentDtoFormat.SWISS, label: 'Swiss' },
  { value: CreateTournamentDtoFormat.BATTLE_ROYALE, label: 'Battle Royale' },
] as const

const modeOptions = [
  { value: CreateTournamentDtoMode.ONLINE, label: 'Online' },
  { value: CreateTournamentDtoMode.ONSITE, label: 'On-site' },
] as const

const visibilityOptions = [
  { value: CreateTournamentDtoVisibility.PUBLIC, label: 'Public' },
  { value: CreateTournamentDtoVisibility.UNLISTED, label: 'Unlisted' },
  { value: CreateTournamentDtoVisibility.PRIVATE, label: 'Private' },
] as const

const seedingOptions = [
  { value: CreateTournamentDtoSeedingMethod.MANUAL, label: 'Manual' },
  { value: CreateTournamentDtoSeedingMethod.RANDOM, label: 'Random' },
  { value: CreateTournamentDtoSeedingMethod.RANKED, label: 'Ranked' },
] as const

const inputRules = {
  requiredText: (label: string) => ({ required: `${label} is required.` }),
  number: (label: string, min: number) => ({
    required: `${label} is required.`,
    valueAsNumber: true,
    min: { value: min, message: `${label} must be at least ${min}.` },
  }),
}

const stepFields: Record<Exclude<TournamentCreationStep, 4>, FieldPath<TournamentCreationFormValues>[]> = {
  1: ['name', 'shortDescription', 'gameKey', 'mode', 'visibility', 'coverImage'],
  2: [
    'format',
    'seedingMethod',
    'minimumTeams',
    'maximumTeams',
    'minimumStarters',
    'maximumStarters',
    'maximumSubstitutes',
    'defaultBestOf',
    'finalBestOf',
    'allowedPlatforms',
    'minimumPlayerAge',
    'rules',
    'registrationOpensAt',
    'registrationClosesAt',
    'startsAt',
    'endsAt',
    'timezone',
  ],
  3: ['registrationFee', 'currency', 'prizePool', 'firstPlacePercentage', 'secondPlacePercentage', 'thirdPlacePercentage'],
}

function toLocalDateTimeInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function futureDate(days: number, hour = 18) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return toLocalDateTimeInput(date)
}

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

const defaultValues: TournamentCreationFormValues = {
  name: '',
  shortDescription: '',
  description: '',
  coverImage: null,
  gameKey: 'valorant',
  mode: CreateTournamentDtoMode.ONLINE,
  visibility: CreateTournamentDtoVisibility.PUBLIC,
  format: CreateTournamentDtoFormat.SINGLE_ELIMINATION,
  seedingMethod: CreateTournamentDtoSeedingMethod.MANUAL,
  minimumTeams: 8,
  maximumTeams: 16,
  minimumStarters: 5,
  maximumStarters: 5,
  maximumSubstitutes: 2,
  defaultBestOf: 1,
  finalBestOf: 3,
  thirdPlaceMatch: false,
  requiredGameAccountId: true,
  allowedRegion: 'MENA',
  allowedCountries: '',
  allowedPlatforms: ['PC'],
  minimumPlayerAge: 16,
  minimumRank: '',
  maximumRank: '',
  rules: 'Teams must follow the CLUTCHA competitive ruleset and organizer instructions.',
  registrationOpensAt: futureDate(1, 10),
  registrationClosesAt: futureDate(7, 20),
  startsAt: futureDate(9, 18),
  endsAt: futureDate(10, 23),
  timezone: 'Africa/Cairo',
  waitlistEnabled: false,
  maximumWaitlistSize: 8,
  manualApprovalRequired: true,
  registrationFee: 0,
  currency: 'EGP',
  prizePool: 0,
  firstPlacePercentage: 70,
  secondPlacePercentage: 30,
  thirdPlacePercentage: 0,
  refundPolicy: '',
  cancellationPolicy: '',
}

function cleanOptional(value: string) {
  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : undefined
}

function splitCountries(value: string) {
  return value
    .split(',')
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean)
}

function mapFormToDto(values: TournamentCreationFormValues): CreateTournamentDto {
  const prizeDistribution = values.prizePool > 0
    ? {
        firstPlacePercentage: values.firstPlacePercentage,
        secondPlacePercentage: values.secondPlacePercentage,
        thirdPlacePercentage: values.thirdPlacePercentage,
      }
    : undefined

  return {
    name: values.name.trim(),
    shortDescription: cleanOptional(values.shortDescription),
    description: cleanOptional(values.description),
    gameKey: values.gameKey,
    mode: values.mode,
    visibility: values.visibility,
    format: values.format,
    minimumTeams: values.minimumTeams,
    maximumTeams: values.maximumTeams,
    minimumStarters: values.minimumStarters,
    maximumStarters: values.maximumStarters,
    maximumSubstitutes: values.maximumSubstitutes,
    defaultBestOf: values.defaultBestOf,
    finalBestOf: values.finalBestOf,
    seedingMethod: values.seedingMethod,
    thirdPlaceMatch: values.thirdPlaceMatch,
    requiredGameAccountId: values.requiredGameAccountId,
    allowedRegion: cleanOptional(values.allowedRegion),
    allowedCountries: splitCountries(values.allowedCountries),
    allowedPlatforms: values.allowedPlatforms,
    minimumPlayerAge: values.minimumPlayerAge,
    minimumRank: cleanOptional(values.minimumRank),
    maximumRank: cleanOptional(values.maximumRank),
    registrationFee: values.registrationFee,
    currency: values.currency.trim().toUpperCase(),
    prizePool: values.prizePool,
    prizeDistribution,
    refundPolicy: cleanOptional(values.refundPolicy),
    cancellationPolicy: cleanOptional(values.cancellationPolicy),
    rules: values.rules.trim(),
    registrationOpensAt: new Date(values.registrationOpensAt).toISOString(),
    registrationClosesAt: new Date(values.registrationClosesAt).toISOString(),
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    timezone: values.timezone.trim(),
    waitlistEnabled: values.waitlistEnabled,
    maximumWaitlistSize: values.waitlistEnabled ? values.maximumWaitlistSize : undefined,
    manualApprovalRequired: values.manualApprovalRequired,
  }
}

function getRequestErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    return 'Could not create the tournament draft. Please try again.'
  }

  const data: unknown = error.response?.data
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }

  return 'Could not create the tournament draft. Please check the details and try again.'
}

type SectionCardProps = {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

function SectionCard({ title, icon, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <span className="text-[#d99fff]">{icon}</span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SummaryValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#918694]">{label}</p>
      <div className="mt-1 text-sm font-bold text-[#eee8f1]">{children}</div>
    </div>
  )
}

function formatLabel(value: string) {
  return value.toLowerCase().split('_').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ')
}

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value))
}

export function CreateTournamentPage() {
  const [currentStep, setCurrentStep] = useState<TournamentCreationStep>(1)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [createdTournament, setCreatedTournament] = useState<TournamentResponseDto | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [coverUploadFailed, setCoverUploadFailed] = useState(false)
  const { createDraft, uploadCover, isCreating } = useTournamentCreationService()
  const {
    register,
    handleSubmit,
    trigger,
    control,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<TournamentCreationFormValues>({ defaultValues, mode: 'onBlur' })

  const values = useWatch({ control, defaultValue: defaultValues }) as TournamentCreationFormValues

  useEffect(
    () => () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    },
    [coverPreviewUrl],
  )

  const validateStep = async (step: Exclude<TournamentCreationStep, 4>) => {
    const fieldsValid = await trigger(stepFields[step])
    if (!fieldsValid) return false

    const current = getValues()
    if (step === 2) {
      let valid = true

      if (current.maximumTeams < current.minimumTeams) {
        setError('maximumTeams', { message: 'Maximum teams cannot be below minimum teams.' })
        valid = false
      }
      if (current.maximumStarters < current.minimumStarters) {
        setError('maximumStarters', { message: 'Maximum starters cannot be below minimum starters.' })
        valid = false
      }
      if (new Date(current.registrationClosesAt) <= new Date(current.registrationOpensAt)) {
        setError('registrationClosesAt', { message: 'Registration must close after it opens.' })
        valid = false
      }
      if (new Date(current.startsAt) <= new Date(current.registrationClosesAt)) {
        setError('startsAt', { message: 'Tournament must start after registration closes.' })
        valid = false
      }
      if (new Date(current.endsAt) <= new Date(current.startsAt)) {
        setError('endsAt', { message: 'Tournament end must be after its start.' })
        valid = false
      }

      return valid
    }

    if (step === 3 && current.prizePool > 0) {
      const total = current.firstPlacePercentage + current.secondPlacePercentage + current.thirdPlacePercentage
      if (total !== 100) {
        setError('firstPlacePercentage', { message: 'Prize distribution percentages must total 100%.' })
        return false
      }
    }

    return true
  }

  const goForward = async () => {
    if (currentStep === 4) return
    const valid = await validateStep(currentStep)
    if (valid) {
      setCurrentStep((currentStep + 1) as TournamentCreationStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const selectStep = async (step: TournamentCreationStep) => {
    if (step <= currentStep) {
      setCurrentStep(step)
      return
    }

    let nextStep = currentStep
    while (nextStep < step && nextStep < 4) {
      const valid = await validateStep(nextStep as Exclude<TournamentCreationStep, 4>)
      if (!valid) return
      nextStep = (nextStep + 1) as TournamentCreationStep
    }
    setCurrentStep(step)
  }

  const submitDraft = handleSubmit(async (formValues) => {
    setRequestError(null)
    const firstStepValid = await validateStep(1)
    const secondStepValid = await validateStep(2)
    const thirdStepValid = await validateStep(3)
    if (!firstStepValid || !secondStepValid || !thirdStepValid) return
    if (!formValues.coverImage) {
      setError('coverImage', { message: 'Select a tournament cover image.' })
      setCurrentStep(1)
      return
    }

    try {
      const tournament = await createDraft({ data: mapFormToDto(formValues) })

      try {
        const tournamentWithCover = await uploadCover({
          tournamentId: tournament.id,
          data: { file: formValues.coverImage },
        })
        setCreatedTournament(tournamentWithCover)
      } catch {
        setCoverUploadFailed(true)
        setCreatedTournament(tournament)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setRequestError(getRequestErrorMessage(error))
    }
  })

  if (createdTournament) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl items-center justify-center">
        <Card className="w-full border-[#533d61] text-center shadow-[0_20px_80px_rgba(170,59,255,0.12)]">
          <CardContent className="p-8 sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d7a5ff] text-[#24102f]">
            <Check className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#d7a5ff]">Draft created</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{createdTournament.name}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#b9aebd]">
            Your tournament is saved as a draft. Configure its {createdTournament.mode === 'ONLINE' ? 'online lobby' : 'venue and gaming rooms'} before running publication validation.
          </p>
          {coverUploadFailed && (
            <Alert className="mx-auto mt-5 max-w-xl border-[#7e633e] bg-[#382c19] text-left text-[#ffe0a8]">
              <AlertTitle>Draft created, but cover upload failed</AlertTitle>
              <AlertDescription className="text-[#ffe0a8]">
                The tournament is safe in your drafts. You can upload its cover again when editing the draft.
              </AlertDescription>
            </Alert>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="text-xs font-black uppercase tracking-[0.08em]"
              type="button"
              onClick={() => {
                reset(defaultValues)
                setCreatedTournament(null)
                setCoverUploadFailed(false)
                setCoverPreviewUrl(null)
                setCurrentStep(1)
              }}
            >
              Create another
            </Button>
            <Button render={<Link to="/organizer" />} size="lg" className="text-xs font-black uppercase tracking-[0.08em]">
              Return to dashboard
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form className="mx-auto max-w-6xl pb-8" onSubmit={submitDraft} noValidate>
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament configuration</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7] sm:text-4xl">
          {currentStep === 1 && 'Build Your Tournament'}
          {currentStep === 2 && 'Format & Rules'}
          {currentStep === 3 && 'Prizes & Payments'}
          {currentStep === 4 && 'Review & Create Draft'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99ead]">
          {currentStep === 1 && 'Start with the identity, game, and operating mode teams will see.'}
          {currentStep === 2 && 'Define the bracket, capacity, eligibility, schedule, and competitive rules.'}
          {currentStep === 3 && 'Set entry pricing and tell teams exactly how the prize pool is distributed.'}
          {currentStep === 4 && 'Confirm every detail before creating the organizer-owned tournament draft.'}
        </p>
      </header>

      <div className="relative z-0 mb-8 rounded-xl border border-[#332e36] bg-[#171519] px-3 py-5 sm:px-10">
        <TournamentCreationStepper currentStep={currentStep} onStepSelect={(step) => void selectStep(step)} />
      </div>

      {currentStep === 1 && (
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <SectionCard title="Identity & Branding" icon={<Sparkles className="h-5 w-5" />}>
            <div className="space-y-5">
              <TextField
                id="tournament-name"
                label="Tournament name"
                placeholder="CLUTCHA Valorant Cairo Cup"
                maxLength={150}
                registration={register('name', { required: 'Tournament name is required.', minLength: { value: 3, message: 'Use at least 3 characters.' } })}
                error={errors.name}
              />
              <TextAreaField
                id="tournament-short-description"
                label="Short description"
                placeholder="A competitive tournament for the best teams in the region."
                maxLength={300}
                className="min-h-24"
                registration={register('shortDescription', { required: 'A short description is required.', maxLength: { value: 300, message: 'Keep this under 300 characters.' } })}
                error={errors.shortDescription}
              />
              <TextAreaField
                id="tournament-description"
                label="Full description (optional)"
                placeholder="Explain the event experience, audience, and what makes this tournament special."
                maxLength={5000}
                registration={register('description')}
                error={errors.description}
              />
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Game Details" icon={<Gamepad2 className="h-5 w-5 text-[#55ddff]" />}>
              <div className="space-y-5">
                <SelectField id="tournament-game" label="Title" name="gameKey" control={control} options={gameOptions} rules={inputRules.requiredText('Game')} />
                <SelectField id="tournament-mode" label="Mode" name="mode" control={control} options={modeOptions} rules={inputRules.requiredText('Mode')} />
                <SelectField id="tournament-visibility" label="Visibility" name="visibility" control={control} options={visibilityOptions} rules={inputRules.requiredText('Visibility')} />
              </div>
            </SectionCard>
            <SectionCard title="Cover Image" icon={<Image className="h-5 w-5" />}>
              <Controller
                name="coverImage"
                control={control}
                rules={{
                  validate: (file) => {
                    if (!file) return 'Select a tournament cover image.'
                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Use a JPEG, PNG, or WebP image.'
                    return file.size <= 5 * 1024 * 1024 || 'Cover image must be 5MB or smaller.'
                  },
                }}
                render={({ field, fieldState }) => (
                  <div>
                    <Label className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor="tournament-cover">
                      Upload cover image
                    </Label>
                    <Input
                      id="tournament-cover"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="cursor-pointer py-2 file:mr-3 file:rounded file:border-0 file:bg-[#d7a5ff] file:px-3 file:py-1 file:text-xs file:font-black file:text-[#2a0b3f]"
                      aria-invalid={Boolean(fieldState.error)}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        field.onChange(file)
                        setCoverPreviewUrl(file ? URL.createObjectURL(file) : null)
                      }}
                    />
                    {fieldState.error ? (
                      <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{fieldState.error.message}</p>
                    ) : (
                      <p className="mt-1.5 text-xs leading-5 text-[#8f8495]">JPEG, PNG, or WebP. Maximum 5MB.</p>
                    )}
                  </div>
                )}
              />
              <div className="mt-4 h-32 overflow-hidden rounded-md border border-dashed border-[#514758] bg-[#121013]">
                {coverPreviewUrl ? (
                  <img className="h-full w-full object-cover" src={coverPreviewUrl} alt="Tournament cover preview" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-[#776c7c]">
                    <Image className="h-6 w-6" aria-hidden="true" />
                    <span className="mt-2 text-xs font-bold">Cover preview</span>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Bracket Format" icon={<Trophy className="h-5 w-5" />}>
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField id="tournament-format" label="Format" name="format" control={control} options={formatOptions} rules={inputRules.requiredText('Format')} />
                <SelectField id="tournament-seeding" label="Seeding" name="seedingMethod" control={control} options={seedingOptions} />
                <TextField id="minimum-teams" label="Minimum teams" type="number" registration={register('minimumTeams', inputRules.number('Minimum teams', 2))} error={errors.minimumTeams} />
                <TextField id="maximum-teams" label="Maximum teams" type="number" registration={register('maximumTeams', inputRules.number('Maximum teams', 2))} error={errors.maximumTeams} />
                <TextField id="default-best-of" label="Default best of" type="number" max={15} registration={register('defaultBestOf', inputRules.number('Default best of', 1))} error={errors.defaultBestOf} />
                <TextField id="final-best-of" label="Final best of" type="number" max={15} registration={register('finalBestOf', inputRules.number('Final best of', 1))} error={errors.finalBestOf} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <CheckField id="third-place" label="Third-place match" name="thirdPlaceMatch" control={control} />
                <CheckField id="game-account" label="Require game account ID" name="requiredGameAccountId" control={control} />
              </div>
            </SectionCard>

            <SectionCard title="Roster & Platform" icon={<UsersRound className="h-5 w-5 text-[#55ddff]" />}>
              <div className="grid gap-5 sm:grid-cols-3">
                <TextField id="minimum-starters" label="Min. starters" type="number" registration={register('minimumStarters', inputRules.number('Minimum starters', 1))} error={errors.minimumStarters} />
                <TextField id="maximum-starters" label="Max. starters" type="number" registration={register('maximumStarters', inputRules.number('Maximum starters', 1))} error={errors.maximumStarters} />
                <TextField id="maximum-subs" label="Max. substitutes" type="number" registration={register('maximumSubstitutes', inputRules.number('Maximum substitutes', 0))} error={errors.maximumSubstitutes} />
              </div>
              <fieldset className="mt-5">
                <legend className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]">Platforms</legend>
                <Controller
                  name="allowedPlatforms"
                  control={control}
                  rules={{ validate: (selected) => selected.length > 0 || 'Select at least one platform.' }}
                  render={({ field, fieldState }) => (
                    <>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {['PC', 'PlayStation', 'Xbox', 'Mobile'].map((platform) => {
                          const isChecked = field.value.includes(platform)
                          return (
                            <Label
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-md border bg-[#141215] p-3 text-xs font-bold text-[#ddd4e1]',
                                isChecked ? 'border-[#c477ff] bg-[#c477ff]/10' : 'border-[#49404e]',
                              )}
                              htmlFor={`platform-${platform}`}
                              key={platform}
                            >
                              <Checkbox
                                id={`platform-${platform}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  field.onChange(
                                    checked
                                      ? [...field.value, platform]
                                      : field.value.filter((value) => value !== platform),
                                  )
                                }}
                              />
                              {platform}
                            </Label>
                          )
                        })}
                      </div>
                      {fieldState.error && <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </fieldset>
            </SectionCard>
          </div>

          <SectionCard title="Schedule" icon={<CalendarDays className="h-5 w-5 text-[#48efbf]" />}>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <TextField id="registration-opens" label="Registration opens" type="datetime-local" registration={register('registrationOpensAt', inputRules.requiredText('Registration opening date'))} error={errors.registrationOpensAt} />
              <TextField id="registration-closes" label="Registration closes" type="datetime-local" registration={register('registrationClosesAt', inputRules.requiredText('Registration closing date'))} error={errors.registrationClosesAt} />
              <TextField id="tournament-starts" label="Tournament starts" type="datetime-local" registration={register('startsAt', inputRules.requiredText('Tournament start date'))} error={errors.startsAt} />
              <TextField id="tournament-ends" label="Tournament ends" type="datetime-local" registration={register('endsAt', inputRules.requiredText('Tournament end date'))} error={errors.endsAt} />
            </div>
            <div className="mt-5 max-w-sm">
              <TextField id="tournament-timezone" label="Timezone" placeholder="Africa/Cairo" registration={register('timezone', { required: 'Timezone is required.', validate: (timezone) => isValidTimeZone(timezone) || 'Enter a valid IANA timezone, such as Africa/Cairo.' })} error={errors.timezone} />
            </div>
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionCard title="Eligibility" icon={<ShieldCheck className="h-5 w-5 text-[#ff9d92]" />}>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="allowed-region" label="Region" placeholder="MENA" registration={register('allowedRegion')} error={errors.allowedRegion} />
                <TextField id="minimum-age" label="Minimum age" type="number" min={0} max={100} registration={register('minimumPlayerAge', inputRules.number('Minimum age', 0))} error={errors.minimumPlayerAge} />
                <TextField id="minimum-rank" label="Minimum rank (optional)" placeholder="Gold" registration={register('minimumRank')} error={errors.minimumRank} />
                <TextField id="maximum-rank" label="Maximum rank (optional)" placeholder="Immortal" registration={register('maximumRank')} error={errors.maximumRank} />
              </div>
              <div className="mt-5">
                <TextField id="allowed-countries" label="Countries (optional)" placeholder="EG, SA, AE" hint="Use two-letter country codes separated by commas." registration={register('allowedCountries')} error={errors.allowedCountries} />
              </div>
            </SectionCard>

            <SectionCard title="Rules & Registration" icon={<Save className="h-5 w-5" />}>
              <TextAreaField id="tournament-rules" label="Tournament rules" maxLength={20000} registration={register('rules', { required: 'Tournament rules are required.', minLength: { value: 10, message: 'Rules must contain at least 10 characters.' } })} error={errors.rules} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <CheckField id="manual-approval" label="Manual team approval" description="Every team waits for organizer approval after check-in." name="manualApprovalRequired" control={control} />
                <CheckField id="waitlist-enabled" label="Enable waitlist" description="Allow extra teams to wait for an available slot." name="waitlistEnabled" control={control} />
              </div>
              {values.waitlistEnabled && (
                <div className="mt-5 max-w-xs">
                  <TextField id="waitlist-size" label="Maximum waitlist size" type="number" registration={register('maximumWaitlistSize', inputRules.number('Waitlist size', 1))} error={errors.maximumWaitlistSize} />
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Entry & Prize Pool" icon={<Banknote className="h-5 w-5" />}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="registration-fee" label="Team registration fee" type="number" min={0} step="0.01" registration={register('registrationFee', inputRules.number('Registration fee', 0))} error={errors.registrationFee} />
              <TextField id="currency" label="Currency" maxLength={3} placeholder="EGP" registration={register('currency', { required: 'Currency is required.', pattern: { value: /^[A-Za-z]{3}$/, message: 'Use a three-letter currency code.' } })} error={errors.currency} />
              <TextField id="prize-pool" label="Total prize pool" type="number" min={0} step="0.01" registration={register('prizePool', inputRules.number('Prize pool', 0))} error={errors.prizePool} className="sm:col-span-2" />
            </div>
            <Alert className="mt-5 border-[#45384c] bg-[#c477ff]/6 text-[#bbaec1]">
              <AlertTitle className="text-[#e3d6e8]">Direct organizer payment</AlertTitle>
              <AlertDescription>
                CLUTCHA does not process tournament payments. Captains contact the organizer directly, and every checked-in team still requires manual organizer approval.
              </AlertDescription>
            </Alert>
          </SectionCard>

          <SectionCard title="Prize Distribution" icon={<Trophy className="h-5 w-5 text-[#55ddff]" />}>
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField id="first-prize" label="1st place %" type="number" min={0} max={100} registration={register('firstPlacePercentage', inputRules.number('First-place percentage', 0))} error={errors.firstPlacePercentage} />
              <TextField id="second-prize" label="2nd place %" type="number" min={0} max={100} registration={register('secondPlacePercentage', inputRules.number('Second-place percentage', 0))} error={errors.secondPlacePercentage} />
              <TextField id="third-prize" label="3rd place %" type="number" min={0} max={100} registration={register('thirdPlacePercentage', inputRules.number('Third-place percentage', 0))} error={errors.thirdPlacePercentage} />
            </div>
            <p className="mt-4 text-xs text-[#95899a]">Distribution is validated to total 100% whenever the prize pool is greater than zero.</p>
          </SectionCard>

          <SectionCard title="Policies" icon={<ShieldCheck className="h-5 w-5 text-[#ff9d92]" />} className="lg:col-span-2">
            <div className="grid gap-5 md:grid-cols-2">
              <TextAreaField id="refund-policy" label="Refund policy (optional)" placeholder="Explain when a registered team can receive a refund." maxLength={2000} registration={register('refundPolicy')} error={errors.refundPolicy} />
              <TextAreaField id="cancellation-policy" label="Cancellation policy (optional)" placeholder="Explain the conditions under which the event may be cancelled." maxLength={2000} registration={register('cancellationPolicy')} error={errors.cancellationPolicy} />
            </div>
          </SectionCard>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <SectionCard title="Identity & Branding" icon={<Sparkles className="h-5 w-5" />}>
              {coverPreviewUrl && <img className="mb-5 h-40 w-full rounded-md border border-[#49404e] object-cover opacity-80" src={coverPreviewUrl} alt="Tournament cover" />}
              <div className="grid gap-5 sm:grid-cols-2">
                <SummaryValue label="Tournament name">{values.name}</SummaryValue>
                <SummaryValue label="Visibility">{formatLabel(values.visibility)}</SummaryValue>
                <SummaryValue label="Short description"><span className="font-medium text-[#c8bdcc]">{values.shortDescription}</span></SummaryValue>
              </div>
            </SectionCard>
            <SectionCard title="Game Details" icon={<Gamepad2 className="h-5 w-5 text-[#55ddff]" />}>
              <div className="grid gap-5">
                <SummaryValue label="Game">{gameOptions.find((game) => game.value === values.gameKey)?.label ?? values.gameKey}</SummaryValue>
                <SummaryValue label="Mode">{formatLabel(values.mode)}</SummaryValue>
                <SummaryValue label="Bracket">{formatLabel(values.format)}</SummaryValue>
                <SummaryValue label="Platforms">{values.allowedPlatforms.join(', ')}</SummaryValue>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <SectionCard title="Schedule & Capacity" icon={<CalendarDays className="h-5 w-5 text-[#48efbf]" />}>
              <div className="grid gap-5">
                <SummaryValue label="Registration">{formatDate(values.registrationOpensAt, values.timezone)} – {formatDate(values.registrationClosesAt, values.timezone)}</SummaryValue>
                <SummaryValue label="Tournament start">{formatDate(values.startsAt, values.timezone)}</SummaryValue>
                <SummaryValue label="Team capacity">{values.minimumTeams} minimum / {values.maximumTeams} maximum</SummaryValue>
              </div>
            </SectionCard>
            <SectionCard title="Prize Pool" icon={<Banknote className="h-5 w-5" />}>
              <div className="grid gap-5">
                <SummaryValue label="Registration fee">{values.registrationFee.toLocaleString()} {values.currency.toUpperCase()}</SummaryValue>
                <SummaryValue label="Total amount"><span className="text-[#deb1ff]">{values.prizePool.toLocaleString()} {values.currency.toUpperCase()}</span></SummaryValue>
                <SummaryValue label="Distribution">1st {values.firstPlacePercentage}% · 2nd {values.secondPlacePercentage}% · 3rd {values.thirdPlacePercentage}%</SummaryValue>
              </div>
            </SectionCard>
            <SectionCard title="Approval" icon={<ShieldCheck className="h-5 w-5 text-[#ff9d92]" />}>
              <div className="grid gap-5">
                <SummaryValue label="Team approval">{values.manualApprovalRequired ? 'Organizer approval required' : 'Automatic approval'}</SummaryValue>
                <SummaryValue label="Waitlist">{values.waitlistEnabled ? `Enabled · ${values.maximumWaitlistSize} teams` : 'Disabled'}</SummaryValue>
                <SummaryValue label="Game account">{values.requiredGameAccountId ? 'Required' : 'Not required'}</SummaryValue>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Rules & Eligibility" icon={<ShieldCheck className="h-5 w-5" />}>
            <div className="grid gap-5 md:grid-cols-4">
              <SummaryValue label="Region">{values.allowedRegion || 'Any region'}</SummaryValue>
              <SummaryValue label="Countries">{values.allowedCountries || 'Any country'}</SummaryValue>
              <SummaryValue label="Minimum age">{values.minimumPlayerAge}+</SummaryValue>
              <SummaryValue label="Rank">{values.minimumRank || 'Any'}{values.maximumRank ? ` to ${values.maximumRank}` : ''}</SummaryValue>
            </div>
            <p className="mt-5 whitespace-pre-wrap rounded-md border border-[#3d3741] bg-[#141215] p-4 text-sm leading-6 text-[#c8bdcc]">{values.rules}</p>
          </SectionCard>

          <Alert className="border-[#5a4663] bg-[#d7a5ff]/6 text-[#cbbdd0]">
            <AlertTitle className="text-[#f0ddff]">What happens next?</AlertTitle>
            <AlertDescription>
              This creates a private organizer-owned draft. You can then add the required {values.mode === CreateTournamentDtoMode.ONLINE ? 'online configuration' : 'venue and gaming-room configuration'}, fix any publication-readiness issues, and publish it.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {requestError && (
        <Alert className="mt-5 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
          <AlertTitle>Draft creation failed</AlertTitle>
          <AlertDescription className="text-[#ffcbc7]">{requestError}</AlertDescription>
        </Alert>
      )}

      <footer className="sticky bottom-3 z-20 mt-8 flex flex-col-reverse justify-between gap-3 rounded-xl border border-[#413846] bg-[#171519]/95 p-4 shadow-[0_14px_50px_rgba(0,0,0,0.4)] backdrop-blur sm:flex-row sm:items-center">
        <Button
          variant="outline"
          size="lg"
          className={cn('text-xs font-black uppercase tracking-[0.08em]', currentStep === 1 && 'invisible')}
          type="button"
          onClick={() => setCurrentStep((currentStep - 1) as TournamentCreationStep)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>

        {currentStep < 4 ? (
          <Button size="lg" className="text-xs font-black uppercase tracking-[0.08em]" type="button" onClick={() => void goForward()}>
            Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button size="lg" className="text-xs font-black uppercase tracking-[0.08em] disabled:cursor-wait" type="submit" disabled={isCreating}>
            <Rocket className="h-4 w-4" aria-hidden="true" />
            {isCreating ? 'Creating draft…' : 'Create tournament draft'}
          </Button>
        )}
      </footer>
    </form>
  )
}
