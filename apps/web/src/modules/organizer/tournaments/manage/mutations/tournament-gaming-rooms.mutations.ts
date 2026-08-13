import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetGamingRoomQueryKey,
  getOrganizerTournamentsControllerListGamingRoomsQueryKey,
  useOrganizerTournamentsControllerCreateGamingRoom,
  useOrganizerTournamentsControllerDeleteGamingRoom,
  useOrganizerTournamentsControllerUpdateGamingRoom,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentGamingRoomMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshRooms = async () => {
    await queryClient.invalidateQueries({
      queryKey: getOrganizerTournamentsControllerListGamingRoomsQueryKey(tournamentId),
    })
  }

  const createMutation = useOrganizerTournamentsControllerCreateGamingRoom({
    mutation: { onSuccess: refreshRooms },
  })
  const updateMutation = useOrganizerTournamentsControllerUpdateGamingRoom({
    mutation: {
      onSuccess: async (_, variables) => {
        queryClient.removeQueries({
          queryKey: getOrganizerTournamentsControllerGetGamingRoomQueryKey(
            tournamentId,
            variables.gamingRoomId,
          ),
        })
        await refreshRooms()
      },
    },
  })
  const deleteMutation = useOrganizerTournamentsControllerDeleteGamingRoom({
    mutation: {
      onSuccess: async (_, variables) => {
        queryClient.removeQueries({
          queryKey: getOrganizerTournamentsControllerGetGamingRoomQueryKey(
            tournamentId,
            variables.gamingRoomId,
          ),
        })
        await refreshRooms()
      },
    },
  })

  return {
    createRoom: createMutation.mutateAsync,
    updateRoom: updateMutation.mutateAsync,
    deleteRoom: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
