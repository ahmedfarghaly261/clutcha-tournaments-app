import type { RouteObject } from 'react-router-dom'
import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import { OrganizerLayout } from '@/layouts/OrganizerLayout'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { OrganizerDashboardPage } from '@/modules/organizer/dashboard'
import { OrganizerProfilePage } from '@/modules/organizer/profile'
import { OrganizerPlaceholderPage } from '@/modules/organizer/shell'
import { CreateTournamentPage } from '@/modules/organizer/tournaments/create'
import { OrganizerTournamentsPage } from '@/modules/organizer/tournaments/list'
import { OrganizerTournamentDetailsPage } from '@/modules/organizer/tournaments/details'
import {
  TournamentGeneralSettingsPage,
  TournamentGamingRoomsPage,
  TournamentModeConfigurationPage,
} from '@/modules/organizer/tournaments/manage'

export const organizerRoutes: RouteObject[] = [
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allow={[CurrentUserResponseDtoRole.ORGANIZER]} />,
        children: [
          {
            path: '/organizer',
            element: <OrganizerLayout />,
            children: [
              { index: true, element: <OrganizerDashboardPage /> },
              { path: 'profile', element: <OrganizerProfilePage /> },
              { path: 'tournaments', element: <OrganizerTournamentsPage /> },
              {
                path: 'tournaments/:tournamentId',
                element: <OrganizerTournamentDetailsPage />,
              },
              {
                path: 'tournaments/:tournamentId/manage',
                element: <TournamentGeneralSettingsPage />,
              },
              {
                path: 'tournaments/:tournamentId/manage/configuration',
                element: <TournamentModeConfigurationPage />,
              },
              {
                path: 'tournaments/:tournamentId/manage/gaming-rooms',
                element: <TournamentGamingRoomsPage />,
              },
              {
                path: 'tournaments/new',
                element: <CreateTournamentPage />,
              },
              {
                path: 'stations',
                element: (
                  <OrganizerPlaceholderPage
                    title="Stations"
                    description="Manage gaming stations, room inventory, hardware status, and on-site setup from this workspace."
                  />
                ),
              },
              {
                path: 'teams',
                element: (
                  <OrganizerPlaceholderPage
                    title="Teams"
                    description="Review registered teams, captain contacts, approvals, and roster readiness here."
                  />
                ),
              },
              {
                path: 'matchmaking',
                element: (
                  <OrganizerPlaceholderPage
                    title="Matchmaking"
                    description="Create, seed, and operate match flows once the bracket UI is connected."
                  />
                ),
              },
              {
                path: 'schedule',
                element: (
                  <OrganizerPlaceholderPage
                    title="Schedule"
                    description="Plan tournament timelines, match windows, check-in periods, and operational milestones."
                  />
                ),
              },
              {
                path: 'reports',
                element: (
                  <OrganizerPlaceholderPage
                    title="Reports"
                    description="Track tournament performance, team activity, registrations, and operational summaries."
                  />
                ),
              },
              {
                path: 'help',
                element: (
                  <OrganizerPlaceholderPage
                    title="Help"
                    description="Organizer help, documentation, and support shortcuts will appear here."
                  />
                ),
              },
              {
                path: '*',
                element: (
                  <OrganizerPlaceholderPage
                    title="Organizer Workspace"
                    description="This organizer area is not built yet, but you are still inside the command center shell."
                  />
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]
