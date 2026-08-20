import type {
  CaptainTournamentRegistrationFormValues,
  CreateCaptainTournamentRegistration,
} from '../types/captain-tournament-registration.types'

export const captainTournamentRegistrationDefaultValues: CaptainTournamentRegistrationFormValues = {
  acceptRules: false,
}

export function transformRegistrationFormToRequest(
  values: CaptainTournamentRegistrationFormValues,
): CreateCaptainTournamentRegistration {
  return {
    acceptRules: values.acceptRules,
  }
}
