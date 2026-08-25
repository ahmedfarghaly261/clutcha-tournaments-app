import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizerTournamentsControllerGetTournamentRegistrationQueryKey,
  getOrganizerTournamentsControllerListTournamentRegistrationsQueryKey,
  useOrganizerTournamentsControllerApproveTournamentRegistration,
  useOrganizerTournamentsControllerRejectRegistrationPaymentProof,
  useOrganizerTournamentsControllerRejectTournamentRegistration,
  useOrganizerTournamentsControllerVerifyRegistrationPaymentProof,
} from '@/api/generated/organizer-tournaments/organizer-tournaments'

export function useTournamentRegistrationMutations(tournamentId: string) {
  const queryClient = useQueryClient()
  const refreshRegistration = async (registrationId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getOrganizerTournamentsControllerListTournamentRegistrationsQueryKey(
            tournamentId,
          ),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getOrganizerTournamentsControllerGetTournamentRegistrationQueryKey(
            tournamentId,
            registrationId,
          ),
      }),
    ])
  }

  const approveMutation = useOrganizerTournamentsControllerApproveTournamentRegistration({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })
  const rejectMutation = useOrganizerTournamentsControllerRejectTournamentRegistration({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })
  const verifyPaymentMutation = useOrganizerTournamentsControllerVerifyRegistrationPaymentProof({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })
  const rejectPaymentMutation = useOrganizerTournamentsControllerRejectRegistrationPaymentProof({
    mutation: {
      onSuccess: async (_, variables) => refreshRegistration(variables.registrationId),
    },
  })

  return {
    approveRegistration: approveMutation.mutateAsync,
    rejectRegistration: rejectMutation.mutateAsync,
    verifyPaymentProof: verifyPaymentMutation.mutateAsync,
    rejectPaymentProof: rejectPaymentMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isVerifyingPayment: verifyPaymentMutation.isPending,
    isRejectingPayment: rejectPaymentMutation.isPending,
    isPending:
      approveMutation.isPending ||
      rejectMutation.isPending ||
      verifyPaymentMutation.isPending ||
      rejectPaymentMutation.isPending,
  }
}
