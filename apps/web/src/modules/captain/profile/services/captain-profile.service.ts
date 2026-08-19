import { useCaptainsControllerGetProfile } from '@/api/generated/captain/captain'
import type {
  CaptainProfile,
  CaptainProfileFormValues,
  CaptainProfileUpdate,
} from '../types/captain-profile.types'

export const captainProfileDefaultValues: CaptainProfileFormValues = {
  displayName: '',
  email: '',
  phoneNumber: '',
  discordUsername: '',
}

export function mapCaptainProfileToFormValues(
  profile: CaptainProfile,
): CaptainProfileFormValues {
  return {
    displayName: profile.displayName,
    email: profile.email,
    phoneNumber: profile.phoneNumber ?? '',
    discordUsername: profile.discordUsername ?? '',
  }
}

export function mapCaptainProfileFormToUpdate(
  values: CaptainProfileFormValues,
): CaptainProfileUpdate {
  const phoneNumber = values.phoneNumber.trim()
  const discordUsername = values.discordUsername.trim()

  return {
    displayName: values.displayName.trim(),
    ...(phoneNumber ? { phoneNumber } : {}),
    discordUsername: discordUsername || null,
  }
}

export function useCaptainProfileService() {
  return useCaptainsControllerGetProfile({
    query: {
      staleTime: 15_000,
    },
  })
}
