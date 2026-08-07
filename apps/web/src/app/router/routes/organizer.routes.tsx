import type { RouteObject } from 'react-router-dom'
import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import { OrganizerLayout } from '@/layouts/OrganizerLayout'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { OrganizerDashboardPage } from '@/modules/organizer/dashboard'

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
            children: [{ index: true, element: <OrganizerDashboardPage /> }],
          },
        ],
      },
    ],
  },
]
