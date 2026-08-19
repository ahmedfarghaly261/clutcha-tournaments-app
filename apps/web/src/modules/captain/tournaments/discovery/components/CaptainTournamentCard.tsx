import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Gamepad2,
  Globe2,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TournamentDiscoveryCard } from '../types/captain-tournament-discovery.types'

type CaptainTournamentCardProps = {
  tournament: TournamentDiscoveryCard
}

const statusStyles: Record<string, string> = {
  REGISTRATION_OPEN: 'border-[#28715a] bg-[#153b30] text-[#91edcf]',
  PUBLISHED: 'border-[#5a4b79] bg-[#29213d] text-[#d4c4ff]',
  REGISTRATION_CLOSED: 'border-[#775f2e] bg-[#382d18] text-[#f2d389]',
  CHECK_IN_OPEN: 'border-[#2c6577] bg-[#173440] text-[#91e3ff]',
  IN_PROGRESS: 'border-[#315f87] bg-[#182f44] text-[#9ed0ff]',
  COMPLETED: 'border-[#47515d] bg-[#252b32] text-[#c0c8d1]',
  POSTPONED: 'border-[#78434b] bg-[#391f24] text-[#ffb9c0]',
}

export function CaptainTournamentCard({ tournament }: CaptainTournamentCardProps) {
  return (
    <Card className="group overflow-hidden border-[#2d3540] bg-[#15191f] transition hover:-translate-y-0.5 hover:border-[#486576] hover:shadow-[0_18px_50px_rgba(37,159,196,0.1)]">
      <div className="relative h-44 overflow-hidden bg-[radial-gradient(circle_at_25%_15%,rgba(113,220,255,0.2),transparent_34%),linear-gradient(130deg,#182b35,#11151a_62%,#201930)]">
        {tournament.coverUrl && (
          <img
            className="h-full w-full object-cover opacity-65 transition duration-300 group-hover:scale-[1.03]"
            src={tournament.coverUrl}
            alt={`${tournament.name} cover`}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#15191f] via-transparent to-black/20" />
        <span className={cn(
          'absolute left-4 top-4 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em]',
          statusStyles[tournament.status] ?? statusStyles.PUBLISHED,
        )}>
          {tournament.statusLabel}
        </span>
        <span className="absolute right-4 top-4 rounded-full border border-[#3b4652] bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] text-[#d7e0e9] backdrop-blur-sm">
          {tournament.modeLabel}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#354651] bg-[#172831] text-lg font-black text-[#7fe1ff]">
            {tournament.logoUrl ? <img className="h-full w-full object-cover" src={tournament.logoUrl} alt="" /> : tournament.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#71dcff]">{tournament.gameLabel}</p>
            <h2 className="mt-1 line-clamp-2 text-lg font-black leading-6 text-[#f0f5fa]">{tournament.name}</h2>
          </div>
        </div>

        <p className="mb-5 line-clamp-2 min-h-10 text-sm leading-5 text-[#95a2b1]">
          {tournament.shortDescription || 'Competitive tournament hosted on CLUTCHA.'}
        </p>

        <div className="grid grid-cols-2 gap-3 border-y border-[#2c343e] py-4">
          <TournamentFact icon={CalendarClock} label="Starts" value={tournament.startsAtLabel} />
          <TournamentFact icon={UsersRound} label="Team capacity" value={`${tournament.minimumTeams}–${tournament.maximumTeams}`} />
          <TournamentFact icon={Trophy} label="Prize pool" value={tournament.prizeLabel} />
          <TournamentFact icon={CircleDollarSign} label="Registration" value={tournament.registrationFeeLabel} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 font-bold text-[#aeb9c5]"><Gamepad2 className="h-4 w-4 text-[#71dcff]" />{tournament.formatLabel}</span>
          <span className="flex items-center gap-2 font-bold text-[#8996a5]"><Globe2 className="h-4 w-4" />{tournament.timezone}</span>
        </div>
        <p className="mt-3 text-xs text-[#82909f]">Registration closes {tournament.registrationClosesAtLabel}</p>
        <Button render={<Link to={`/captain/tournaments/${tournament.slug}`} />} variant="outline" className="mt-5 w-full justify-between">
          View tournament <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}

function TournamentFact({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-[#7bdcf8]"><Icon className="h-3.5 w-3.5" /><span className="text-[9px] font-black uppercase tracking-[0.06em]">{label}</span></div>
      <p className="truncate text-xs font-bold text-[#e6edf3]" title={value}>{value}</p>
    </div>
  )
}
