import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
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
    if (error.response?.status === 400) {
      return 'Some profile fields are invalid. Check the highlighted inputs and try again.'
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'You are not allowed to update this organizer profile.'
    }
  }

  return 'Could not save organizer profile. Please try again.'
}

export function OrganizerProfileForm() {
  const { profileQuery, updateProfile, isUpdatingProfile } = useOrganizerProfileService()
  const [formError, setFormError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const {
    register,
    reset,
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
        <ProfileField
          label="Logo URL"
          error={errors.logoUrl?.message}
          input={
            <input
              className={inputClass}
              type="url"
              placeholder="https://cdn.example.com/logo.png"
              {...register('logoUrl')}
            />
          }
        />
        <ProfileField
          label="Cover URL"
          error={errors.coverUrl?.message}
          input={
            <input
              className={inputClass}
              type="url"
              placeholder="https://cdn.example.com/cover.png"
              {...register('coverUrl')}
            />
          }
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
          disabled={isUpdatingProfile || !isDirty}
        >
          {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
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
