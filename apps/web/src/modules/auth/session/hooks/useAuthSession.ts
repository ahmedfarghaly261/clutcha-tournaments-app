import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAuthControllerLogin,
  useAuthControllerLogout,
  useAuthControllerRefresh,
  useAuthControllerRegisterCaptain,
  useAuthControllerRegisterOrganizer,
} from '@/api/generated/authentication/authentication'
import type {
  AuthResponseDto,
  CurrentUserResponseDto,
  LoginDto,
  RegisterCaptainDto,
  RegisterOrganizerDto,
} from '@/api/generated/authentication'
import { clearAccessToken, setAccessToken } from '@/services/http/token-storage'
import { onSessionExpired } from '@/services/http/auth-refresh'

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export interface AuthSession {
  status: AuthStatus
  user: CurrentUserResponseDto | null
  login: (input: LoginDto) => Promise<CurrentUserResponseDto>
  registerCaptain: (input: RegisterCaptainDto) => Promise<CurrentUserResponseDto>
  registerOrganizer: (input: RegisterOrganizerDto) => Promise<CurrentUserResponseDto>
  logout: () => Promise<void>
}

/**
 * Owns the app's authentication state: restores the session from the
 * HttpOnly refresh cookie on boot, and wraps the generated auth mutations
 * so the rest of the app only ever deals with `status` / `user`.
 */
export function useAuthSession(): AuthSession {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<CurrentUserResponseDto | null>(null)

  const refreshMutation = useAuthControllerRefresh()
  const loginMutation = useAuthControllerLogin()
  const registerCaptainMutation = useAuthControllerRegisterCaptain()
  const registerOrganizerMutation = useAuthControllerRegisterOrganizer()
  const logoutMutation = useAuthControllerLogout()

  const applySession = useCallback((response: AuthResponseDto) => {
    setAccessToken(response.accessToken)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const clearSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setStatus('guest')
  }, [])

  useEffect(() => {
    // Attempt a silent session restore from the HttpOnly refresh cookie once,
    // on app boot (the in-memory access token is gone after a page reload).
    let cancelled = false

    refreshMutation
      .mutateAsync()
      .then((response) => {
        if (!cancelled) applySession(response)
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => onSessionExpired(clearSession), [clearSession])

  const login = useCallback(
    (input: LoginDto) => loginMutation.mutateAsync({ data: input }).then(applySession),
    [loginMutation, applySession],
  )

  const registerCaptain = useCallback(
    (input: RegisterCaptainDto) =>
      registerCaptainMutation.mutateAsync({ data: input }).then(applySession),
    [registerCaptainMutation, applySession],
  )

  const registerOrganizer = useCallback(
    (input: RegisterOrganizerDto) =>
      registerOrganizerMutation.mutateAsync({ data: input }).then(applySession),
    [registerOrganizerMutation, applySession],
  )

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      clearSession()
      queryClient.clear()
    }
  }, [logoutMutation, clearSession, queryClient])

  return { status, user, login, registerCaptain, registerOrganizer, logout }
}
