import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImageUp, Save, Settings2, Trash2, TriangleAlert } from 'lucide-react'
import {
  UpdateTournamentDraftDtoMode,
  UpdateTournamentDraftDtoVisibility,
  type TournamentResponseDto,
  type UpdateTournamentDraftDto,
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
import { useTournamentGeneralSettingsService } from '../services/tournament-general-settings.service'

type GeneralSettingsValues = {
  name: string
  shortDescription: string
  description: string
  gameKey: string
  mode: UpdateTournamentDraftDtoMode
  visibility: UpdateTournamentDraftDtoVisibility
}

const gameOptions = [
  { value: 'valorant', label: 'Valorant' },
  { value: 'counter-strike-2', label: 'Counter-Strike 2' },
  { value: 'league-of-legends', label: 'League of Legends' },
  { value: 'dota-2', label: 'Dota 2' },
  { value: 'rocket-league', label: 'Rocket League' },
  { value: 'fortnite', label: 'Fortnite' },
]

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

function toFormValues(tournament: TournamentResponseDto): GeneralSettingsValues {
  return {
    name: tournament.name,
    shortDescription: tournament.shortDescription ?? '',
    description: tournament.description ?? '',
    gameKey: tournament.gameKey,
    mode: tournament.mode,
    visibility: tournament.visibility,
  }
}

function toUpdateDto(values: GeneralSettingsValues): UpdateTournamentDraftDto {
  return {
    name: values.name.trim(),
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    gameKey: values.gameKey,
    mode: values.mode,
    visibility: values.visibility,
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{message}</p> : null
}

export function TournamentGeneralSettingsPage() {
  const { tournamentId = '' } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const detailsQuery = useOrganizerTournamentDetailsService(tournamentId)
  const {
    updateDraft,
    uploadCover,
    deleteDraft,
    isUpdating,
    isUploadingCover,
    isDeleting,
  } = useTournamentGeneralSettingsService(tournamentId)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [coverMessage, setCoverMessage] = useState<string | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GeneralSettingsValues>()

  const tournament = detailsQuery.data?.tournament

  useEffect(() => {
    if (tournament) reset(toFormValues(tournament))
  }, [reset, tournament])

  useEffect(
    () => () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    },
    [coverPreviewUrl],
  )

  const saveGeneralSettings = handleSubmit(async (values) => {
    setFormMessage(null)
    setFormError(null)
    try {
      const updated = await updateDraft({ tournamentId, data: toUpdateDto(values) })
      reset(toFormValues(updated))
      setFormMessage('General settings saved successfully.')
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not update the tournament draft.'))
    }
  })

  const saveCover = async () => {
    setCoverMessage(null)
    setCoverError(null)
    if (!coverFile) {
      setCoverError('Choose a JPEG, PNG, or WebP image first.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(coverFile.type)) {
      setCoverError('Use a JPEG, PNG, or WebP image.')
      return
    }
    if (coverFile.size > 5 * 1024 * 1024) {
      setCoverError('Cover image must be 5MB or smaller.')
      return
    }

    try {
      await uploadCover({ tournamentId, data: { file: coverFile } })
      setCoverFile(null)
      setCoverPreviewUrl(null)
      setCoverMessage('Tournament cover replaced successfully.')
    } catch (error) {
      setCoverError(getErrorMessage(error, 'Could not upload the tournament cover.'))
    }
  }

  const confirmDelete = async () => {
    setFormError(null)
    try {
      await deleteDraft({ tournamentId })
      navigate('/organizer/tournaments', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not delete the tournament draft.'))
    }
  }

  if (detailsQuery.isLoading) {
    return <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-xl bg-[#1b191c]" />
  }

  if (detailsQuery.isError || !tournament) {
    return (
      <Alert className="mx-auto max-w-3xl border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]">
        <AlertTitle>Tournament could not be loaded</AlertTitle>
        <AlertDescription className="mt-2 text-[#ffcbc7]">It may not exist or may belong to another organizer.</AlertDescription>
      </Alert>
    )
  }

  if (tournament.status !== 'DRAFT') {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Alert className="border-[#795f34] bg-[#382c19] text-[#ffd08b]">
          <TriangleAlert className="h-5 w-5" />
          <AlertTitle>Only draft tournaments can be edited</AlertTitle>
          <AlertDescription className="mt-2 text-[#e7ca96]">
            {tournament.name} is currently {tournament.status.toLowerCase().replaceAll('_', ' ')}.
          </AlertDescription>
        </Alert>
        <Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="outline" className="mt-5">
          <ArrowLeft className="h-4 w-4" /> Back to tournament
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Button render={<Link to={`/organizer/tournaments/${tournament.id}`} />} variant="link" className="mb-2 h-auto px-0 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to tournament
          </Button>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#d7a5ff]">Tournament management</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#f5f1f7]">General Settings</h1>
          <p className="mt-2 text-sm text-[#a99ead]">Update the identity and branding of your draft tournament.</p>
        </div>
        <span className="rounded-full border border-[#62586a] bg-[#302a34] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#e2d7e7]">Draft</span>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={saveGeneralSettings} className="space-y-6" noValidate>
          <Card>
            <CardHeader><Settings2 className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Identity</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor="manage-name">Tournament name</Label>
                <Input id="manage-name" aria-invalid={Boolean(errors.name)} {...register('name', { required: 'Tournament name is required.', minLength: { value: 3, message: 'Use at least 3 characters.' }, maxLength: { value: 150, message: 'Use no more than 150 characters.' } })} />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor="manage-short-description">Short description</Label>
                <Textarea id="manage-short-description" className="min-h-24" aria-invalid={Boolean(errors.shortDescription)} {...register('shortDescription', { maxLength: { value: 300, message: 'Use no more than 300 characters.' } })} />
                <FieldError message={errors.shortDescription?.message} />
              </div>
              <div>
                <Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor="manage-description">Full description</Label>
                <Textarea id="manage-description" className="min-h-36" aria-invalid={Boolean(errors.description)} {...register('description', { maxLength: { value: 5000, message: 'Use no more than 5,000 characters.' } })} />
                <FieldError message={errors.description?.message} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Settings2 className="h-5 w-5 text-[#55ddff]" /><CardTitle>Discovery</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3">
              <Controller name="gameKey" control={control} rules={{ required: 'Game is required.' }} render={({ field }) => (
                <div><Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]">Game</Label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{gameOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
              )} />
              <Controller name="mode" control={control} render={({ field }) => (
                <div><Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]">Mode</Label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={UpdateTournamentDraftDtoMode.ONLINE}>Online</SelectItem><SelectItem value={UpdateTournamentDraftDtoMode.ONSITE}>On-site</SelectItem></SelectContent></Select></div>
              )} />
              <Controller name="visibility" control={control} render={({ field }) => (
                <div><Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]">Visibility</Label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={UpdateTournamentDraftDtoVisibility.PUBLIC}>Public</SelectItem><SelectItem value={UpdateTournamentDraftDtoVisibility.UNLISTED}>Unlisted</SelectItem><SelectItem value={UpdateTournamentDraftDtoVisibility.PRIVATE}>Private</SelectItem></SelectContent></Select></div>
              )} />
            </CardContent>
          </Card>

          {formMessage && <Alert className="border-[#276f5c] bg-[#15382f] text-[#8ff5d8]"><AlertTitle>Saved</AlertTitle><AlertDescription className="text-[#a7ead7]">{formMessage}</AlertDescription></Alert>}
          {formError && <Alert className="border-[#7e3e45] bg-[#361b20] text-[#ffcbc7]"><AlertTitle>Action failed</AlertTitle><AlertDescription className="text-[#ffcbc7]">{formError}</AlertDescription></Alert>}

          <div className="flex justify-end"><Button size="lg" type="submit" disabled={isUpdating || !isDirty}><Save className="h-4 w-4" />{isUpdating ? 'Saving…' : 'Save changes'}</Button></div>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader><ImageUp className="h-5 w-5 text-[#d7a5ff]" /><CardTitle>Cover Image</CardTitle></CardHeader>
            <div className="mx-5 mt-5 h-40 overflow-hidden rounded-md border border-[#453d49] bg-[#131114] sm:mx-6">
              {coverPreviewUrl || tournament.coverUrl ? <img className="h-full w-full object-cover" src={coverPreviewUrl ?? tournament.coverUrl ?? ''} alt="Tournament cover preview" /> : <div className="flex h-full items-center justify-center text-[#756a79]"><ImageUp className="h-9 w-9" /></div>}
            </div>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor="manage-cover">Choose replacement</Label>
                <Input id="manage-cover" type="file" accept="image/jpeg,image/png,image/webp" className="cursor-pointer py-2 file:mr-3 file:rounded file:border-0 file:bg-[#d7a5ff] file:px-3 file:py-1 file:text-xs file:font-black file:text-[#2a0b3f]" onChange={(event) => { const file = event.target.files?.[0] ?? null; setCoverFile(file); setCoverPreviewUrl(file ? URL.createObjectURL(file) : null); setCoverError(null); setCoverMessage(null) }} />
              </div>
              {coverMessage && <p className="text-xs text-[#8ff5d8]">{coverMessage}</p>}
              {coverError && <p className="text-xs text-[#ffb4ab]" role="alert">{coverError}</p>}
              <Button variant="outline" className="w-full" type="button" disabled={!coverFile || isUploadingCover} onClick={() => void saveCover()}><ImageUp className="h-4 w-4" />{isUploadingCover ? 'Uploading…' : 'Replace cover'}</Button>
            </CardContent>
          </Card>

          <Card className="border-[#653a40]">
            <CardHeader><Trash2 className="h-5 w-5 text-[#ff9f9a]" /><CardTitle>Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-[#b9aebd]">Deleting this draft permanently removes the tournament and its stored configuration.</p>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" className="mt-4 w-full" />}><Trash2 className="h-4 w-4" /> Delete draft</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete “{tournament.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. The tournament draft and its related configuration will be permanently deleted.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Keep draft</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => void confirmDelete()}>{isDeleting ? 'Deleting…' : 'Delete permanently'}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
