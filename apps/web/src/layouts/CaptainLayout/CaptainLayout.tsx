import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

export function CaptainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    void logout().then(() => navigate('/', { replace: true }))
  }

  return (
    <div>
      <header>
        <span>CLUTCHA — Captain</span>
        <span>{user?.displayName}</span>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>
      <Outlet />
    </div>
  )
}
