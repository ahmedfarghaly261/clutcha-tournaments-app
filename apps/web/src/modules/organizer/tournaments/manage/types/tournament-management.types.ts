import type {
  UpdateTournamentDraftDtoMode,
  UpdateTournamentDraftDtoVisibility,
} from '@/api/generated/organizer-tournaments'

export interface TournamentGeneralSettingsFormValues {
  name: string
  shortDescription: string
  description: string
  gameKey: string
  mode: UpdateTournamentDraftDtoMode
  visibility: UpdateTournamentDraftDtoVisibility
}

export interface TournamentOnlineConfigurationFormValues {
  serverRegion: string
  publicInstructions: string
  connectionRules: string
  evidenceRequired: boolean
  screenshotRequirements: string
  resultSubmissionDeadlineMinutes: string
  discordServerUrl: string
  captainSupportChannel: string
  matchReportingChannel: string
  lobbyInstructions: string
  privateSupportContact: string
}

export interface TournamentVenueConfigurationFormValues {
  name: string
  country: string
  city: string
  address: string
  mapUrl: string
  checkInLocation: string
  parkingInfo: string
  spectatorPolicy: string
  venueRules: string
  emergencyContact: string
  personalPeripheralsAllowed: boolean
  controllersAllowed: boolean
  usbDevicesAllowed: boolean
  driverInstallationAllowed: boolean
}

export type TournamentManagementSection = 'general' | 'configuration'
