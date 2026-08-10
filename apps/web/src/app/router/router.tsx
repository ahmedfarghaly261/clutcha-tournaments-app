import { createBrowserRouter, Navigate } from 'react-router-dom'
import { publicRoutes } from './routes/public.routes'
import { authRoutes } from './routes/auth.routes'
import { captainRoutes } from './routes/captain.routes'
import { organizerRoutes } from './routes/organizer.routes'

export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...captainRoutes,
  ...organizerRoutes,
  { path: '*', element: <Navigate to="/register" replace /> },
])
