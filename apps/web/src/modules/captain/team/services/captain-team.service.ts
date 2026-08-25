import {
  useCaptainsControllerGetTeam,
  useCaptainsControllerListTeamRegions,
} from '@/api/generated/captain/captain'

export function useCaptainTeamService() {
  return useCaptainsControllerGetTeam({
    query: {
      retry: false,
      staleTime: 15_000,
    },
  })
}

export function useCaptainTeamRegionsService() {
  return useCaptainsControllerListTeamRegions({
    query: {
      staleTime: 60_000,
    },
  })
}
