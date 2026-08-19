import { useQueryClient } from '@tanstack/react-query'
import {
  getCaptainsControllerGetDashboardQueryKey,
  getCaptainsControllerGetRosterPlayerQueryKey,
  getCaptainsControllerListRosterPlayersQueryKey,
  useCaptainsControllerCreateRosterPlayer,
  useCaptainsControllerDeleteRosterPlayer,
  useCaptainsControllerUpdateRosterPlayer,
} from '@/api/generated/captain/captain'
import type { RosterPlayer } from '../types/captain-roster.types'

export function useCaptainRosterMutations() {
  const queryClient = useQueryClient()
  const listKey = getCaptainsControllerListRosterPlayersQueryKey()

  const refreshDashboard = () => {
    void queryClient.invalidateQueries({
      queryKey: getCaptainsControllerGetDashboardQueryKey(),
    })
  }

  const createMutation = useCaptainsControllerCreateRosterPlayer({
    mutation: {
      onSuccess: (player) => {
        queryClient.setQueryData<RosterPlayer[]>(listKey, (current = []) => [...current, player])
        queryClient.setQueryData(getCaptainsControllerGetRosterPlayerQueryKey(player.id), player)
        refreshDashboard()
      },
    },
  })

  const updateMutation = useCaptainsControllerUpdateRosterPlayer({
    mutation: {
      onSuccess: (player) => {
        queryClient.setQueryData<RosterPlayer[]>(listKey, (current = []) =>
          current.map((item) => item.id === player.id ? player : item),
        )
        queryClient.setQueryData(getCaptainsControllerGetRosterPlayerQueryKey(player.id), player)
        refreshDashboard()
      },
    },
  })

  const deleteMutation = useCaptainsControllerDeleteRosterPlayer({
    mutation: {
      onSuccess: (player) => {
        queryClient.setQueryData<RosterPlayer[]>(listKey, (current = []) =>
          current.filter((item) => item.id !== player.id),
        )
        queryClient.removeQueries({
          queryKey: getCaptainsControllerGetRosterPlayerQueryKey(player.id),
        })
        refreshDashboard()
      },
    },
  })

  return {
    createPlayer: createMutation.mutateAsync,
    updatePlayer: updateMutation.mutateAsync,
    deletePlayer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
