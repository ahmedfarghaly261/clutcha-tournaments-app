import type { RouteObject } from 'react-router-dom'
import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import { CaptainLayout } from '@/layouts/CaptainLayout'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { CaptainDashboardPage } from '@/modules/captain/dashboard'
import { CaptainProfilePage } from '@/modules/captain/profile'
import { CaptainTeamPage } from '@/modules/captain/team'
import { CaptainRosterPage } from '@/modules/captain/roster'
import { CaptainTournamentDiscoveryPage } from '@/modules/captain/tournaments/discovery'
import { CaptainCheckInPage } from '@/modules/captain/tournaments/check-in'
import { CaptainTournamentDetailsPage } from '@/modules/captain/tournaments/details'
import { CaptainTournamentHubPage } from '@/modules/captain/tournaments/hub'
import { CaptainMatchesPage } from '@/modules/captain/tournaments/matches'
import { CaptainRegistrationsPage } from '@/modules/captain/tournaments/registrations'
import { CaptainRegisteredTournamentsPage } from '@/modules/captain/tournaments/registered'
import { CaptainPlaceholderPage } from '@/modules/captain/shell'

export const captainRoutes: RouteObject[] = [
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allow={[CurrentUserResponseDtoRole.CAPTAIN]} />,
        children: [
          {
            path: '/captain',
            element: <CaptainLayout />,
            children: [
              { index: true, element: <CaptainDashboardPage /> },
              { path: 'profile', element: <CaptainProfilePage /> },
              { path: 'team', element: <CaptainTeamPage /> },
              { path: 'roster', element: <CaptainRosterPage /> },
              { path: 'tournaments', element: <CaptainTournamentDiscoveryPage /> },
              { path: 'tournaments/:slug', element: <CaptainTournamentDetailsPage /> },
              {
                path: 'registrations',
                element: <CaptainRegistrationsPage />,
              },
              {
                path: 'registrations/:registrationId/hub',
                element: <CaptainTournamentHubPage />,
              },
              {
                path: 'registered',
                element: <CaptainRegisteredTournamentsPage />,
              },
              {
                path: 'registered-tournaments',
                element: <CaptainRegisteredTournamentsPage />,
              },
              {
                path: 'registered-tournments',
                element: <CaptainRegisteredTournamentsPage />,
              },
              {
                path: 'registerd-tournments',
                element: <CaptainRegisteredTournamentsPage />,
              },
              {
                path: 'matches',
                element: <CaptainMatchesPage />,
              },
              {
                path: 'check-in',
                element: <CaptainCheckInPage />,
              },
              {
                path: 'help',
                element: <CaptainPlaceholderPage title="Help" description="Captain documentation and support shortcuts will appear here." />,
              },
            ],
          },
        ],
      },
    ],
  },
]
