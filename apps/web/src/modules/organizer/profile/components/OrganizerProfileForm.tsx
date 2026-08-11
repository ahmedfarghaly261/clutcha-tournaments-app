import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  mapOrganizerProfileToFormValues,
  organizerProfileDefaultValues,
  useOrganizerProfileService,
} from '../services/organizer-profile.service'
import {
  organizerProfileSchema,
  type OrganizerProfileFormValues,
} from '../schemas/organizer-profile.schema'

const inputClass =
  'w-full rounded-md border border-[#27272a] bg-[#09090b] px-3 py-2.5 text-sm text-[#e5e1e4] outline-none transition-[border-color,box-shadow] placeholder:text-[#716679] focus:border-[#ddb7ff] focus:shadow-[0_0_0_2px_rgba(221,183,255,0.2)]'

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-[#cfc2d6]'

function getProfileErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 400 || error.response?.status === 413) {
      return 'Some profile fields or uploaded images are invalid. Check the form and try again.'
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'You are not allowed to update this organizer profile.'
    }
  }

  return 'Could not save organizer profile. Please try again.'
}

export function OrganizerProfileForm() {
  const {
    profileQuery,
    updateProfile,
    uploadProfileLogo,
    uploadProfileCover,
    isUpdatingProfile,
  } = useOrganizerProfileService()
  const [formError, setFormError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'cover' | null>(null)
  const {
    register,
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OrganizerProfileFormValues>({
    resolver: zodResolver(organizerProfileSchema),
    defaultValues: organizerProfileDefaultValues,
  })

  useEffect(() => {
    if (profileQuery.data) {
      reset(mapOrganizerProfileToFormValues(profileQuery.data))
    }
  }, [profileQuery.data, reset])

  const logoUrl = useWatch({ control, name: 'logoUrl' }) ?? ''
  const coverUrl = useWatch({ control, name: 'coverUrl' }) ?? ''

  const handleImageUpload = async (kind: 'logo' | 'cover', file: File | undefined) => {
    if (!file) return

    setFormError(null)
    setSavedMessage(null)
    setUploadingImage(kind)

    try {
      const profile =
        kind === 'logo' ? await uploadProfileLogo(file) : await uploadProfileCover(file)
      reset(mapOrganizerProfileToFormValues(profile))
      setSavedMessage(`${kind === 'logo' ? 'Logo' : 'Cover'} image uploaded.`)
    } catch (error) {
      setFormError(getProfileErrorMessage(error))
    } finally {
      setUploadingImage(null)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSavedMessage(null)

    try {
      const profile = await updateProfile(values)
      reset(mapOrganizerProfileToFormValues(profile))
      setSavedMessage('Organizer profile saved.')
    } catch (error) {
      setFormError(getProfileErrorMessage(error))
    }
  })

  if (profileQuery.isLoading) {
    return (
      <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6 text-sm text-[#cfc2d6]">
        Loading organizer profile...
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-xl border border-[rgba(255,180,171,0.5)] bg-[rgba(147,0,10,0.22)] p-6 text-sm text-[#ffdad6]">
        Could not load organizer profile. Please refresh and try again.
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <input type="hidden" {...register('logoUrl')} />
      <input type="hidden" {...register('coverUrl')} />

      <section className="grid gap-4 rounded-xl border border-[#27272a] bg-[#18181b] p-5 md:grid-cols-2">
        <ProfileField
          label="Organization Name"
          error={errors.organizationName?.message}
          input={
            <input
              className={`${inputClass} cursor-not-allowed opacity-75`}
              placeholder="CLUTCHA Events"
              readOnly
              {...register('organizationName')}
            />
          }
        />
        <ProfileField
          label="Contact Email"
          error={errors.contactEmail?.message}
          input={
            <input
              className={`${inputClass} cursor-not-allowed opacity-75`}
              type="email"
              placeholder="events@clutcha.gg"
              readOnly
              {...register('contactEmail')}
            />
          }
        />
        <ProfileField
          label="Country"
          error={errors.country?.message}
          input={<input className={inputClass} placeholder="Egypt" {...register('country')} />}
        />
        <ProfileField
          label="City"
          error={errors.city?.message}
          input={<input className={inputClass} placeholder="Cairo" {...register('city')} />}
        />
        <ProfileField
          label="Support Phone"
          error={errors.supportPhone?.message}
          input={
            <input
              className={inputClass}
              placeholder="+20 100 000 0000"
              {...register('supportPhone')}
            />
          }
        />
        <ProfileField
          label="Website URL"
          error={errors.websiteUrl?.message}
          input={
            <input
              className={inputClass}
              type="url"
              placeholder="https://clutcha.gg"
              {...register('websiteUrl')}
            />
          }
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-[#27272a] bg-[#18181b] p-5 md:grid-cols-2">
        <ImageUploadField
          label="Logo Image"
          imageUrl={logoUrl}
          isUploading={uploadingImage === 'logo'}
          helperText="Upload a square PNG, JPEG, or WebP logo up to 5MB."
          onFileChange={(file) => void handleImageUpload('logo', file)}
        />
        <ImageUploadField
          label="Cover Image"
          imageUrl={coverUrl}
          isUploading={uploadingImage === 'cover'}
          helperText="Upload a wide PNG, JPEG, or WebP cover image up to 5MB."
          onFileChange={(file) => void handleImageUpload('cover', file)}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-[#27272a] bg-[#18181b] p-5 md:grid-cols-3">
        <ProfileField
          label="Facebook URL"
          error={errors.facebookUrl?.message}
          input={<input className={inputClass} type="url" {...register('facebookUrl')} />}
        />
        <ProfileField
          label="Instagram URL"
          error={errors.instagramUrl?.message}
          input={<input className={inputClass} type="url" {...register('instagramUrl')} />}
        />
        <ProfileField
          label="Discord URL"
          error={errors.discordUrl?.message}
          input={<input className={inputClass} type="url" {...register('discordUrl')} />}
        />
      </section>

      <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
        <label className={labelClass} htmlFor="organizer-profile-description">
          Description
        </label>
        <textarea
          className={`${inputClass} min-h-36 resize-y`}
          id="organizer-profile-description"
          placeholder="Tell teams what kind of tournaments you run, where you operate, and how captains can contact you."
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-2 text-xs leading-5 text-[#ffb4ab]" role="alert">
            {errors.description.message}
          </p>
        )}
      </section>

      {formError && (
        <p
          className="rounded-md border border-[rgba(255,180,171,0.5)] bg-[rgba(147,0,10,0.22)] px-4 py-3 text-sm text-[#ffdad6]"
          role="alert"
        >
          {formError}
        </p>
      )}

      {savedMessage && (
        <p
          className="rounded-md border border-[rgba(78,222,163,0.45)] bg-[rgba(0,165,114,0.14)] px-4 py-3 text-sm text-[#6ffbbe]"
          role="status"
        >
          {savedMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          className="rounded-md bg-[#ddb7ff] px-5 py-2.5 text-sm font-bold text-[#2c0051] transition-colors hover:bg-[#f0dbff] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isUpdatingProfile || uploadingImage !== null || !isDirty}
        >
          {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

function ImageUploadField({
  label,
  imageUrl,
  isUploading,
  helperText,
  onFileChange,
}: {
  label: string
  imageUrl: string
  isUploading: boolean
  helperText: string
  onFileChange: (file: File | undefined) => void
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="rounded-lg border border-[#27272a] bg-[#09090b] p-3">
        <div className="mb-3 flex min-h-36 items-center justify-center overflow-hidden rounded-md border border-dashed border-[#4d4354] bg-[#131315]">
          {imageUrl ? (
            <img className="max-h-52 w-full object-cover" src={imageUrl} alt={`${label} preview`} />
          ) : (
            <span className="px-4 text-center text-sm text-[#716679]">No image uploaded yet</span>
          )}
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-md bg-[#27212d] px-4 py-2.5 text-sm font-bold text-[#f0dbff] transition-colors hover:bg-[#35283f]">
          <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isUploading}
            onChange={(event) => {
              onFileChange(event.currentTarget.files?.[0])
              event.currentTarget.value = ''
            }}
          />
        </label>
        <p className="mt-2 text-xs leading-5 text-[#cfc2d6]">{helperText}</p>
      </div>
    </div>
  )
}

function ProfileField({
  label,
  input,
  error,
}: {
  label: string
  input: ReactNode
  error?: string
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {input}
      {error && (
        <span className="mt-2 block text-xs leading-5 text-[#ffb4ab]" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
