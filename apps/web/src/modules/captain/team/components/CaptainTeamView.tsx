import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Gamepad2,
  Globe2,
  Link2,
  MessageCircle,
  Pencil,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CaptainTeam } from '../types/captain-team.types'

type CaptainTeamViewProps = {
  team: CaptainTeam
  onEdit: () => void
}

function formatGameKey(gameKey: string): string {
  return gameKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function CaptainTeamView({ team, onEdit }: CaptainTeamViewProps) {
  const createdAt = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(team.createdAt))

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[#2e3c47] bg-[#15191f] shadow-[0_0_70px_rgba(82,205,244,0.08)]">
        <div className="relative h-52 bg-[radial-gradient(circle_at_20%_10%,rgba(113,220,255,0.25),transparent_31%),linear-gradient(120deg,#172832,#11141a_58%,#1b1729)]">
          {team.coverUrl && (
            <img className="absolute inset-0 h-full w-full object-cover opacity-60" src={team.coverUrl} alt="" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#15191f] via-transparent to-black/20" />
          <Button className="absolute right-5 top-5" onClick={onEdit}>
            <Pencil /> Edit team
          </Button>
        </div>

        <CardContent className="relative pt-0">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#15191f] bg-[#122a34] text-4xl font-black text-[#82e3ff] shadow-xl">
                {team.logoUrl ? (
                  <img className="h-full w-full object-cover" src={team.logoUrl} alt={`${team.name} logo`} />
                ) : team.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pb-2">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#315963] bg-[#173039] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#91e8ff]">
                    {team.status}
                  </span>
                  <span className="text-xs font-bold text-[#8c99a9]">/{team.slug}</span>
                </div>
                <h2 className="truncate text-3xl font-black tracking-[-0.04em] text-[#f4f8fc]">{team.name}</h2>
                <p className="mt-1 text-sm font-bold text-[#a5b1c0]">{formatGameKey(team.gameKey)}</p>
              </div>
            </div>

            <Button render={<Link to="/captain/roster" />} variant="outline" className="mb-2">
              <UsersRound /> Manage roster
            </Button>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-[#a4afbd]">
            {team.description || 'No team description has been added yet.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-[#2c343e] bg-[#15191f]">
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-[#71dcff]" />
            <CardTitle>Team identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TeamDetail icon={Gamepad2} label="Primary game" value={formatGameKey(team.gameKey)} />
            <TeamDetail icon={Globe2} label="Region" value={team.region} />
            <TeamDetail icon={CalendarDays} label="Registered" value={createdAt} />
            <TeamDetail icon={Link2} label="Team slug" value={team.slug} />
          </CardContent>
        </Card>

        <Card className="border-[#2c343e] bg-[#15191f]">
          <CardHeader>
            <MessageCircle className="h-5 w-5 text-[#cabdff]" />
            <CardTitle>Private coordination</CardTitle>
          </CardHeader>
          <CardContent>
            {team.discordServerUrl ? (
              <a
                className="flex items-center justify-between gap-3 rounded-lg border border-[#3b3650] bg-[#191728] p-4 text-sm font-bold text-[#d8cfff] transition hover:border-[#7265a0]"
                href={team.discordServerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open team Discord <Link2 className="h-4 w-4" />
              </a>
            ) : (
              <p className="rounded-lg border border-dashed border-[#343b45] p-5 text-center text-sm text-[#8f9baa]">
                No team Discord server has been added.
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-[#8491a1]">
              This private invite is for Captain operations and is not exposed in public tournament responses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TeamDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gamepad2
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
