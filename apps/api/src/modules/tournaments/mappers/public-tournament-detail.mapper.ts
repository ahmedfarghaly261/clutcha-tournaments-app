import {
  type GamingRoomPurpose,
  type TournamentFormat,
  type TournamentMode,
  type TournamentSeedingMethod,
  type TournamentStatus,
} from '@clutcha/database';
import { type PublicTournamentDetailResponseDto } from '../dto/public-tournament-detail-response.dto';

type DecimalLike = { toString(): string };

type PublicOnlineConfigurationRecord = {
  serverRegion: string;
  publicInstructions: string | null;
  connectionRules: string | null;
  evidenceRequired: boolean;
  screenshotRequirements: string | null;
  resultSubmissionDeadlineMinutes: number | null;
};

type PublicGamingRoomRecord = {
  id: string;
  name: string;
  description: string | null;
  purpose: GamingRoomPurpose;
  stationCount: number;
  cpu: string;
  gpu: string;
  ram: string | null;
  storage: string | null;
  operatingSystem: string | null;
  monitorBrand: string | null;
  monitorModel: string;
  monitorSizeInches: DecimalLike | null;
  monitorResolution: string | null;
  monitorRefreshRateHz: number;
  monitorResponseTimeMs: DecimalLike | null;
  mouse: string;
  keyboard: string;
  headset: string;
  mousePad: string | null;
  controller: string | null;
};

type PublicVenueRecord = {
  name: string;
  country: string;
  city: string;
  address: string;
  mapUrl: string | null;
  checkInLocation: string;
  parkingInfo: string | null;
  spectatorPolicy: string | null;
  venueRules: string | null;
  equipmentProvided: unknown;
  playersMayBring: unknown;
  playersMustBring: unknown;
  personalPeripheralsAllowed: boolean;
  controllersAllowed: boolean;
  usbDevicesAllowed: boolean;
  driverInstallationAllowed: boolean;
  gamingRooms: PublicGamingRoomRecord[];
};

export type PublicTournamentDetailRecord = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  gameKey: string;
  mode: TournamentMode;
  status: TournamentStatus;
  format: TournamentFormat;
  minimumTeams: number;
  maximumTeams: number;
  minimumStarters: number;
  maximumStarters: number;
  maximumSubstitutes: number;
  defaultBestOf: number;
  finalBestOf: number;
  seedingMethod: TournamentSeedingMethod;
  thirdPlaceMatch: boolean;
  requiredGameAccountId: boolean;
  allowedRegion: string | null;
  allowedCountries: string[];
  allowedPlatforms: string[];
  minimumPlayerAge: number | null;
  minimumRank: string | null;
  maximumRank: string | null;
  registrationFee: DecimalLike;
  currency: string;
  prizePool: DecimalLike;
  prizeDistribution: unknown;
  refundPolicy: string | null;
  cancellationPolicy: string | null;
  rules: string;
  rulesVersion: string;
  rosterChangeRules: string | null;
  checkInRules: string | null;
  matchReportingRules: string | null;
  evidenceRequirements: string | null;
  disputeDeadlineMinutes: number | null;
  forfeitRules: string | null;
  codeOfConduct: string | null;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  rosterLocksAt: Date | null;
  checkInOpensAt: Date | null;
  checkInClosesAt: Date | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  waitlistEnabled: boolean;
  maximumWaitlistSize: number | null;
  publishedAt: Date | null;
  registrationOpenedAt: Date | null;
  registrationClosedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  onlineConfiguration: PublicOnlineConfigurationRecord | null;
  venue: PublicVenueRecord | null;
};

