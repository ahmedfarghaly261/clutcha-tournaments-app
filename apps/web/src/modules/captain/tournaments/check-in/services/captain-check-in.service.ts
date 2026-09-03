import {
  CaptainRegistrationsControllerListRegistrationsSortBy,
  CaptainRegistrationsControllerListRegistrationsSortDirection,
  CaptainRegistrationsControllerListRegistrationsStatus,
} from '@/api/generated/captain-registrations'
import {
  useCaptainRegistrationsControllerGetRegistrationCheckIn,
  useCaptainRegistrationsControllerListRegistrations,
} from '@/api/generated/captain-registrations/captain-registrations'

export function useCaptainCheckInRegistrationsService() {
  return useCaptainRegistrationsControllerListRegistrations({
    limit: 100,
    status: CaptainRegistrationsControllerListRegistrationsStatus.CONFIRMED,
    sortBy: CaptainRegistrationsControllerListRegistrationsSortBy.tournamentStartsAt,
    sortDirection: CaptainRegistrationsControllerListRegistrationsSortDirection.asc,
  }, {
    query: { staleTime: 20_000 },
  })
}

export function useCaptainRegistrationCheckInService(registrationId: string) {
  return useCaptainRegistrationsControllerGetRegistrationCheckIn(registrationId, {
    query: { enabled: Boolean(registrationId), staleTime: 10_000 },
  })
}
