import type { RouteObject } from 'react-router-dom'
import { CurrentUserResponseDtoRole } from '@/api/generated/authentication'
import { CaptainLayout } from '@/layouts/CaptainLayout'
import { AuthGuard } from '../guards/AuthGuard'
import { RoleGuard } from '../guards/RoleGuard'
import { CaptainDashboardPage } from '@/modules/captain/dashboard'

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
            children: [{ index: true, element: <CaptainDashboardPage /> }],
          },
        ],
      },
    ],
  },
]
