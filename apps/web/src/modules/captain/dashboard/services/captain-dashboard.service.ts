import { useCaptainsControllerGetDashboard } from '@/api/generated/captain/captain'

export function useCaptainDashboardService() {
  return useCaptainsControllerGetDashboard({
    query: {
      staleTime: 15_000,
    },
  })
}
