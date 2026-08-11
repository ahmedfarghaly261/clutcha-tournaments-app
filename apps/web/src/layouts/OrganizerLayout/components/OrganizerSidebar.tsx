import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  CircleHelp,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  UsersRound,
  ChartColumn,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'

type OrganizerNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const organizerNavItems: OrganizerNavItem[] = [
  { label: 'Dashboard', to: '/organizer', icon: LayoutDashboard, end: true },
  { label: 'Stations', to: '/organizer/stations', icon: Monitor },
  { label: 'Teams', to: '/organizer/teams', icon: UsersRound },
  { label: 'Matchmaking', to: '/organizer/matchmaking', icon: Gamepad2 },
  { label: 'Schedule', to: '/organizer/schedule', icon: CalendarDays },
  { label: 'Reports', to: '/organizer/reports', icon: ChartColumn },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold transition-colors',
    isActive
      ? 'bg-[#b55cf6] text-[#17131c] shadow-[0_0_18px_rgba(181,92,246,0.24)]'
      : 'text-[#f5eefe] hover:bg-[#27212d] hover:text-white',
  ].join(' ')

export function OrganizerSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    void logout().then(() => navigate('/login', { replace: true }))
  }

  const userInitial = user?.displayName?.trim().charAt(0).toUpperCase() ?? 'C'

  return (
    <aside className="flex min-h-screen w-[184px] shrink-0 flex-col border-r border-[#2b2630] bg-[#1b191c] text-[#f8f2ff]">
      <div className="flex flex-1 flex-col px-3 py-4">
        <Link
          className="mb-5 flex items-center gap-2"
          to="/organizer"
          aria-label="CLUTCHA organizer dashboard"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#7157ff]/70 bg-[#111014] p-1 shadow-[0_0_12px_rgba(113,87,255,0.28)]">
            <img className="h-full w-full rounded object-cover" src="/logo.png" alt="" />
          </span>
          <span className="leading-none">
            <span className="block text-xl font-extrabold tracking-[-0.04em] text-[#f0dbff]">
              CLUTCHA
            </span>
            <span className="block text-[9px] font-bold text-white">Command Center</span>
          </span>
        </Link>

        <Link
          className="mb-7 flex items-center justify-center gap-2 rounded-md bg-[#ddb7ff] px-3 py-2.5 text-[11px] font-bold text-[#2c0051] transition-colors hover:bg-[#f0dbff]"
          to="/organizer/tournaments/new"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Tournament</span>
        </Link>

        <nav className="space-y-2" aria-label="Organizer navigation">
          {organizerNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink key={item.to} className={navLinkClass} to={item.to} end={item.end}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-[#2b2630] px-3 py-4">
        <Link
          className="mb-3 flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white"
          to="/organizer/help"
        >
          <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Help</span>
        </Link>

        <button
          className="mb-5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>

        <Link
          className="flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-[#27212d]"
          to="/organizer/profile"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#4cd7f6]/40 bg-[#0e0e10] text-[11px] font-black text-[#4cd7f6]">
            {userInitial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold text-white">
              {user?.displayName ?? 'CLUTCHA Admin'}
            </span>
            <span className="block truncate text-[9px] font-semibold text-[#cfc2d6]">
              Organizer
            </span>
          </span>
        </Link>
      </div>
    </aside>
  )
}
