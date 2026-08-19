import { useQueryClient } from '@tanstack/react-query'
import {
  getCaptainsControllerGetDashboardQueryKey,
  getCaptainsControllerGetTeamQueryKey,
  useCaptainsControllerCreateTeam,
  useCaptainsControllerUpdateTeam,
} from '@/api/generated/captain/captain'
import type { CaptainTeam } from '../types/captain-team.types'

function useApplyCaptainTeam() {
  const queryClient = useQueryClient()

  return (team: CaptainTeam) => {
    queryClient.setQueryData(getCaptainsControllerGetTeamQueryKey(), team)
    void queryClient.invalidateQueries({
      queryKey: getCaptainsControllerGetDashboardQueryKey(),
    })
  }
}

export function useCreateCaptainTeamMutation() {
  const applyCaptainTeam = useApplyCaptainTeam()

  return useCaptainsControllerCreateTeam({
    mutation: {
      onSuccess: applyCaptainTeam,
    },
  })
}

export function useUpdateCaptainTeamMutation() {
  const applyCaptainTeam = useApplyCaptainTeam()

  return useCaptainsControllerUpdateTeam({
    mutation: {
      onSuccess: applyCaptainTeam,
    },
  })
}