export const toPublicTournamentDetailResponse = (
  tournament: PublicTournamentDetailRecord,
): PublicTournamentDetailResponseDto => ({
  id: tournament.id,
  slug: tournament.slug,
  name: tournament.name,
  shortDescription: tournament.shortDescription,
  description: tournament.description,
  logoUrl: tournament.logoUrl,
  coverUrl: tournament.coverUrl,
  gameKey: tournament.gameKey,
  mode: tournament.mode,
  status: tournament.status,
  format: tournament.format,
  minimumTeams: tournament.minimumTeams,
  maximumTeams: tournament.maximumTeams,
  minimumStarters: tournament.minimumStarters,
  maximumStarters: tournament.maximumStarters,
  maximumSubstitutes: tournament.maximumSubstitutes,
  defaultBestOf: tournament.defaultBestOf,
  finalBestOf: tournament.finalBestOf,
  seedingMethod: tournament.seedingMethod,
  thirdPlaceMatch: tournament.thirdPlaceMatch,
  requiredGameAccountId: tournament.requiredGameAccountId,
  allowedRegion: tournament.allowedRegion,
  allowedCountries: tournament.allowedCountries,
  allowedPlatforms: tournament.allowedPlatforms,
  minimumPlayerAge: tournament.minimumPlayerAge,
  minimumRank: tournament.minimumRank,
  maximumRank: tournament.maximumRank,
  registrationFee: tournament.registrationFee.toString(),
  currency: tournament.currency,
  prizePool: tournament.prizePool.toString(),
  prizeDistribution: tournament.prizeDistribution,
  refundPolicy: tournament.refundPolicy,
  cancellationPolicy: tournament.cancellationPolicy,
  rules: tournament.rules,
  rulesVersion: tournament.rulesVersion,
  rosterChangeRules: tournament.rosterChangeRules,
  checkInRules: tournament.checkInRules,
  matchReportingRules: tournament.matchReportingRules,
  evidenceRequirements: tournament.evidenceRequirements,
  disputeDeadlineMinutes: tournament.disputeDeadlineMinutes,
  forfeitRules: tournament.forfeitRules,
  codeOfConduct: tournament.codeOfConduct,
  registrationOpensAt: tournament.registrationOpensAt,
  registrationClosesAt: tournament.registrationClosesAt,
  rosterLocksAt: tournament.rosterLocksAt,
  checkInOpensAt: tournament.checkInOpensAt,
  checkInClosesAt: tournament.checkInClosesAt,
  startsAt: tournament.startsAt,
  endsAt: tournament.endsAt,
  timezone: tournament.timezone,
  waitlistEnabled: tournament.waitlistEnabled,
  maximumWaitlistSize: tournament.maximumWaitlistSize,
  publishedAt: tournament.publishedAt,
  registrationOpenedAt: tournament.registrationOpenedAt,
  registrationClosedAt: tournament.registrationClosedAt,
  createdAt: tournament.createdAt,
  updatedAt: tournament.updatedAt,
  onlineConfiguration: tournament.onlineConfiguration
    ? {
        serverRegion: tournament.onlineConfiguration.serverRegion,
        publicInstructions: tournament.onlineConfiguration.publicInstructions,
        connectionRules: tournament.onlineConfiguration.connectionRules,
        evidenceRequired: tournament.onlineConfiguration.evidenceRequired,
        screenshotRequirements:
          tournament.onlineConfiguration.screenshotRequirements,
        resultSubmissionDeadlineMinutes:
          tournament.onlineConfiguration.resultSubmissionDeadlineMinutes,
      }
    : null,
  venue: tournament.venue
    ? {
        location: {
          name: tournament.venue.name,
          country: tournament.venue.country,
          city: tournament.venue.city,
          address: tournament.venue.address,
          mapUrl: tournament.venue.mapUrl,
          checkInLocation: tournament.venue.checkInLocation,
        },
        policy: {
          parkingInfo: tournament.venue.parkingInfo,
          spectatorPolicy: tournament.venue.spectatorPolicy,
          venueRules: tournament.venue.venueRules,
        },
        equipmentPolicy: {
          equipmentProvided: tournament.venue.equipmentProvided,
          playersMayBring: tournament.venue.playersMayBring,
          playersMustBring: tournament.venue.playersMustBring,
          personalPeripheralsAllowed:
            tournament.venue.personalPeripheralsAllowed,
          controllersAllowed: tournament.venue.controllersAllowed,
          usbDevicesAllowed: tournament.venue.usbDevicesAllowed,
          driverInstallationAllowed: tournament.venue.driverInstallationAllowed,
        },
        gamingRooms: tournament.venue.gamingRooms.map((room) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          purpose: room.purpose,
          stationCount: room.stationCount,
          pcSpecs: {
            cpu: room.cpu,
            gpu: room.gpu,
            ram: room.ram,
            storage: room.storage,
            operatingSystem: room.operatingSystem,
          },
          monitor: {
            brand: room.monitorBrand,
            model: room.monitorModel,
            sizeInches: room.monitorSizeInches?.toString() ?? null,
            resolution: room.monitorResolution,
            refreshRateHz: room.monitorRefreshRateHz,
            responseTimeMs: room.monitorResponseTimeMs?.toString() ?? null,
          },
          peripherals: {
            mouse: room.mouse,
            keyboard: room.keyboard,
            headset: room.headset,
            mousePad: room.mousePad,
            controller: room.controller,
          },
        })),
      }
    : null,
});
