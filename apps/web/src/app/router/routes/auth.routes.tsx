import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { GuestGuard } from '../guards/GuestGuard'
import { SignInPage } from '@/modules/auth/sign-in'
import { CaptainRegistrationPage } from '@/modules/auth/captain-registration'
import { OrganizerRegistrationPage } from '@/modules/auth/organizer-registration'

export const authRoutes: RouteObject[] = [
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/sign-in', element: <SignInPage /> },
          { path: '/register/captain', element: <CaptainRegistrationPage /> },
          { path: '/register/organizer', element: <OrganizerRegistrationPage /> },
        ],
      },
    ],
  },
]
