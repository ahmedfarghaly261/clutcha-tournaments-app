const accessTokenStorageKey = 'clutcha.accessToken'

let inMemoryAccessToken: string | null = null

const canUseLocalStorage = (): boolean => typeof window !== 'undefined'

export const getAccessToken = (): string | null => {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken
  }

  if (!canUseLocalStorage()) {
    return null
  }

  return window.localStorage.getItem(accessTokenStorageKey)
}

export const setAccessToken = (accessToken: string): void => {
  inMemoryAccessToken = accessToken

  if (canUseLocalStorage()) {
    window.localStorage.setItem(accessTokenStorageKey, accessToken)
  }
}

export const clearAccessToken = (): void => {
  inMemoryAccessToken = null

  if (canUseLocalStorage()) {
    window.localStorage.removeItem(accessTokenStorageKey)
  }
}

export { accessTokenStorageKey }
