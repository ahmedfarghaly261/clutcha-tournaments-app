import { useCaptainsControllerGetTeam } from '@/api/generated/captain/captain'

export function useCaptainTeamService() {
  return useCaptainsControllerGetTeam({
    query: {
      retry: false,
      staleTime: 15_000,
    },
  })
}
