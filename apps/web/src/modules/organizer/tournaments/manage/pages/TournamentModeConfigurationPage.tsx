import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleHelp,
  Globe2,
  MapPin,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import type {
  OnlineConfigurationResponseDto,
  UpsertOnlineConfigurationDto,
  UpsertVenueDto,
  VenueResponseDto,
} from '@/api/generated/organizer-tournaments'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useOrganizerTournamentDetailsService } from '../../details/services/organizer-tournament-details.service'
import { TournamentManagementNav } from '../components/TournamentManagementNav'
import { useTournamentModeConfigurationMutations } from '../mutations/tournament-mode-configuration.mutations'
import { useTournamentModeConfigurationService } from '../services/tournament-mode-configuration.service'
import type {
  TournamentOnlineConfigurationFormValues,
  TournamentVenueConfigurationFormValues,
} from '../types/tournament-management.types'

const emptyOnlineValues: TournamentOnlineConfigurationFormValues = {
  serverRegion: '',
  publicInstructions: '',
  connectionRules: '',
  evidenceRequired: false,
  screenshotRequirements: '',
  resultSubmissionDeadlineMinutes: '',
  discordServerUrl: '',
  captainSupportChannel: '',
  matchReportingChannel: '',
  lobbyInstructions: '',
  privateSupportContact: '',
}

