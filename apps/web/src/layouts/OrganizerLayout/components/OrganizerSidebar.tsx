import { type ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type OrganizerNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

type CollapsedTooltipProps = {
  children: ReactNode
  enabled: boolean
  label: string
}

const organizerNavItems: OrganizerNavItem[] = [
  { label: 'Dashboard', to: '/organizer', icon: LayoutDashboard, end: true },
  { label: 'Tournaments', to: '/organizer/tournaments', icon: Trophy },
  { label: 'Stations', to: '/organizer/stations', icon: Monitor },
  { label: 'Teams', to: '/organizer/teams', icon: UsersRound },
  { label: 'Matchmaking', to: '/organizer/matchmaking', icon: Gamepad2 },
  { label: 'Schedule', to: '/organizer/schedule', icon: CalendarDays },
  { label: 'Reports', to: '/organizer/reports', icon: ChartColumn },
]

function CollapsedTooltip({ children, enabled, label }: CollapsedTooltipProps) {
  if (!enabled) {
    return children
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function OrganizerSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    void logout().then(() => navigate('/login', { replace: true }))
  }

  const userInitial = user?.displayName?.trim().charAt(0).toUpperCase() ?? 'C'
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'

  const isNavItemActive = (item: OrganizerNavItem) => {
    if (item.end) {
      return currentPath === item.to
    }

    if (item.to === '/organizer/tournaments' && currentPath === '/organizer/tournaments/new') {
      return false
    }

    return currentPath === item.to || currentPath.startsWith(`${item.to}/`)
  }

  const navLinkClass = (isActive: boolean) =>
    cn(
      'group flex min-h-10 w-full items-center rounded-md text-xs font-bold transition-colors',
      isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
      isActive
        ? 'bg-[#b55cf6] text-[#17131c] shadow-[0_0_18px_rgba(181,92,246,0.24)]'
        : 'text-[#f5eefe] hover:bg-[#27212d] hover:text-white',
    )

  return (
    <TooltipProvider delayDuration={120}>
      <aside
        className={cn(
          'sticky left-0 top-0 z-30 flex h-screen max-h-screen min-h-screen shrink-0 flex-col border-r border-[#2b2630] bg-[#1b191c] text-[#f8f2ff] transition-[width] duration-200',
          isCollapsed ? 'w-[72px]' : 'w-[184px]',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="absolute -right-4 top-8 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3240] bg-[#111014] text-[#f5eefe] shadow-[0_10px_24px_rgba(0,0,0,0.34)] transition-colors hover:border-[#b55cf6] hover:bg-[#211a27] hover:text-white"
              type="button"
              aria-label={isCollapsed ? 'Expand organizer sidebar' : 'Collapse organizer sidebar'}
              onClick={() => setIsCollapsed((current) => !current)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>

        <div className={cn('flex flex-1 flex-col py-4', isCollapsed ? 'px-3' : 'px-3')}>
          <div
            className={cn(
              'mb-5 flex items-center',
              isCollapsed ? 'justify-center' : 'justify-start',
            )}
          >
            <CollapsedTooltip enabled={isCollapsed} label="Organizer Dashboard">
              <Link
                className={cn(
                  'flex items-center gap-2 rounded-md transition-colors hover:bg-[#27212d]',
                  isCollapsed ? 'justify-center p-1.5' : 'min-w-0 flex-1',
                )}
                to="/organizer"
                aria-label="CLUTCHA organizer dashboard"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#7157ff]/70 bg-[#111014] p-1 shadow-[0_0_12px_rgba(113,87,255,0.28)]">
                  <img className="h-full w-full rounded object-cover" src="/logo.png" alt="" />
                </span>
                {!isCollapsed && (
                  <span className="min-w-0 leading-none">
                    <span className="block truncate text-xl font-extrabold tracking-[-0.04em] text-[#f0dbff]">
                      CLUTCHA
                    </span>
                    <span className="block truncate text-[9px] font-bold text-white">
                      Command Center
                    </span>
                  </span>
                )}
              </Link>
            </CollapsedTooltip>
          </div>

          <CollapsedTooltip enabled={isCollapsed} label="New Tournament">
            <Link
              className={cn(
                'mb-7 flex min-h-10 w-full items-center justify-center rounded-md bg-[#ddb7ff] text-[11px] font-bold text-[#2c0051] transition-colors hover:bg-[#f0dbff]',
                isCollapsed ? 'px-0 py-2' : 'gap-2 px-3 py-2.5',
              )}
              to="/organizer/tournaments/new"
              aria-label="New Tournament"
            >
              <Plus className="h-4 w-4 shrink-0 text-[#2c0051]" aria-hidden="true" />
              {!isCollapsed && <span>New Tournament</span>}
            </Link>
          </CollapsedTooltip>

          <nav className="space-y-2" aria-label="Organizer navigation">
            {organizerNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item)

              return (
                <CollapsedTooltip key={item.to} enabled={isCollapsed} label={item.label}>
                  <Link className={navLinkClass(isActive)} to={item.to}>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-[#17131c]' : 'text-[#efe1ff] group-hover:text-white',
                      )}
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </CollapsedTooltip>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[#2b2630] px-3 py-4">
          <CollapsedTooltip enabled={isCollapsed} label="Help">
            <Link
              className={cn(
                'mb-3 flex min-h-10 items-center rounded-md text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white',
                isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
              )}
              to="/organizer/help"
              aria-label="Help"
            >
              <CircleHelp
                className="h-4 w-4 shrink-0 text-[#efe1ff] group-hover:text-white"
                aria-hidden="true"
              />
              {!isCollapsed && <span>Help</span>}
            </Link>
          </CollapsedTooltip>

          <CollapsedTooltip enabled={isCollapsed} label="Sign Out">
            <button
              className={cn(
                'mb-5 flex min-h-10 w-full items-center rounded-md text-left text-xs font-bold text-[#f5eefe] transition-colors hover:bg-[#27212d] hover:text-white',
                isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
              )}
              type="button"
              aria-label="Sign Out"
              onClick={handleLogout}
            >
              <LogOut
                className="h-4 w-4 shrink-0 text-[#efe1ff] group-hover:text-white"
                aria-hidden="true"
              />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </CollapsedTooltip>

          <CollapsedTooltip enabled={isCollapsed} label={user?.displayName ?? 'CLUTCHA Admin'}>
            <Link
              className={cn(
                'flex items-center rounded-md py-2 transition-colors hover:bg-[#27212d]',
                isCollapsed ? 'justify-center px-0' : 'gap-2 px-2',
              )}
              to="/organizer/profile"
              aria-label="Organizer profile"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4cd7f6]/40 bg-[#0e0e10] text-[11px] font-black text-[#4cd7f6]">
                {userInitial}
              </span>
              {!isCollapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-white">
                    {user?.displayName ?? 'CLUTCHA Admin'}
                  </span>
                  <span className="block truncate text-[9px] font-semibold text-[#cfc2d6]">
                    Organizer
                  </span>
                </span>
              )}
            </Link>
          </CollapsedTooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
