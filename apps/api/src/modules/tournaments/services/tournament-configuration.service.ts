import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TournamentMode } from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type UpsertOnlineConfigurationDto } from '../dtos/upsert-online-configuration.dto';
import { type UpsertVenueDto } from '../dtos/upsert-venue.dto';
import { type OnlineConfigurationResponseDto } from '../dtos/online-configuration-response.dto';
import { type VenueResponseDto } from '../dtos/venue-response.dto';
import { toOnlineConfigurationResponse } from '../mappers/online-configuration.mapper';
import { toVenueResponse } from '../mappers/venue.mapper';

const onlineConfigurationSelect = {
  id: true,
  tournamentId: true,
  serverRegion: true,
  publicInstructions: true,
  connectionRules: true,
  evidenceRequired: true,
  screenshotRequirements: true,
  resultSubmissionDeadlineMinutes: true,
  discordServerUrl: true,
  captainSupportChannel: true,
  matchReportingChannel: true,
  lobbyInstructions: true,
  privateSupportContact: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentOnlineConfigurationSelect;

const venueSelect = {
  id: true,
  tournamentId: true,
  name: true,
  country: true,
  city: true,
  address: true,
  mapUrl: true,
  checkInLocation: true,
  parkingInfo: true,
  spectatorPolicy: true,
  venueRules: true,
  emergencyContact: true,
  equipmentProvided: true,
  playersMayBring: true,
  playersMustBring: true,
  personalPeripheralsAllowed: true,
  controllersAllowed: true,
  usbDevicesAllowed: true,
  driverInstallationAllowed: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentVenueSelect;

type OnlineConfigurationData = Omit<
  Prisma.TournamentOnlineConfigurationUncheckedCreateInput,
  'id' | 'tournamentId' | 'createdAt' | 'updatedAt'
>;

type VenueData = Omit<
  Prisma.TournamentVenueUncheckedCreateInput,
  'id' | 'tournamentId' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class TournamentConfigurationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getVenue(
    organizerId: string,
    tournamentId: string,
  ): Promise<VenueResponseDto> {
    await this.assertOwnedOnsiteTournament(organizerId, tournamentId);

    const venue = await this.databaseService.client.tournamentVenue.findUnique({
      where: { tournamentId },
      select: venueSelect,
    });

    if (!venue) {
      throw new NotFoundException('Venue was not found');
    }

    return toVenueResponse(venue);
  }

  async upsertVenue(
    organizerId: string,
    tournamentId: string,
    dto: UpsertVenueDto,
  ): Promise<VenueResponseDto> {
    await this.assertOwnedOnsiteTournament(organizerId, tournamentId);

    const venue = await this.databaseService.client.tournamentVenue.upsert({
      where: { tournamentId },
      create: {
        tournamentId,
        ...this.toVenueData(dto),
      },
      update: this.toVenueData(dto),
      select: venueSelect,
    });

    return toVenueResponse(venue);
  }

  async getOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
  ): Promise<OnlineConfigurationResponseDto> {
    await this.assertOwnedOnlineTournament(organizerId, tournamentId);

    const configuration =
      await this.databaseService.client.tournamentOnlineConfiguration.findUnique(
        {
          where: { tournamentId },
          select: onlineConfigurationSelect,
        },
      );

    if (!configuration) {
      throw new NotFoundException('Online configuration was not found');
    }

    return toOnlineConfigurationResponse(configuration);
  }

  async upsertOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
    dto: UpsertOnlineConfigurationDto,
  ): Promise<OnlineConfigurationResponseDto> {
    await this.assertOwnedOnlineTournament(organizerId, tournamentId);

    const configuration =
      await this.databaseService.client.tournamentOnlineConfiguration.upsert({
        where: { tournamentId },
        create: {
          tournamentId,
          ...this.toOnlineConfigurationData(dto),
        },
        update: this.toOnlineConfigurationData(dto),
        select: onlineConfigurationSelect,
      });

    return toOnlineConfigurationResponse(configuration);
  }

  private async assertOwnedOnlineTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<void> {
    const tournament = await this.findOwnedTournament(
      organizerId,
      tournamentId,
    );

    if (tournament.mode !== TournamentMode.ONLINE) {
      throw new ConflictException(
        'Online configuration is only available for online tournaments',
      );
    }
  }

  private async assertOwnedOnsiteTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<void> {
    const tournament = await this.findOwnedTournament(
      organizerId,
      tournamentId,
    );

    if (tournament.mode !== TournamentMode.ONSITE) {
      throw new ConflictException(
        'Venue configuration is only available for on-site tournaments',
      );
    }
  }

  private async findOwnedTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<{ mode: TournamentMode }> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: { mode: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private toOnlineConfigurationData(
    dto: UpsertOnlineConfigurationDto,
  ): OnlineConfigurationData {
    return {
      serverRegion: dto.serverRegion,
      publicInstructions: dto.publicInstructions,
      connectionRules: dto.connectionRules,
      evidenceRequired: dto.evidenceRequired ?? false,
      screenshotRequirements: dto.screenshotRequirements,
      resultSubmissionDeadlineMinutes: dto.resultSubmissionDeadlineMinutes,
      discordServerUrl: dto.discordServerUrl,
      captainSupportChannel: dto.captainSupportChannel,
      matchReportingChannel: dto.matchReportingChannel,
      lobbyInstructions: dto.lobbyInstructions,
      privateSupportContact: dto.privateSupportContact,
    };
  }

  private toVenueData(dto: UpsertVenueDto): VenueData {
    return {
      name: dto.name,
      country: dto.country,
      city: dto.city,
      address: dto.address,
      mapUrl: dto.mapUrl,
      checkInLocation: dto.checkInLocation,
      parkingInfo: dto.parkingInfo,
      spectatorPolicy: dto.spectatorPolicy,
      venueRules: dto.venueRules,
      emergencyContact: dto.emergencyContact,
      equipmentProvided:
        dto.equipmentProvided === undefined
          ? undefined
          : (dto.equipmentProvided as Prisma.InputJsonValue),
      playersMayBring:
        dto.playersMayBring === undefined
          ? undefined
          : (dto.playersMayBring as Prisma.InputJsonValue),
      playersMustBring:
        dto.playersMustBring === undefined
          ? undefined
          : (dto.playersMustBring as Prisma.InputJsonValue),
      personalPeripheralsAllowed: dto.personalPeripheralsAllowed ?? false,
      controllersAllowed: dto.controllersAllowed ?? false,
      usbDevicesAllowed: dto.usbDevicesAllowed ?? false,
      driverInstallationAllowed: dto.driverInstallationAllowed ?? false,
    };
  }
}
