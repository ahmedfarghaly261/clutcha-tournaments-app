import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Computer,
  Cpu,
  Gamepad2,
  Monitor,
  Pencil,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  CreateGamingRoomDtoPurpose,
  type CreateGamingRoomDto,
  type GamingRoomResponseDto,
  type UpdateGamingRoomDto,
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
import { useOrganizerTournamentDetailsService } from '../../details/services/organizer-tournament-details.service'
import { TournamentManagementNav } from '../components/TournamentManagementNav'
import { useTournamentGamingRoomMutations } from '../mutations/tournament-gaming-rooms.mutations'
import { useTournamentGamingRoomsService } from '../services/tournament-gaming-rooms.service'
import type { TournamentGamingRoomFormValues } from '../types/tournament-management.types'

const emptyRoomValues: TournamentGamingRoomFormValues = {
  name: '',
  description: '',
  purpose: CreateGamingRoomDtoPurpose.COMPETITION,
  stationCount: '',
  cpu: '',
  gpu: '',
  ram: '',
  storage: '',
  operatingSystem: '',
  monitorBrand: '',
  monitorModel: '',
  monitorSizeInches: '',
  monitorResolution: '',
  monitorRefreshRateHz: '',
  monitorResponseTimeMs: '',
  mouse: '',
  keyboard: '',
  headset: '',
  mousePad: '',
  controller: '',
  internetConnection: '',
  equipmentNotes: '',
}

