import type { CaptainRegistrationListItemDto } from '@/api/generated/captain-registrations'

export type CaptainCheckInRegistration = CaptainRegistrationListItemDto

export type CaptainCheckInRegistrationButtonProps = {
  registration: CaptainCheckInRegistration
  selected: boolean
  onSelect: () => void
}

export type CaptainCheckInInfoProps = {
  label: string
  value: string
}

export type CaptainCheckInInstructionProps = {
  label: string
  value: string | null | undefined
}

export type CaptainCheckInDetailsProps = {
  registrationId: string
}
