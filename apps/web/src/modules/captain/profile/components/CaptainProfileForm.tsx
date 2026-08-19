import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { CircleAlert, Info, LoaderCircle, Save, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { captainProfileSchema } from '../schemas/captain-profile.schema'
import {
  captainProfileDefaultValues,
  mapCaptainProfileFormToUpdate,
  mapCaptainProfileToFormValues,
} from '../services/captain-profile.service'
import type {
  CaptainProfile,
  CaptainProfileFormValues,
} from '../types/captain-profile.types'

type CaptainProfileFormProps = {
  profile: CaptainProfile
  isSaving: boolean
  onCancel: () => void
  onSave: (values: ReturnType<typeof mapCaptainProfileFormToUpdate>) => Promise<CaptainProfile>
  onSaved: () => void
}

function getProfileErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'Could not update your profile. Please try again.'

  if (error.response?.status === 400) {
    return 'Some profile information is invalid. Check each field and try again.'
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'Your session cannot update this Captain profile. Sign in again and retry.'
  }

  return 'Could not update your profile. Please try again.'
}

export function CaptainProfileForm({
  profile,
  isSaving,
  onCancel,
  onSave,
  onSaved,
}: CaptainProfileFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CaptainProfileFormValues>({
    resolver: zodResolver(captainProfileSchema),
    defaultValues: captainProfileDefaultValues,
  })

  useEffect(() => {
    reset(mapCaptainProfileToFormValues(profile))
  }, [profile, reset])

  const submitProfile = handleSubmit(async (values) => {
    setRequestError(null)

    try {
      const updatedProfile = await onSave(mapCaptainProfileFormToUpdate(values))
      reset(mapCaptainProfileToFormValues(updatedProfile))
      onSaved()
    } catch (error) {
      setRequestError(getProfileErrorMessage(error))
    }
  })

  return (
    <form className="space-y-6" onSubmit={submitProfile} noValidate>
      <Alert className="border-[#315363] bg-[#13262f] text-[#a7eaff]">
        <Info className="h-5 w-5" />
        <AlertTitle>Private captain contact</AlertTitle>
        <AlertDescription className="text-[#a5cbd7]">
          Your phone number and Discord username are private operational details used for tournament coordination.
        </AlertDescription>
      </Alert>

      <Card className="border-[#2c343e] bg-[#15191f]">
        <CardHeader>
          <CardTitle>Edit Captain Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <ProfileField label="Display name" error={errors.displayName?.message}>
            <Input
              autoComplete="name"
              placeholder="Ahmed Farghaly"
              aria-invalid={Boolean(errors.displayName)}
              {...register('displayName')}
            />
          </ProfileField>

          <ProfileField label="Account email" hint="Email cannot be changed here.">
            <Input
              className="cursor-not-allowed"
              type="email"
              readOnly
              {...register('email')}
            />
          </ProfileField>

          <ProfileField
            label="Phone number"
            hint="International E.164 format. Adding this completes your profile."
            error={errors.phoneNumber?.message}
          >
            <Input
              autoComplete="tel"
              inputMode="tel"
              placeholder="+201001234567"
              aria-invalid={Boolean(errors.phoneNumber)}
              {...register('phoneNumber')}
            />
          </ProfileField>

          <ProfileField
            label="Discord username"
            hint="Optional. Use your username, not a server invite URL."
            error={errors.discordUsername?.message}
          >
            <Input
              autoComplete="off"
              placeholder="captain.username"
              aria-invalid={Boolean(errors.discordUsername)}
              {...register('discordUsername')}
            />
          </ProfileField>
        </CardContent>
      </Card>

      {requestError && (
        <Alert className="border-[#78444a] bg-[#351d21] text-[#ffd1d4]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Profile was not saved</AlertTitle>
          <AlertDescription className="text-[#e6b8bc]">{requestError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
          <X /> Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}

function ProfileField({
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
