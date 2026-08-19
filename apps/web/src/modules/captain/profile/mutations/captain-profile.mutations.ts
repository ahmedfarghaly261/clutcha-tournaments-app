import { useQueryClient } from '@tanstack/react-query'
import {
  getCaptainsControllerGetDashboardQueryKey,
  getCaptainsControllerGetProfileQueryKey,
  useCaptainsControllerUpdateProfile,
} from '@/api/generated/captain/captain'
import { useAuth } from '@/app/providers/AuthProvider'

export function useUpdateCaptainProfileMutation() {
  const queryClient = useQueryClient()
  const { updateDisplayName } = useAuth()

  return useCaptainsControllerUpdateProfile({
    mutation: {
      onSuccess: (profile) => {
        updateDisplayName(profile.displayName)
        queryClient.setQueryData(
          getCaptainsControllerGetProfileQueryKey(),
          profile,
        )
        void queryClient.invalidateQueries({
          queryKey: getCaptainsControllerGetDashboardQueryKey(),
        })
      },
    },
  })
}
