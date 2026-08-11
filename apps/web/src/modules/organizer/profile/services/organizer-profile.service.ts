import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getOrganizersControllerGetProfileQueryKey,
  useOrganizersControllerGetProfile,
  useOrganizersControllerUpdateProfile,
} from '@/api/generated/organizer/organizer'
import type {
  OrganizerProfileResponseDto,
  UpdateOrganizerProfileDto,
} from '@/api/generated/organizer'
import type { OrganizerProfileFormValues } from '../schemas/organizer-profile.schema'

export const organizerProfileDefaultValues: OrganizerProfileFormValues = {
  organizationName: '',
  logoUrl: '',
  coverUrl: '',
  description: '',
  contactEmail: '',
  supportPhone: '',
  country: '',
  city: '',
  websiteUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  discordUrl: '',
}

export function mapOrganizerProfileToFormValues(
  profile: OrganizerProfileResponseDto,
): OrganizerProfileFormValues {
  return {
    organizationName: profile.user.displayName,
    logoUrl: profile.logoUrl ?? '',
    coverUrl: profile.coverUrl ?? '',
    description: profile.description ?? '',
    contactEmail: profile.user.email,
    supportPhone: profile.supportPhone ?? '',
    country: profile.country ?? '',
    city: profile.city ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    facebookUrl: profile.facebookUrl ?? '',
    instagramUrl: profile.instagramUrl ?? '',
    discordUrl: profile.discordUrl ?? '',
  }
}

function mapFormValuesToUpdateDto(
  values: OrganizerProfileFormValues,
): UpdateOrganizerProfileDto {
  return {
    organizationName: values.organizationName.trim(),
    logoUrl: values.logoUrl.trim(),
    coverUrl: values.coverUrl.trim(),
    description: values.description.trim(),
    contactEmail: values.contactEmail.trim(),
    supportPhone: values.supportPhone.trim(),
    country: values.country.trim(),
    city: values.city.trim(),
    websiteUrl: values.websiteUrl.trim(),
    facebookUrl: values.facebookUrl.trim(),
    instagramUrl: values.instagramUrl.trim(),
    discordUrl: values.discordUrl.trim(),
  }
}

export function useOrganizerProfileService() {
  const queryClient = useQueryClient()
  const profileQuery = useOrganizersControllerGetProfile()
  const updateProfileMutation = useOrganizersControllerUpdateProfile({
    mutation: {
      onSuccess: (profile) => {
        queryClient.setQueryData(getOrganizersControllerGetProfileQueryKey(), profile)
      },
    },
  })

  const updateProfile = useCallback(
    (values: OrganizerProfileFormValues) =>
      updateProfileMutation.mutateAsync({ data: mapFormValuesToUpdateDto(values) }),
    [updateProfileMutation],
  )

  return {
    profileQuery,
    updateProfile,
    isUpdatingProfile: updateProfileMutation.isPending,
  }
}
