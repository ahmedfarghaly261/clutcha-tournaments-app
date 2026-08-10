import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [{ index: true, element: <Navigate to="/login" replace /> }],
  },
]
