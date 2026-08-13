import type {
  CreateGamingRoomDtoPurpose,
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
  equipmentProvidedPc: boolean
  equipmentProvidedMonitor: boolean
  equipmentProvidedMouse: boolean
  equipmentProvidedKeyboard: boolean
  equipmentProvidedHeadset: boolean
  equipmentProvidedController: boolean
  playersMayBringMouse: boolean
  playersMayBringKeyboard: boolean
  playersMayBringHeadset: boolean
  playersMayBringController: boolean
  playersMayBringMousePad: boolean
  playersMustBringNationalId: boolean
  playersMustBringGameAccount: boolean
  playersMustBringController: boolean
  personalPeripheralsAllowed: boolean
  controllersAllowed: boolean
  usbDevicesAllowed: boolean
  driverInstallationAllowed: boolean
}

export interface TournamentGamingRoomFormValues {
  name: string
  description: string
  purpose: CreateGamingRoomDtoPurpose
  stationCount: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  operatingSystem: string
  monitorBrand: string
  monitorModel: string
  monitorSizeInches: string
  monitorResolution: string
  monitorRefreshRateHz: string
  monitorResponseTimeMs: string
  mouse: string
  keyboard: string
  headset: string
  mousePad: string
  controller: string
  internetConnection: string
  equipmentNotes: string
}

export type TournamentLifecycleAction =
  | 'publish'
  | 'open-registration'
  | 'close-registration'
  | 'cancel'

export type TournamentManagementSection =
  | 'general'
  | 'configuration'
  | 'gaming-rooms'
  | 'lifecycle'
