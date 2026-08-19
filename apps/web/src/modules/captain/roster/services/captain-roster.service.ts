import { useCaptainsControllerListRosterPlayers } from '@/api/generated/captain/captain'

export function useCaptainRosterService() {
  return useCaptainsControllerListRosterPlayers({
    query: {
      retry: false,
      staleTime: 10_000,
    },
  })
}