const purposeLabels: Record<CreateGamingRoomDtoPurpose, string> = {
  COMPETITION: 'Competition',
  PRACTICE: 'Practice',
  WARMUP: 'Warm-up',
  FINAL_STAGE: 'Final stage',
  BACKUP: 'Backup',
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function optionalNumber(value: string) {
  return value ? Number(value) : undefined
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

function roomToValues(room: GamingRoomResponseDto): TournamentGamingRoomFormValues {
  return {
    name: room.name,
    description: room.description ?? '',
    purpose: room.purpose,
    stationCount: room.stationCount.toString(),
    cpu: room.pcSpecs.cpu,
    gpu: room.pcSpecs.gpu,
    ram: room.pcSpecs.ram ?? '',
    storage: room.pcSpecs.storage ?? '',
    operatingSystem: room.pcSpecs.operatingSystem ?? '',
    monitorBrand: room.monitor.brand ?? '',
    monitorModel: room.monitor.model,
    monitorSizeInches: room.monitor.sizeInches ?? '',
    monitorResolution: room.monitor.resolution ?? '',
    monitorRefreshRateHz: room.monitor.refreshRateHz.toString(),
    monitorResponseTimeMs: room.monitor.responseTimeMs ?? '',
    mouse: room.peripherals.mouse,
    keyboard: room.peripherals.keyboard,
    headset: room.peripherals.headset,
    mousePad: room.peripherals.mousePad ?? '',
    controller: room.peripherals.controller ?? '',
    internetConnection: room.internetConnection ?? '',
    equipmentNotes: room.equipmentNotes ?? '',
  }
}

function valuesToDto(values: TournamentGamingRoomFormValues): CreateGamingRoomDto {
  return {
    name: values.name.trim(),
    description: optional(values.description),
    purpose: values.purpose,
    stationCount: Number(values.stationCount),
    cpu: values.cpu.trim(),
    gpu: values.gpu.trim(),
    ram: optional(values.ram),
    storage: optional(values.storage),
    operatingSystem: optional(values.operatingSystem),
    monitorBrand: optional(values.monitorBrand),
    monitorModel: values.monitorModel.trim(),
    monitorSizeInches: optionalNumber(values.monitorSizeInches),
    monitorResolution: optional(values.monitorResolution),
    monitorRefreshRateHz: Number(values.monitorRefreshRateHz),
    monitorResponseTimeMs: optionalNumber(values.monitorResponseTimeMs),
    mouse: values.mouse.trim(),
    keyboard: values.keyboard.trim(),
    headset: values.headset.trim(),
    mousePad: optional(values.mousePad),
    controller: optional(values.controller),
    internetConnection: optional(values.internetConnection),
    equipmentNotes: optional(values.equipmentNotes),
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{message}</p> : null
}

function RequiredTextField({
  id,
  label,
  name,
  form,
  maxLength = 150,
}: {
  id: string
  label: string
  name: 'name' | 'cpu' | 'gpu' | 'monitorModel' | 'mouse' | 'keyboard' | 'headset'
  form: ReturnType<typeof useForm<TournamentGamingRoomFormValues>>
  maxLength?: number
}) {
  const error = form.formState.errors[name]?.message
  return <div><Label htmlFor={id} className="mb-2">{label}</Label><Input id={id} aria-invalid={Boolean(error)} {...form.register(name, { required: `${label} is required.`, minLength: { value: 2, message: 'Use at least 2 characters.' }, maxLength: { value: maxLength, message: `Use no more than ${maxLength} characters.` } })} /><FieldError message={error} /></div>
}

function GamingRoomEditor({
  tournamentId,
  selectedRoom,
  onDone,
  onCancel,
}: {
  tournamentId: string
  selectedRoom: GamingRoomResponseDto | null
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const mutations = useTournamentGamingRoomMutations(tournamentId)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<TournamentGamingRoomFormValues>({
    defaultValues: selectedRoom ? roomToValues(selectedRoom) : emptyRoomValues,
  })

  const submit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      const data = valuesToDto(values)
      if (selectedRoom) {
        await mutations.updateRoom({
          tournamentId,
          gamingRoomId: selectedRoom.id,
          data: data as UpdateGamingRoomDto,
        })
        onDone('Gaming room updated successfully.')
      } else {
        await mutations.createRoom({ tournamentId, data })
        onDone('Gaming room created successfully.')
      }
      form.reset(emptyRoomValues)
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not save the gaming room.'))
    }
  })

  const pending = mutations.isCreating || mutations.isUpdating
  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card>
        <CardHeader className="justify-between"><div className="flex items-center gap-3"><Computer className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>{selectedRoom ? `Edit ${selectedRoom.name}` : 'Add gaming room'}</CardTitle></div>{selectedRoom && <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /> Cancel edit</Button>}</CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <RequiredTextField id="room-name" label="Room name" name="name" form={form} />
          <Controller name="purpose" control={form.control} render={({ field }) => <div><Label className="mb-2">Purpose</Label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(purposeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>} />
          <div><Label htmlFor="station-count" className="mb-2">Station count</Label><Input id="station-count" type="number" min={1} max={1000} aria-invalid={Boolean(form.formState.errors.stationCount)} {...form.register('stationCount', { required: 'Station count is required.', validate: (value) => (Number(value) >= 1 && Number(value) <= 1000) || 'Use a value from 1 to 1,000.' })} /><FieldError message={form.formState.errors.stationCount?.message} /></div>
          <div className="md:col-span-2"><Label htmlFor="room-description" className="mb-2">Description</Label><Textarea id="room-description" {...form.register('description', { maxLength: { value: 1000, message: 'Use no more than 1,000 characters.' } })} /><FieldError message={form.formState.errors.description?.message} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Cpu className="h-5 w-5 text-[#55ddff]" /><CardTitle>PC specifications</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <RequiredTextField id="room-cpu" label="CPU" name="cpu" form={form} />
          <RequiredTextField id="room-gpu" label="GPU" name="gpu" form={form} />
          <div><Label htmlFor="room-ram" className="mb-2">RAM</Label><Input id="room-ram" placeholder="32 GB DDR5" {...form.register('ram', { maxLength: 100 })} /></div>
          <div><Label htmlFor="room-storage" className="mb-2">Storage</Label><Input id="room-storage" placeholder="1 TB NVMe SSD" {...form.register('storage', { maxLength: 100 })} /></div>
          <div><Label htmlFor="room-os" className="mb-2">Operating system</Label><Input id="room-os" placeholder="Windows 11 Pro" {...form.register('operatingSystem', { maxLength: 100 })} /></div>
          <div><Label htmlFor="room-internet" className="mb-2">Internet connection</Label><Input id="room-internet" placeholder="1 Gbps fiber" {...form.register('internetConnection', { maxLength: 300 })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Monitor className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Monitor details</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div><Label htmlFor="monitor-brand" className="mb-2">Brand</Label><Input id="monitor-brand" {...form.register('monitorBrand', { maxLength: 100 })} /></div>
          <RequiredTextField id="monitor-model" label="Model" name="monitorModel" form={form} />
          <div><Label htmlFor="monitor-size" className="mb-2">Size (inches)</Label><Input id="monitor-size" type="number" min={1} max={100} step="0.1" {...form.register('monitorSizeInches', { validate: (value) => !value || (Number(value) >= 1 && Number(value) <= 100) || 'Use a value from 1 to 100.' })} /><FieldError message={form.formState.errors.monitorSizeInches?.message} /></div>
          <div><Label htmlFor="monitor-resolution" className="mb-2">Resolution</Label><Input id="monitor-resolution" placeholder="2560 × 1440" {...form.register('monitorResolution', { maxLength: 50 })} /></div>
          <div><Label htmlFor="monitor-refresh" className="mb-2">Refresh rate (Hz)</Label><Input id="monitor-refresh" type="number" min={30} max={1000} aria-invalid={Boolean(form.formState.errors.monitorRefreshRateHz)} {...form.register('monitorRefreshRateHz', { required: 'Refresh rate is required.', validate: (value) => (Number(value) >= 30 && Number(value) <= 1000) || 'Use a value from 30 to 1,000.' })} /><FieldError message={form.formState.errors.monitorRefreshRateHz?.message} /></div>
          <div><Label htmlFor="monitor-response" className="mb-2">Response time (ms)</Label><Input id="monitor-response" type="number" min={0} max={100} step="0.1" {...form.register('monitorResponseTimeMs', { validate: (value) => !value || (Number(value) >= 0 && Number(value) <= 100) || 'Use a value from 0 to 100.' })} /><FieldError message={form.formState.errors.monitorResponseTimeMs?.message} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><Gamepad2 className="h-5 w-5 text-[#55ddff]" /><CardTitle>Peripherals</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <RequiredTextField id="room-mouse" label="Mouse" name="mouse" form={form} />
          <RequiredTextField id="room-keyboard" label="Keyboard" name="keyboard" form={form} />
          <RequiredTextField id="room-headset" label="Headset" name="headset" form={form} />
          <div><Label htmlFor="room-mouse-pad" className="mb-2">Mouse pad</Label><Input id="room-mouse-pad" {...form.register('mousePad', { maxLength: 150 })} /></div>
          <div><Label htmlFor="room-controller" className="mb-2">Controller</Label><Input id="room-controller" {...form.register('controller', { maxLength: 150 })} /></div>
          <div className="md:col-span-2 lg:col-span-3"><Label htmlFor="equipment-notes" className="mb-2">Equipment notes</Label><Textarea id="equipment-notes" className="min-h-24" {...form.register('equipmentNotes', { maxLength: { value: 2000, message: 'Use no more than 2,000 characters.' } })} /><FieldError message={form.formState.errors.equipmentNotes?.message} /></div>
        </CardContent>
      </Card>

      {error && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Room could not be saved</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}
      <div className="flex justify-end"><Button type="submit" size="lg" disabled={pending}><Save className="h-4 w-4" />{pending ? 'Saving...' : selectedRoom ? 'Save room changes' : 'Create gaming room'}</Button></div>
    </form>
  )
}

export function TournamentGamingRoomsPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const detailsQuery = useOrganizerTournamentDetailsService(tournamentId)
  const tournament = detailsQuery.data?.tournament
  const isEligible = tournament?.status === 'DRAFT' && tournament.mode === 'ONSITE'
  const roomsQuery = useTournamentGamingRoomsService(tournamentId, isEligible)
  const mutations = useTournamentGamingRoomMutations(tournamentId)
  const [selectedRoom, setSelectedRoom] = useState<GamingRoomResponseDto | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const editRoom = (room: GamingRoomResponseDto) => {
    setSelectedRoom(room)
    setMessage(null)
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const removeRoom = async (room: GamingRoomResponseDto) => {
    setError(null)
    try {
      await mutations.deleteRoom({ tournamentId, gamingRoomId: room.id })
      if (selectedRoom?.id === room.id) setSelectedRoom(null)
      setMessage(`${room.name} was deleted.`)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Could not delete the gaming room.'))
    }
  }

  if (detailsQuery.isLoading) return <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-xl bg-[#1b191c]" />
  if (detailsQuery.isError || !tournament) return <LoadError message="The tournament may not exist or may belong to another organizer." />
  if (tournament.status !== 'DRAFT') return <Restriction title="Only draft tournaments can be edited" description={`${tournament.name} is currently ${tournament.status.toLowerCase().replaceAll('_', ' ')}.`} tournamentId={tournament.id} />
  if (tournament.mode !== 'ONSITE') return <Restriction title="Gaming rooms are for on-site tournaments" description="Change the tournament mode to on-site in General Settings before adding rooms." tournamentId={tournament.id} />

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs"><ArrowLeft className="h-4 w-4" /> Back to tournament</Button><p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament management</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">Gaming Rooms</h1><p className="mt-2 text-sm text-[#a99ead]">Define the stations and hardware available at your on-site venue.</p></div>
        <span className="rounded-full border border-[#62586a] bg-[#302a34] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e2d7e7]">On-site draft</span>
      </header>
      <TournamentManagementNav tournamentId={tournament.id} active="gaming-rooms" />

      {message && <Alert className="mb-6 border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Done</AlertTitle><AlertDescription className="text-[#a7ead7]">{message}</AlertDescription></Alert>}
      {error && <Alert className="mb-6 border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Action failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{error}</AlertDescription></Alert>}

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-[#f5f1f7]">Configured rooms</h2><p className="mt-1 text-sm text-[#9f94a4]">{roomsQuery.data?.items.length ?? 0} rooms configured</p></div><Button variant="outline" onClick={() => { setSelectedRoom(null); setMessage(null); editorRef.current?.scrollIntoView({ behavior: 'smooth' }) }}><Plus className="h-4 w-4" /> Add room</Button></div>
        {roomsQuery.isLoading && <div className="grid gap-4 md:grid-cols-2"><div className="h-52 animate-pulse rounded-xl bg-[#1b191c]" /><div className="h-52 animate-pulse rounded-xl bg-[#1b191c]" /></div>}
        {roomsQuery.isError && <Alert className="border-[#795f34] bg-[#382c19] text-[#ffd08b]"><TriangleAlert className="h-5 w-5" /><AlertTitle>Rooms could not be loaded</AlertTitle><AlertDescription className="text-[#e7ca96]">{getErrorMessage(roomsQuery.error, 'Configure and save the on-site venue first, then return to add gaming rooms.')}</AlertDescription><Button render={<Link to={`/organizer/tournaments/${tournament.id}/manage/configuration`} />} variant="outline" size="sm" className="mt-4">Open venue configuration</Button></Alert>}
        {!roomsQuery.isLoading && !roomsQuery.isError && roomsQuery.data?.items.length === 0 && <Card><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><Computer className="h-10 w-10 text-[#685d6d]" /><h3 className="mt-4 font-black text-[#f0eaf2]">No gaming rooms yet</h3><p className="mt-2 max-w-md text-sm text-[#9f94a4]">Add the first room with its station capacity and hardware specifications.</p></CardContent></Card>}
        <div className="grid gap-4 md:grid-cols-2">
          {roomsQuery.data?.items.map((room) => <Card key={room.id} className={selectedRoom?.id === room.id ? 'border-[#b96cff]' : undefined}><CardHeader className="justify-between"><div><CardTitle>{room.name}</CardTitle><p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#d7a5ff]">{purposeLabels[room.purpose]}</p></div><span className="rounded-full border border-[#48404d] px-2.5 py-1 text-xs font-bold text-[#ddd4e0]">{room.stationCount} stations</span></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm"><Spec label="CPU" value={room.pcSpecs.cpu} /><Spec label="GPU" value={room.pcSpecs.gpu} /><Spec label="Monitor" value={`${room.monitor.model} · ${room.monitor.refreshRateHz} Hz`} /><Spec label="Peripherals" value={`${room.peripherals.mouse} / ${room.peripherals.keyboard}`} /></div><div className="mt-5 flex gap-2"><Button variant="outline" size="sm" onClick={() => editRoom(room)}><Pencil className="h-4 w-4" /> Edit</Button><AlertDialog><AlertDialogTrigger render={<Button variant="destructive" size="sm" />}><Trash2 className="h-4 w-4" /> Delete</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {room.name}?</AlertDialogTitle><AlertDialogDescription>This permanently removes the room and its hardware specifications from the tournament.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={mutations.isDeleting} onClick={() => void removeRoom(room)}>{mutations.isDeleting ? 'Deleting...' : 'Delete room'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></CardContent></Card>)}
        </div>
      </section>

      <div ref={editorRef} className="scroll-mt-6"><GamingRoomEditor key={selectedRoom?.id ?? 'new-room'} tournamentId={tournament.id} selectedRoom={selectedRoom} onCancel={() => setSelectedRoom(null)} onDone={(successMessage) => { setSelectedRoom(null); setMessage(successMessage); setError(null) }} /></div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#151316] p-3"><span className="block text-[10px] font-black uppercase tracking-[0.08em] text-[#887d8c]">{label}</span><span className="mt-1 block truncate font-semibold text-[#e8e1ea]" title={value}>{value}</span></div>
}

function LoadError({ message }: { message: string }) {
  return <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Gaming rooms could not be loaded</AlertTitle><AlertDescription className="text-[#ffcbc7]">{message}</AlertDescription></Alert>
}

function Restriction({ title, description, tournamentId }: { title: string; description: string; tournamentId: string }) {
  return <div className="mx-auto max-w-3xl py-12"><Alert className="border-[#795f34] bg-[#382c19] text-[#ffd08b]"><TriangleAlert className="h-5 w-5" /><AlertTitle>{title}</AlertTitle><AlertDescription className="mt-2 text-[#e7ca96]">{description}</AlertDescription></Alert><Button render={<Link to={`/organizer/tournaments/${tournamentId}/manage`} />} variant="outline" className="mt-5"><ArrowLeft className="h-4 w-4" /> Open general settings</Button></div>
}
