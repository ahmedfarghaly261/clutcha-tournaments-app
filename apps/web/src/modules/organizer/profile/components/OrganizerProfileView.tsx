import type { ReactNode } from 'react'
import type { OrganizerProfileResponseDto } from '@/api/generated/organizer'

type OrganizerProfileViewProps = {
  profile: OrganizerProfileResponseDto
  onEdit: () => void
}

export function OrganizerProfileView({ profile, onEdit }: OrganizerProfileViewProps) {
  const organizationName = profile.user.displayName
  const contactEmail = profile.user.email

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] shadow-[0_0_80px_rgba(132,43,210,0.08)]">
        <div className="relative min-h-56 bg-[#09090b]">
          {profile.coverUrl ? (
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-80"
              src={profile.coverUrl}
              alt={`${organizationName} cover`}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(221,183,255,0.18),transparent_28%),linear-gradient(135deg,#18181b,#09090b)]" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#18181b] via-[#18181b]/50 to-transparent" />
          <button
            className="absolute right-5 top-5 rounded-md bg-[#ddb7ff] px-4 py-2 text-sm font-bold text-[#2c0051] transition-colors hover:bg-[#f0dbff]"
            type="button"
            onClick={onEdit}
          >
            Edit Profile
          </button>
        </div>

        <div className="relative px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#4d4354] bg-[#09090b] shadow-[0_0_28px_rgba(221,183,255,0.14)]">
              {profile.logoUrl ? (
                <img
                  className="h-full w-full object-cover"
                  src={profile.logoUrl}
                  alt={`${organizationName} logo`}
                />
              ) : (
                <span className="text-3xl font-black text-[#ddb7ff]">
                  {organizationName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-3xl font-bold tracking-[-0.03em] text-[#e5e1e4]">
                {organizationName}
              </h2>
              <p className="text-sm text-[#cfc2d6]">{contactEmail}</p>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-[#cfc2d6]">
            {profile.description || 'No organizer description added yet.'}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ProfileInfoCard title="Location">
          <ProfileValue label="Country" value={profile.country} />
          <ProfileValue label="City" value={profile.city} />
        </ProfileInfoCard>

        <ProfileInfoCard title="Contact">
          <ProfileValue label="Email" value={contactEmail} />
          <ProfileValue label="Support Phone" value={profile.supportPhone} />
        </ProfileInfoCard>

        <ProfileInfoCard title="Web">
          <ProfileLink label="Website" value={profile.websiteUrl} />
          <ProfileLink label="Discord" value={profile.discordUrl} />
        </ProfileInfoCard>

        <ProfileInfoCard title="Social">
          <ProfileLink label="Facebook" value={profile.facebookUrl} />
          <ProfileLink label="Instagram" value={profile.instagramUrl} />
        </ProfileInfoCard>
      </section>
    </div>
  )
}

function ProfileInfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#ddb7ff]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function ProfileValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#716679]">{label}</p>
      <p className="mt-1 text-sm text-[#e5e1e4]">{value || 'Not added yet'}</p>
    </div>
  )
}

function ProfileLink({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#716679]">{label}</p>
      {value ? (
        <a
          className="mt-1 block truncate text-sm font-semibold text-[#ddb7ff] hover:text-[#f0dbff] hover:underline"
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm text-[#e5e1e4]">Not added yet</p>
      )}
    </div>
  )
}