const emptyVenueValues: TournamentVenueConfigurationFormValues = {
  name: '',
  country: '',
  city: '',
  address: '',
  mapUrl: '',
  checkInLocation: '',
  parkingInfo: '',
  spectatorPolicy: '',
  venueRules: '',
  emergencyContact: '',
  equipmentProvidedPc: false,
  equipmentProvidedMonitor: false,
  equipmentProvidedMouse: false,
  equipmentProvidedKeyboard: false,
  equipmentProvidedHeadset: false,
  equipmentProvidedController: false,
  playersMayBringMouse: false,
  playersMayBringKeyboard: false,
  playersMayBringHeadset: false,
  playersMayBringController: false,
  playersMayBringMousePad: false,
  playersMustBringNationalId: false,
  playersMustBringGameAccount: false,
  playersMustBringController: false,
  personalPeripheralsAllowed: false,
  controllersAllowed: false,
  usbDevicesAllowed: false,
  driverInstallationAllowed: false,
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
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

function isMissingConfiguration(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404
}

function onlineResponseToValues(
  response: OnlineConfigurationResponseDto,
): TournamentOnlineConfigurationFormValues {
  return {
    serverRegion: response.publicDetails.serverRegion,
    publicInstructions: response.publicDetails.publicInstructions ?? '',
    connectionRules: response.publicDetails.connectionRules ?? '',
    evidenceRequired: response.publicDetails.evidenceRequired,
    screenshotRequirements: response.publicDetails.screenshotRequirements ?? '',
    resultSubmissionDeadlineMinutes:
      response.publicDetails.resultSubmissionDeadlineMinutes?.toString() ?? '',
    discordServerUrl: response.privateDetails.discordServerUrl ?? '',
    captainSupportChannel: response.privateDetails.captainSupportChannel ?? '',
    matchReportingChannel: response.privateDetails.matchReportingChannel ?? '',
    lobbyInstructions: response.privateDetails.lobbyInstructions ?? '',
    privateSupportContact: response.privateDetails.privateSupportContact ?? '',
  }
}

function onlineValuesToDto(
  values: TournamentOnlineConfigurationFormValues,
): UpsertOnlineConfigurationDto {
  return {
    serverRegion: values.serverRegion.trim(),
    publicInstructions: optional(values.publicInstructions),
    connectionRules: optional(values.connectionRules),
    evidenceRequired: values.evidenceRequired,
    screenshotRequirements: optional(values.screenshotRequirements),
    resultSubmissionDeadlineMinutes: values.resultSubmissionDeadlineMinutes
      ? Number(values.resultSubmissionDeadlineMinutes)
      : undefined,
    discordServerUrl: optional(values.discordServerUrl),
    captainSupportChannel: optional(values.captainSupportChannel),
    matchReportingChannel: optional(values.matchReportingChannel),
    lobbyInstructions: optional(values.lobbyInstructions),
    privateSupportContact: optional(values.privateSupportContact),
  }
}

function venueResponseToValues(
  response: VenueResponseDto,
): TournamentVenueConfigurationFormValues {
  const equipmentProvided = response.equipmentPolicy.equipmentProvided
  const playersMayBring = response.equipmentPolicy.playersMayBring
  const playersMustBring = response.equipmentPolicy.playersMustBring
  return {
    name: response.location.name,
    country: response.location.country,
    city: response.location.city,
    address: response.location.address,
    mapUrl: response.location.mapUrl ?? '',
    checkInLocation: response.location.checkInLocation,
    parkingInfo: response.policy.parkingInfo ?? '',
    spectatorPolicy: response.policy.spectatorPolicy ?? '',
    venueRules: response.policy.venueRules ?? '',
    emergencyContact: response.policy.emergencyContact ?? '',
    equipmentProvidedPc: equipmentProvided?.pc === true,
    equipmentProvidedMonitor: equipmentProvided?.monitor === true,
    equipmentProvidedMouse: equipmentProvided?.mouse === true,
    equipmentProvidedKeyboard: equipmentProvided?.keyboard === true,
    equipmentProvidedHeadset: equipmentProvided?.headset === true,
    equipmentProvidedController: equipmentProvided?.controller === true,
    playersMayBringMouse: playersMayBring?.mouse === true,
    playersMayBringKeyboard: playersMayBring?.keyboard === true,
    playersMayBringHeadset: playersMayBring?.headset === true,
    playersMayBringController: playersMayBring?.controller === true,
    playersMayBringMousePad: playersMayBring?.mousePad === true,
    playersMustBringNationalId: playersMustBring?.nationalId === true,
    playersMustBringGameAccount: playersMustBring?.gameAccount === true,
    playersMustBringController: playersMustBring?.controller === true,
    personalPeripheralsAllowed: response.equipmentPolicy.personalPeripheralsAllowed,
    controllersAllowed: response.equipmentPolicy.controllersAllowed,
    usbDevicesAllowed: response.equipmentPolicy.usbDevicesAllowed,
    driverInstallationAllowed: response.equipmentPolicy.driverInstallationAllowed,
  }
}

function venueValuesToDto(values: TournamentVenueConfigurationFormValues): UpsertVenueDto {
  return {
    name: values.name.trim(),
    country: values.country.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    mapUrl: optional(values.mapUrl),
    checkInLocation: values.checkInLocation.trim(),
    parkingInfo: optional(values.parkingInfo),
    spectatorPolicy: optional(values.spectatorPolicy),
    venueRules: optional(values.venueRules),
    emergencyContact: optional(values.emergencyContact),
    equipmentProvided: {
      pc: values.equipmentProvidedPc,
      monitor: values.equipmentProvidedMonitor,
      mouse: values.equipmentProvidedMouse,
      keyboard: values.equipmentProvidedKeyboard,
      headset: values.equipmentProvidedHeadset,
      controller: values.equipmentProvidedController,
    },
    playersMayBring: {
      mouse: values.playersMayBringMouse,
      keyboard: values.playersMayBringKeyboard,
      headset: values.playersMayBringHeadset,
      controller: values.playersMayBringController,
      mousePad: values.playersMayBringMousePad,
    },
    playersMustBring: {
      nationalId: values.playersMustBringNationalId,
      gameAccount: values.playersMustBringGameAccount,
      controller: values.playersMustBringController,
    },
    personalPeripheralsAllowed: values.personalPeripheralsAllowed,
    controllersAllowed: values.controllersAllowed,
    usbDevicesAllowed: values.usbDevicesAllowed,
    driverInstallationAllowed: values.driverInstallationAllowed,
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{message}</p> : null
}

function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<TournamentVenueConfigurationFormValues>>['control']
  name: 'personalPeripheralsAllowed' | 'controllersAllowed' | 'usbDevicesAllowed' | 'driverInstallationAllowed'
  label: string
  description: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#39343c] bg-[#151316] p-4">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
          <span>
            <span className="block text-sm font-bold text-[#f0eaf2]">{label}</span>
            <span className="mt-1 block text-xs font-normal leading-5 text-[#9f94a4]">{description}</span>
          </span>
        </Label>
      )}
    />
  )
}

