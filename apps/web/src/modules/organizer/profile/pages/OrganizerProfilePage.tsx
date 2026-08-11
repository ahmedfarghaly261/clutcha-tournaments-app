import { useState } from 'react'
import { OrganizerProfileForm } from '../components/OrganizerProfileForm'
import { OrganizerProfileView } from '../components/OrganizerProfileView'
import { useOrganizerProfileService } from '../services/organizer-profile.service'

export function OrganizerProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const {
    profileQuery,
    updateProfile,
    uploadProfileLogo,
    uploadProfileCover,
    isUpdatingProfile,
  } = useOrganizerProfileService()

  const profile = profileQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#ddb7ff]">
            Organizer Command Center
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-[#e5e1e4]">
            Organizer Profile
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#cfc2d6]">
            {isEditing
              ? 'Edit the public organizer information captains and teams will see. Profile changes use PATCH, while logo and cover images use upload endpoints.'
              : 'View the public organizer information captains and teams will use to identify and contact you.'}
          </p>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#ddb7ff]">
          {isEditing ? 'Edit Mode' : 'View Mode'}
        </p>
      </header>

      {profileQuery.isLoading && (
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6 text-sm text-[#cfc2d6]">
          Loading organizer profile...
        </div>
      )}

      {profileQuery.isError && (
        <div className="rounded-xl border border-[rgba(255,180,171,0.5)] bg-[rgba(147,0,10,0.22)] p-6 text-sm text-[#ffdad6]">
          Could not load organizer profile. Please refresh and try again.
        </div>
      )}

      {profile &&
        (isEditing ? (
          <OrganizerProfileForm
            profile={profile}
            updateProfile={updateProfile}
            uploadProfileLogo={uploadProfileLogo}
            uploadProfileCover={uploadProfileCover}
            isUpdatingProfile={isUpdatingProfile}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        ) : (
          <OrganizerProfileView profile={profile} onEdit={() => setIsEditing(true)} />
        ))}
    </div>
  )
}
