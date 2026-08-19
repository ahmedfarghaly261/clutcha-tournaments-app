import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CaptainProfile } from '../types/captain-profile.types'

type CaptainProfileViewProps = {
  profile: CaptainProfile
  onEdit: () => void
}

export function CaptainProfileView({ profile, onEdit }: CaptainProfileViewProps) {
  const joinedAt = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.createdAt))

  return (
    <div className="space-y-6">
      {!profile.profileComplete && (
        <Alert className="border-[#786024] bg-[#302715] text-[#ffe08b]">
          <CircleAlert className="h-5 w-5" />
          <AlertTitle>Your profile needs one more detail</AlertTitle>
          <AlertDescription className="text-[#dbc991]">
            Add an international phone number so your captain profile is ready for tournament registration.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-[#2c3d46] bg-[#151a20] shadow-[0_0_70px_rgba(82,205,244,0.08)]">
        <div className="relative h-36 bg-[radial-gradient(circle_at_18%_12%,rgba(113,220,255,0.22),transparent_32%),linear-gradient(120deg,#182932,#101319_58%,#171527)]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(113,220,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(113,220,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
          <Button className="absolute right-5 top-5" onClick={onEdit}>
            <Pencil /> Edit profile
          </Button>
        </div>

        <CardContent className="relative pt-0">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-[#151a20] bg-[#172d37] text-3xl font-black text-[#86e4ff] shadow-lg">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pb-2">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#71dcff]">
                  Team Captain
                </p>
                <h2 className="truncate text-3xl font-black tracking-[-0.04em] text-[#f4f8fc]">
                  {profile.displayName}
                </h2>
                <p className="truncate text-sm text-[#9ca9b8]">{profile.email}</p>
              </div>
            </div>

            <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#315963] bg-[#173039] px-3 py-1.5 text-xs font-black text-[#91e8ff]">
              {profile.profileComplete ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
              {profile.profileComplete ? 'Profile complete' : 'Setup incomplete'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-[#2c343e] bg-[#15191f]">
          <CardHeader>
            <Mail className="h-5 w-5 text-[#71dcff]" />
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ProfileDetail icon={Mail} label="Account email" value={profile.email} />
            <ProfileDetail icon={Phone} label="Phone number" value={profile.phoneNumber} />
            <ProfileDetail icon={MessageCircle} label="Discord username" value={profile.discordUsername} />
            <ProfileDetail icon={CalendarDays} label="Joined CLUTCHA" value={joinedAt} />
          </CardContent>
        </Card>

        <Card className="border-[#2c343e] bg-[#15191f]">
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-[#cabdff]" />
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccountValue label="Role" value="Captain" />
            <AccountValue label="Status" value={profile.status.replaceAll('_', ' ')} />
            <p className="text-xs leading-5 text-[#8f9bab]">
              Your email, role, and account status are controlled by your CLUTCHA account and cannot be changed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value?: string | null
}) {
  return (
    <div className="rounded-lg border border-[#2d3540] bg-[#11151a] p-4">
      <div className="mb-2 flex items-center gap-2 text-[#7fdffb]">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="break-words text-sm font-bold text-[#edf3f8]">{value || 'Not added yet'}</p>
    </div>
  )
}

function AccountValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2d3540] pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-[#8f9baa]">{label}</span>
      <span className="text-xs font-black text-[#edf3f8]">{value}</span>
    </div>
  )
}