type VenuePolicyBooleanField =
  | 'equipmentProvidedPc'
  | 'equipmentProvidedMonitor'
  | 'equipmentProvidedMouse'
  | 'equipmentProvidedKeyboard'
  | 'equipmentProvidedHeadset'
  | 'equipmentProvidedController'
  | 'playersMayBringMouse'
  | 'playersMayBringKeyboard'
  | 'playersMayBringHeadset'
  | 'playersMayBringController'
  | 'playersMayBringMousePad'
  | 'playersMustBringNationalId'
  | 'playersMustBringGameAccount'
  | 'playersMustBringController'

function PolicyCheckbox({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<TournamentVenueConfigurationFormValues>>['control']
  name: VenuePolicyBooleanField
  label: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#39343c] bg-[#151316] px-3 py-3 text-sm font-semibold text-[#e8e1ea] transition hover:border-[#62586a]">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          {label}
        </Label>
      )}
    />
  )
}

function OnlineConfigurationForm({ tournamentId }: { tournamentId: string }) {
  const queries = useTournamentModeConfigurationService(tournamentId, 'ONLINE')
  const mutations = useTournamentModeConfigurationMutations(tournamentId)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<TournamentOnlineConfigurationFormValues>({
    defaultValues: emptyOnlineValues,
  })

  useEffect(() => {
    if (queries.onlineQuery.data) form.reset(onlineResponseToValues(queries.onlineQuery.data))
    if (isMissingConfiguration(queries.onlineQuery.error)) form.reset(emptyOnlineValues)
  }, [form, queries.onlineQuery.data, queries.onlineQuery.error])

  const submit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)
    try {
      await mutations.saveOnlineConfiguration({ tournamentId, data: onlineValuesToDto(values) })
      setMessage('Online tournament configuration saved successfully.')
      form.reset(values)
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not save the online configuration.'))
    }
  })

  if (queries.onlineQuery.isLoading) return <div className="h-96 animate-pulse rounded-xl bg-[#1b191c]" />
  if (queries.onlineQuery.isError && !isMissingConfiguration(queries.onlineQuery.error)) {
    return <LoadError message={getErrorMessage(queries.onlineQuery.error, 'Could not load the online configuration.')} />
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card>
        <CardHeader><Globe2 className="h-5 w-5 text-[#55ddff]" /><CardTitle>Public connection details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="server-region" className="mb-2">Server region</Label>
            <Input id="server-region" placeholder="EU West" aria-invalid={Boolean(form.formState.errors.serverRegion)} {...form.register('serverRegion', { required: 'Server region is required.', minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: 100, message: 'Use no more than 100 characters.' } })} />
            <FieldError message={form.formState.errors.serverRegion?.message} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><Label htmlFor="public-instructions" className="mb-2">Public instructions</Label><Textarea id="public-instructions" className="min-h-28" placeholder="How teams connect on match day" {...form.register('publicInstructions', { maxLength: { value: 3000, message: 'Use no more than 3,000 characters.' } })} /><FieldError message={form.formState.errors.publicInstructions?.message} /></div>
            <div><Label htmlFor="connection-rules" className="mb-2">Connection rules</Label><Textarea id="connection-rules" className="min-h-28" placeholder="Server and connection rules" {...form.register('connectionRules', { maxLength: { value: 3000, message: 'Use no more than 3,000 characters.' } })} /><FieldError message={form.formState.errors.connectionRules?.message} /></div>
          </div>
          <Controller name="evidenceRequired" control={form.control} render={({ field }) => (
            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#39343c] bg-[#151316] p-4"><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" /><span><span className="block text-sm font-bold text-[#f0eaf2]">Match evidence required</span><span className="mt-1 block text-xs font-normal text-[#9f94a4]">Teams must submit the evidence described below with their result.</span></span></Label>
          )} />
          <div className="grid gap-5 md:grid-cols-2">
            <div><Label htmlFor="screenshot-requirements" className="mb-2">Evidence requirements</Label><Textarea id="screenshot-requirements" className="min-h-24" {...form.register('screenshotRequirements', { maxLength: { value: 3000, message: 'Use no more than 3,000 characters.' } })} /><FieldError message={form.formState.errors.screenshotRequirements?.message} /></div>
            <div><Label htmlFor="submission-deadline" className="mb-2">Submission deadline (minutes)</Label><Input id="submission-deadline" type="number" min={1} max={10080} placeholder="30" {...form.register('resultSubmissionDeadlineMinutes', { validate: (value) => !value || (Number(value) >= 1 && Number(value) <= 10080) || 'Use a value from 1 to 10,080.' })} /><FieldError message={form.formState.errors.resultSubmissionDeadlineMinutes?.message} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Private organizer details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-[#4b3c55] bg-[#211a25]"><CircleHelp className="h-4 w-4" /><AlertTitle>Organizer-only information</AlertTitle><AlertDescription className="text-[#b8acbd]">These fields are excluded from the public tournament response.</AlertDescription></Alert>
          <div className="grid gap-5 md:grid-cols-2">
            <div><Label htmlFor="discord-url" className="mb-2">Discord server URL</Label><Input id="discord-url" type="url" placeholder="https://discord.gg/..." {...form.register('discordServerUrl', { maxLength: { value: 2048, message: 'URL is too long.' } })} /></div>
            <div><Label htmlFor="support-contact" className="mb-2">Private support contact</Label><Input id="support-contact" placeholder="support@clutcha.gg" {...form.register('privateSupportContact', { maxLength: { value: 200, message: 'Use no more than 200 characters.' } })} /></div>
            <div><Label htmlFor="captain-channel" className="mb-2">Captain support channel</Label><Input id="captain-channel" placeholder="#captain-support" {...form.register('captainSupportChannel', { maxLength: { value: 100, message: 'Use no more than 100 characters.' } })} /></div>
            <div><Label htmlFor="reporting-channel" className="mb-2">Match reporting channel</Label><Input id="reporting-channel" placeholder="#match-results" {...form.register('matchReportingChannel', { maxLength: { value: 100, message: 'Use no more than 100 characters.' } })} /></div>
          </div>
          <div><Label htmlFor="lobby-instructions" className="mb-2">Private lobby instructions</Label><Textarea id="lobby-instructions" className="min-h-28" {...form.register('lobbyInstructions', { maxLength: { value: 3000, message: 'Use no more than 3,000 characters.' } })} /></div>
        </CardContent>
      </Card>
      <SaveState message={message} error={error} />
      <div className="flex justify-end"><Button size="lg" type="submit" disabled={mutations.isSavingOnline || !form.formState.isDirty}><Save className="h-4 w-4" />{mutations.isSavingOnline ? 'Saving...' : 'Save online configuration'}</Button></div>
    </form>
  )
}

