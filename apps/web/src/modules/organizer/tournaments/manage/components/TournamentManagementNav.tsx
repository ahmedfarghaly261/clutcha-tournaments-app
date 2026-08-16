import { Link } from 'react-router-dom'
import { Computer, GitBranch, MapPin, Rocket, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TournamentManagementSection } from '../types/tournament-management.types'

type TournamentManagementNavProps = {
  tournamentId: string
  active: TournamentManagementSection
}

export function TournamentManagementNav({
  tournamentId,
  active,
}: TournamentManagementNavProps) {
  return (
    <nav
      aria-label="Tournament management"
      className="mb-7 flex flex-wrap gap-2 rounded-xl border border-[#39343c] bg-[#171518] p-2"
    >
      <Button
        render={<Link to={`/organizer/tournaments/${tournamentId}/manage`} />}
        variant={active === 'general' ? 'default' : 'ghost'}
        size="sm"
      >
        <Settings2 className="h-4 w-4" /> General settings
      </Button>
      <Button
        render={<Link to={`/organizer/tournaments/${tournamentId}/manage/configuration`} />}
        variant={active === 'configuration' ? 'default' : 'ghost'}
        size="sm"
      >
        <MapPin className="h-4 w-4" /> Mode configuration
      </Button>
      <Button
        render={<Link to={`/organizer/tournaments/${tournamentId}/manage/gaming-rooms`} />}
        variant={active === 'gaming-rooms' ? 'default' : 'ghost'}
        size="sm"
      >
        <Computer className="h-4 w-4" /> Gaming rooms
      </Button>
      <Button
        render={<Link to={`/organizer/tournaments/${tournamentId}/manage/bracket`} />}
        variant={active === 'bracket' ? 'default' : 'ghost'}
        size="sm"
      >
        <GitBranch className="h-4 w-4" /> Bracket
      </Button>
      <Button
        render={<Link to={`/organizer/tournaments/${tournamentId}/manage/lifecycle`} />}
        variant={active === 'lifecycle' ? 'default' : 'ghost'}
        size="sm"
      >
        <Rocket className="h-4 w-4" /> Publish & lifecycle
      </Button>
    </nav>
  )
}
