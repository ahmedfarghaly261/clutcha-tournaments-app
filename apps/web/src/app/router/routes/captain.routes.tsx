import type { RouteObject } from 'react-router-dom'
import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import { CaptainLayout } from '@/layouts/CaptainLayout'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { CaptainDashboardPage } from '@/modules/captain/dashboard'
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
              {
                path: 'profile',
                element: <CaptainPlaceholderPage title="Captain Profile" description="Manage your captain contact information and account readiness here." />,
              },
              {
                path: 'team',
                element: <CaptainPlaceholderPage title="My Team" description="Create and manage your competitive team workspace here." />,
              },
              {
                path: 'roster',
                element: <CaptainPlaceholderPage title="Team Roster" description="Add starters and substitutes, then track their eligibility and verification." />,
              },
              {
                path: 'tournaments',
                element: <CaptainPlaceholderPage title="Find Tournaments" description="Discover tournaments and check whether your team is eligible to register." />,
              },
              {
                path: 'registrations',
                element: <CaptainPlaceholderPage title="Registrations" description="Track submitted tournament registrations, approval, payment, and check-in status." />,
              },
              {
                path: 'matches',
                element: <CaptainPlaceholderPage title="Matches" description="View scheduled matches, lobby details, venue assignments, and official results." />,
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