function VenueConfigurationForm({ tournamentId }: { tournamentId: string }) {
  const queries = useTournamentModeConfigurationService(tournamentId, 'ONSITE')
  const mutations = useTournamentModeConfigurationMutations(tournamentId)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<TournamentVenueConfigurationFormValues>({
    defaultValues: emptyVenueValues,
  })

  useEffect(() => {
    if (queries.venueQuery.data) form.reset(venueResponseToValues(queries.venueQuery.data))
    if (isMissingConfiguration(queries.venueQuery.error)) form.reset(emptyVenueValues)
  }, [form, queries.venueQuery.data, queries.venueQuery.error])

  const submit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)
    const providesEquipment = [
      values.equipmentProvidedPc,
      values.equipmentProvidedMonitor,
      values.equipmentProvidedMouse,
      values.equipmentProvidedKeyboard,
      values.equipmentProvidedHeadset,
      values.equipmentProvidedController,
    ].some(Boolean)
    if (!providesEquipment) {
      form.setError('equipmentProvidedPc', {
        type: 'validate',
        message: 'Select at least one item supplied by the venue.',
      })
      return
    }
    try {
      await mutations.saveVenue({ tournamentId, data: venueValuesToDto(values) })
      setMessage('On-site venue configuration saved successfully.')
      form.reset(values)
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not save the venue configuration.'))
    }
  })

  if (queries.venueQuery.isLoading) return <div className="h-96 animate-pulse rounded-xl bg-[#1b191c]" />
  if (queries.venueQuery.isError && !isMissingConfiguration(queries.venueQuery.error)) {
    return <LoadError message={getErrorMessage(queries.venueQuery.error, 'Could not load the venue configuration.')} />
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card>
        <CardHeader><MapPin className="h-5 w-5 text-[#55ddff]" /><CardTitle>Venue location</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><Label htmlFor="venue-name" className="mb-2">Venue name</Label><Input id="venue-name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name', { required: 'Venue name is required.', minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: 150, message: 'Use no more than 150 characters.' } })} /><FieldError message={form.formState.errors.name?.message} /></div>
          <div><Label htmlFor="venue-country" className="mb-2">Country</Label><Input id="venue-country" {...form.register('country', { required: 'Country is required.', minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: 100, message: 'Use no more than 100 characters.' } })} /><FieldError message={form.formState.errors.country?.message} /></div>
          <div><Label htmlFor="venue-city" className="mb-2">City</Label><Input id="venue-city" {...form.register('city', { required: 'City is required.', minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: 100, message: 'Use no more than 100 characters.' } })} /><FieldError message={form.formState.errors.city?.message} /></div>
          <div className="md:col-span-2"><Label htmlFor="venue-address" className="mb-2">Address</Label><Textarea id="venue-address" {...form.register('address', { required: 'Address is required.', minLength: { value: 5, message: 'Use at least 5 characters.' }, maxLength: { value: 500, message: 'Use no more than 500 characters.' } })} /><FieldError message={form.formState.errors.address?.message} /></div>
          <div><Label htmlFor="check-in-location" className="mb-2">Check-in location</Label><Input id="check-in-location" placeholder="Main reception desk" {...form.register('checkInLocation', { required: 'Check-in location is required.', minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: 300, message: 'Use no more than 300 characters.' } })} /><FieldError message={form.formState.errors.checkInLocation?.message} /></div>
          <div><Label htmlFor="map-url" className="mb-2">Map URL</Label><Input id="map-url" type="url" placeholder="https://maps.google.com/..." {...form.register('mapUrl', { maxLength: { value: 2048, message: 'URL is too long.' } })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Venue policy</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div><Label htmlFor="parking-info" className="mb-2">Parking information</Label><Textarea id="parking-info" {...form.register('parkingInfo', { maxLength: { value: 1000, message: 'Use no more than 1,000 characters.' } })} /></div>
          <div><Label htmlFor="spectator-policy" className="mb-2">Spectator policy</Label><Textarea id="spectator-policy" {...form.register('spectatorPolicy', { maxLength: { value: 1000, message: 'Use no more than 1,000 characters.' } })} /></div>
          <div><Label htmlFor="venue-rules" className="mb-2">Venue rules</Label><Textarea id="venue-rules" {...form.register('venueRules', { maxLength: { value: 2000, message: 'Use no more than 2,000 characters.' } })} /></div>
          <div><Label htmlFor="emergency-contact" className="mb-2">Emergency contact</Label><Input id="emergency-contact" {...form.register('emergencyContact', { maxLength: { value: 200, message: 'Use no more than 200 characters.' } })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Equipment policy</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <section>
            <div className="mb-3"><h3 className="text-sm font-black text-[#f0eaf2]">Equipment supplied by the venue</h3><p className="mt-1 text-xs leading-5 text-[#9f94a4]">Select at least one item. This policy is required before an on-site tournament can be published.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyCheckbox control={form.control} name="equipmentProvidedPc" label="Gaming PC" />
              <PolicyCheckbox control={form.control} name="equipmentProvidedMonitor" label="Monitor" />
              <PolicyCheckbox control={form.control} name="equipmentProvidedMouse" label="Mouse" />
              <PolicyCheckbox control={form.control} name="equipmentProvidedKeyboard" label="Keyboard" />
              <PolicyCheckbox control={form.control} name="equipmentProvidedHeadset" label="Headset" />
              <PolicyCheckbox control={form.control} name="equipmentProvidedController" label="Controller" />
            </div>
            <FieldError message={form.formState.errors.equipmentProvidedPc?.message} />
          </section>
          <section className="border-t border-[#39343c] pt-6">
            <div className="mb-3"><h3 className="text-sm font-black text-[#f0eaf2]">Players may bring</h3><p className="mt-1 text-xs leading-5 text-[#9f94a4]">Personal equipment that participants are allowed to use.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyCheckbox control={form.control} name="playersMayBringMouse" label="Mouse" />
              <PolicyCheckbox control={form.control} name="playersMayBringKeyboard" label="Keyboard" />
              <PolicyCheckbox control={form.control} name="playersMayBringHeadset" label="Headset" />
              <PolicyCheckbox control={form.control} name="playersMayBringController" label="Controller" />
              <PolicyCheckbox control={form.control} name="playersMayBringMousePad" label="Mouse pad" />
            </div>
          </section>
          <section className="border-t border-[#39343c] pt-6">
            <div className="mb-3"><h3 className="text-sm font-black text-[#f0eaf2]">Players must bring</h3><p className="mt-1 text-xs leading-5 text-[#9f94a4]">Required items participants need for venue check-in or competition.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyCheckbox control={form.control} name="playersMustBringNationalId" label="National ID" />
              <PolicyCheckbox control={form.control} name="playersMustBringGameAccount" label="Game account credentials" />
              <PolicyCheckbox control={form.control} name="playersMustBringController" label="Controller" />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><ShieldCheck className="h-5 w-5 text-[#55ddff]" /><CardTitle>Device permissions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <ToggleField control={form.control} name="personalPeripheralsAllowed" label="Personal peripherals" description="Players may use their own supported peripherals." />
          <ToggleField control={form.control} name="controllersAllowed" label="Controllers" description="Controllers are permitted at tournament stations." />
          <ToggleField control={form.control} name="usbDevicesAllowed" label="USB devices" description="Players may connect approved USB devices." />
          <ToggleField control={form.control} name="driverInstallationAllowed" label="Driver installation" description="Players may install device drivers at the venue." />
        </CardContent>
      </Card>
      <SaveState message={message} error={error} />
      <div className="flex justify-end"><Button size="lg" type="submit" disabled={mutations.isSavingVenue || !form.formState.isDirty}><Save className="h-4 w-4" />{mutations.isSavingVenue ? 'Saving...' : 'Save venue configuration'}</Button></div>
    </form>
  )
}

