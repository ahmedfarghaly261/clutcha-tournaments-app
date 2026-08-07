import { createContext, useContext, type ReactNode } from 'react'
import { useAuthSession, type AuthSession } from '@/modules/auth/session'

const AuthContext = createContext<AuthSession | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const session = useAuthSession()

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- colocated with its provider intentionally
export function useAuth(): AuthSession {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
