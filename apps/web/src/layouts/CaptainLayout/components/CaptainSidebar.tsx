import { type ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  CalendarCheck,
  CalendarCheck2,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Swords,
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

type CaptainNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const captainNavItems: CaptainNavItem[] = [
  { label: 'Dashboard', to: '/captain', icon: LayoutDashboard, end: true },
  { label: 'My Team', to: '/captain/team', icon: Shield },
  { label: 'Roster', to: '/captain/roster', icon: UsersRound },
  { label: 'Tournaments', to: '/captain/tournaments', icon: Gamepad2 },
  { label: 'Registrations', to: '/captain/registrations', icon: CalendarCheck },
  { label: 'Registered tournaments', to: '/captain/registered', icon: ClipboardCheck },
  { label: 'Matches', to: '/captain/matches', icon: Swords },
  { label: 'Check-in', to: '/captain/check-in', icon: CalendarCheck2 },
]

function CollapsedTooltip({
  children,
  enabled,
  label,
}: {
  children: ReactNode
  enabled: boolean
  label: string
}) {
  if (!enabled) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center">{label}</TooltipContent>
    </Tooltip>
  )
}

export function CaptainSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const userInitial = user?.displayName?.trim().charAt(0).toUpperCase() ?? 'C'

  const isActive = (item: CaptainNavItem) =>
    item.end
      ? currentPath === item.to
      : currentPath === item.to || currentPath.startsWith(`${item.to}/`)

  const logoutCaptain = () => {
    void logout().then(() => navigate('/login', { replace: true }))
  }

  return (
    <TooltipProvider delayDuration={120}>
      <aside
        className={cn(
          'sticky left-0 top-0 z-30 flex h-screen max-h-screen min-h-screen shrink-0 flex-col border-r border-[#282d38] bg-[#15171c] text-[#f4f6fb] transition-[width] duration-200',
          isCollapsed ? 'w-18' : 'w-49',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="absolute -right-4 top-8 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-[#353b48] bg-[#101217] text-[#edf2ff] shadow-[0_10px_24px_rgba(0,0,0,0.34)] transition hover:border-[#5cd8ff] hover:bg-[#1b222c]"
              aria-label={isCollapsed ? 'Expand captain sidebar' : 'Collapse captain sidebar'}
              onClick={() => setIsCollapsed((current) => !current)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
        </Tooltip>

        <div className="flex flex-1 flex-col px-3 py-4">
          <CollapsedTooltip enabled={isCollapsed} label="Captain Dashboard">
            <Link
              to="/captain"
              className={cn(
                'mb-6 flex items-center rounded-md transition hover:bg-[#20242c]',
                isCollapsed ? 'justify-center p-1.5' : 'gap-2',
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#7d5cff]/70 bg-[#0f1116] p-1 shadow-[0_0_12px_rgba(125,92,255,0.28)]">
                <img className="h-full w-full rounded object-cover" src="/logo.png" alt="" />
              </span>
              {!isCollapsed && (
                <span className="min-w-0 leading-none">
                  <span className="block truncate text-xl font-extrabold tracking-[-0.04em] text-[#e4dcff]">CLUTCHA</span>
                  <span className="block truncate text-[9px] font-bold text-[#d6eaff]">Captain Workspace</span>
                </span>
              )}
            </Link>
          </CollapsedTooltip>

          <CollapsedTooltip enabled={isCollapsed} label="Find Tournaments">
            <Link
              to="/captain/tournaments"
              className={cn(
                'mb-7 flex min-h-10 w-full items-center justify-center rounded-md bg-[#71dcff] text-[11px] font-black text-[#08212b] transition hover:bg-[#a6eaff]',
                isCollapsed ? 'px-0 py-2' : 'gap-2 px-3 py-2.5',
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Find Tournaments</span>}
            </Link>
          </CollapsedTooltip>

          <nav className="space-y-2" aria-label="Captain navigation">
            {captainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <CollapsedTooltip key={item.to} enabled={isCollapsed} label={item.label}>
                  <Link
                    to={item.to}
                    className={cn(
                      'group flex min-h-10 w-full items-center rounded-md text-xs font-bold transition-colors',
                      isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
                      active
                        ? 'bg-[#6cd7fb] text-[#071c25] shadow-[0_0_18px_rgba(108,215,251,0.2)]'
                        : 'text-[#e8edf7] hover:bg-[#222731] hover:text-white',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#071c25]' : 'text-[#cbd7e9]')} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </CollapsedTooltip>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[#282d38] px-3 py-4">
          <CollapsedTooltip enabled={isCollapsed} label="Help">
            <Link
              to="/captain/help"
              className={cn(
                'mb-2 flex min-h-10 items-center rounded-md text-xs font-bold text-[#edf2fb] transition hover:bg-[#222731]',
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
              )}
            >
              <CircleHelp className="h-4 w-4" /> {!isCollapsed && <span>Help</span>}
            </Link>
          </CollapsedTooltip>
          <CollapsedTooltip enabled={isCollapsed} label="Sign Out">
            <button
              type="button"
              className={cn(
                'mb-4 flex min-h-10 w-full items-center rounded-md text-xs font-bold text-[#edf2fb] transition hover:bg-[#222731]',
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
              )}
              onClick={logoutCaptain}
            >
              <LogOut className="h-4 w-4" /> {!isCollapsed && <span>Sign Out</span>}
            </button>
          </CollapsedTooltip>
          <CollapsedTooltip enabled={isCollapsed} label={user?.displayName ?? 'Captain'}>
            <Link
              to="/captain/profile"
              className={cn(
                'flex items-center rounded-md py-2 transition hover:bg-[#222731]',
                isCollapsed ? 'justify-center px-0' : 'gap-2 px-2',
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#5cd8ff]/50 bg-[#0c161c] text-[11px] font-black text-[#71dcff]">{userInitial}</span>
              {!isCollapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-white">{user?.displayName ?? 'Captain'}</span>
                  <span className="block text-[9px] font-semibold text-[#a9b5c8]">Team Captain</span>
                </span>
              )}
            </Link>
          </CollapsedTooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