function SaveState({ message, error }: { message: string | null; error: string | null }) {
  return <>{message && <Alert className="border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Saved</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}{error && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Action failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}</>
}

function LoadError({ message }: { message: string }) {
  return <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Configuration could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">{message}</AlertDescription></Alert>
}

export function TournamentModeConfigurationPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const detailsQuery = useOrganizerTournamentDetailsService(tournamentId)
  const tournament = detailsQuery.data?.tournament

  if (detailsQuery.isLoading) return <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-xl bg-[#1b191c]" />
  if (detailsQuery.isError || !tournament) return <LoadError message="It may not exist or may belong to another organizer." />

  if (tournament.status !== 'DRAFT') {
    return <div className="mx-auto max-w-3xl py-12"><Alert className="border-[#795f34] bg-[#382c19] text-[#ffd08b]"><TriangleAlert className="h-5 w-5" /><AlertTitle>Only draft tournaments can be configured</AlertTitle><AlertDescription className="mt-2 text-[#e7ca96]">{tournament.name} is currently {tournament.status.toLowerCase().replaceAll('_', ' ')}.</AlertDescription></Alert><Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="outline" className="mt-5"><ArrowLeft className="h-4 w-4" /> Back to tournament</Button></div>
  }

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to tournament</Button><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament management</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Mode Configuration</h1><p className="mt-2 text-sm text-[#a99ead]">{tournament.mode === 'ONLINE' ? 'Configure public connection rules and private organizer channels.' : 'Configure the venue, event policy, and allowed player devices.'}</p></div>
        <span className="rounded-full border border-[#62586a] bg-[#302a34] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e2d7e7]">{tournament.mode === 'ONLINE' ? 'Online' : 'On-site'}</span>
      </header>
      <TournamentManagementNav tournamentId={tournament.id} active="configuration" />
      {tournament.mode === 'ONLINE' ? <OnlineConfigurationForm tournamentId={tournament.id} /> : <VenueConfigurationForm tournamentId={tournament.id} />}
    </div>
  )
}
