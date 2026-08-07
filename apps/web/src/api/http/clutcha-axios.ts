import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getAccessToken } from '../auth-token'

export type ErrorType<Error> = AxiosError<Error>
export type BodyType<BodyData> = BodyData

const defaultApiBaseUrl = 'http://localhost:3000'

declare const __CLUTCHA_API_BASE_URL__: string | undefined

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '')

export const clutchaAxios = axios.create({
  baseURL: trimTrailingSlashes(
    __CLUTCHA_API_BASE_URL__ ?? defaultApiBaseUrl,
  ),
  withCredentials: true,
})

clutchaAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = getAccessToken()

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    if (
      typeof config.baseURL === 'string' &&
      config.baseURL.endsWith('/api') &&
      typeof config.url === 'string' &&
      config.url.startsWith('/api/')
    ) {
      config.url = config.url.slice('/api'.length)
    }

    return config
  },
)

export const clutchaApiClient = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await clutchaAxios.request<T>({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  })

  return response.data
}
