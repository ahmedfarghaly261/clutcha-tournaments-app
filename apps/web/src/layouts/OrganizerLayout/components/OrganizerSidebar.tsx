import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

type IconName =
  | 'dashboard'
  | 'stations'
  | 'teams'
  | 'matchmaking'
  | 'schedule'
  | 'reports'
  | 'help'
  | 'logout'

type OrganizerNavItem = {
  label: string
  to: string
  icon: IconName
  end?: boolean
}

const organizerNavItems: OrganizerNavItem[] = [
  { label: 'Dashboard', to: '/organizer', icon: 'dashboard', end: true },
  { label: 'Stations', to: '/organizer/stations', icon: 'stations' },
  { label: 'Teams', to: '/organizer/teams', icon: 'teams' },
  { label: 'Matchmaking', to: '/organizer/matchmaking', icon: 'matchmaking' },
  { label: 'Schedule', to: '/organizer/schedule', icon: 'schedule' },
  { label: 'Reports', to: '/organizer/reports', icon: 'reports' },
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
          <span className="text-lg leading-none" aria-hidden="true">
            +
          </span>
          <span>New Tournament</span>
        </Link>

        <nav className="space-y-2" aria-label="Organizer navigation">
          {organizerNavItems.map((item) => (
            <NavLink key={item.to} className={navLinkClass} to={item.to} end={item.end}>
              <SidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#2b2630] px-3 py-4">
        <Link
          className="mb-3 flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white"
          to="/organizer/help"
        >
          <SidebarIcon name="help" />
          <span>Help</span>
        </Link>

        <button
          className="mb-5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white"
          type="button"
          onClick={handleLogout}
        >
          <SidebarIcon name="logout" />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center gap-2 px-2">
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
        </div>
      </div>
    </aside>
  )
}

function SidebarIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: 'h-4 w-4 shrink-0',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  } as const

  switch (name) {
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <path d="M4 4h6v6H4z" />
          <path d="M14 4h6v6h-6z" />
          <path d="M4 14h6v6H4z" />
          <path d="M14 14h6v6h-6z" />
        </svg>
      )
    case 'stations':
      return (
        <svg {...commonProps}>
          <path d="M4 5h16v10H4z" />
          <path d="M9 19h6" />
          <path d="M12 15v4" />
        </svg>
      )
    case 'teams':
      return (
        <svg {...commonProps}>
          <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
          <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M4.5 17.5c.3-1.4 1.3-2.5 2.5-3" />
          <path d="M19.5 17.5c-.3-1.4-1.3-2.5-2.5-3" />
        </svg>
      )
    case 'matchmaking':
      return (
        <svg {...commonProps}>
          <path d="M7 15h.01" />
          <path d="M17 15h.01" />
          <path d="M9 11h6" />
          <path d="M8 7h8l3 4v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5z" />
        </svg>
      )
    case 'schedule':
      return (
        <svg {...commonProps}>
          <path d="M7 3v3" />
          <path d="M17 3v3" />
          <path d="M4 8h16" />
          <path d="M5 5h14v15H5z" />
          <path d="M8 12h3" />
          <path d="M8 16h5" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...commonProps}>
          <path d="M5 4h14v16H5z" />
          <path d="M9 16V9" />
          <path d="M12 16v-4" />
          <path d="M15 16v-6" />
        </svg>
      )
    case 'help':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.4 2.4 0 0 1 4.4 1.4c0 1.8-2.2 2-2.2 3.6" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M12 3h7v18h-7" />
        </svg>
      )
  }
}
