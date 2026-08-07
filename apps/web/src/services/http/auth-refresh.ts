import type { AxiosRequestConfig } from 'axios'
import { authControllerRefresh } from '@/api/generated/authentication/authentication'
import { clutchaAxios } from './api-client'
import { clearAccessToken, setAccessToken } from './token-storage'

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean }

type SessionExpiredListener = () => void

const sessionExpiredListeners = new Set<SessionExpiredListener>()

/**
 * Lets business code (the session hook) react when a refresh attempt
 * definitively fails, without this infrastructure module importing
 * back into `modules/*`.
 */
export const onSessionExpired = (listener: SessionExpiredListener): (() => void) => {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

const notifySessionExpired = (): void => {
  clearAccessToken()
  sessionExpiredListeners.forEach((listener) => listener())
}

const authEndpoints = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/register/captain',
  '/api/auth/register/organizer',
]

const isAuthEndpoint = (url?: string): boolean =>
  !!url && authEndpoints.some((endpoint) => url.includes(endpoint))

let pendingRefresh: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  if (!pendingRefresh) {
    pendingRefresh = authControllerRefresh()
      .then((response) => {
        setAccessToken(response.accessToken)
        return response.accessToken
      })
      .finally(() => {
        pendingRefresh = null
      })
  }

  return pendingRefresh
}

let interceptorRegistered = false

/**
 * On a 401 from any request other than the auth endpoints themselves,
 * refresh the access token once (concurrent 401s share the same refresh
 * call) and retry the original request. If the refresh itself fails, the
 * session is cleared and subscribers are notified so the UI can redirect
 * to sign-in.
 */
export const registerAuthRefreshInterceptor = (): void => {
  if (interceptorRegistered) return
  interceptorRegistered = true

  clutchaAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config as RetryableRequestConfig | undefined

      if (
        error?.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        isAuthEndpoint(originalRequest.url)
      ) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        await refreshAccessToken()
        return clutchaAxios.request(originalRequest)
      } catch (refreshError) {
        notifySessionExpired()
        return Promise.reject(refreshError)
      }
    },
  )
}
