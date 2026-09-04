import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import {
  type ListPublicTournamentsQueryDto,
  PublicTournamentSortBy,
} from '../dtos/list-public-tournaments-query.dto';
import { type PublicTournamentDetailResponseDto } from '../dtos/public-tournament-detail-response.dto';
import { type PublicTournamentListResponseDto } from '../dtos/public-tournament-list-response.dto';
import { SortDirection } from '../dtos/list-organizer-tournaments-query.dto';
import { toPublicTournamentDetailResponse } from '../mappers/public-tournament-detail.mapper';
import { toPublicTournamentSummaryResponse } from '../mappers/public-tournament.mapper';

const publicTournamentSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  logoUrl: true,
  coverUrl: true,
  gameKey: true,
  mode: true,
  status: true,
  format: true,
  minimumTeams: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  registrationFee: true,
  currency: true,
  prizePool: true,
  registrationClosesAt: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  waitlistEnabled: true,
  publishedAt: true,
  registrationOpenedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentSelect;

const publicTournamentDetailSelect = {
  ...publicTournamentSelect,
  description: true,
  maximumSubstitutes: true,
  defaultBestOf: true,
  finalBestOf: true,
  seedingMethod: true,
  thirdPlaceMatch: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumPlayerAge: true,
  minimumRank: true,
  maximumRank: true,
  prizeDistribution: true,
  refundPolicy: true,
  cancellationPolicy: true,
  rules: true,
  rulesVersion: true,
  rosterChangeRules: true,
  checkInRules: true,
  matchReportingRules: true,
  evidenceRequirements: true,
  disputeDeadlineMinutes: true,
  forfeitRules: true,
  codeOfConduct: true,
  registrationOpensAt: true,
  rosterLocksAt: true,
  checkInOpensAt: true,
  checkInClosesAt: true,
  maximumWaitlistSize: true,
  registrationClosedAt: true,
  onlineConfiguration: {
    select: {
      serverRegion: true,
      publicInstructions: true,
      connectionRules: true,
      evidenceRequired: true,
      screenshotRequirements: true,
      resultSubmissionDeadlineMinutes: true,
    },
  },
  venue: {
    select: {
      name: true,
      country: true,
      city: true,
      address: true,
      mapUrl: true,
      checkInLocation: true,
      parkingInfo: true,
      spectatorPolicy: true,
      venueRules: true,
      equipmentProvided: true,
      playersMayBring: true,
      playersMustBring: true,
      personalPeripheralsAllowed: true,
      controllersAllowed: true,
      usbDevicesAllowed: true,
      driverInstallationAllowed: true,
      gamingRooms: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          purpose: true,
          stationCount: true,
          cpu: true,
          gpu: true,
          ram: true,
          storage: true,
          operatingSystem: true,
          monitorBrand: true,
          monitorModel: true,
          monitorSizeInches: true,
          monitorResolution: true,
          monitorRefreshRateHz: true,
          monitorResponseTimeMs: true,
          mouse: true,
          keyboard: true,
          headset: true,
          mousePad: true,
          controller: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentSelect;

const publicTournamentStatuses: TournamentStatus[] = [
  TournamentStatus.PUBLISHED,
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.CHECK_IN_OPEN,
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.COMPLETED,
  TournamentStatus.POSTPONED,
];

@Injectable()
export class TournamentQueryService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPublicTournaments(
    query: ListPublicTournamentsQueryDto,
  ): Promise<PublicTournamentListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.toPublicTournamentWhere(query);
    const orderBy = this.toPublicTournamentOrderBy(query);

    const [items, totalItems] = await this.databaseService.client.$transaction([
      this.databaseService.client.tournament.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: publicTournamentSelect,
      }),
      this.databaseService.client.tournament.count({ where }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items.map((item) => toPublicTournamentSummaryResponse(item)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getPublicTournamentDetails(
    slug: string,
  ): Promise<PublicTournamentDetailResponseDto> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        slug,
        visibility: TournamentVisibility.PUBLIC,
        status: { in: [...publicTournamentStatuses] },
      },
      select: publicTournamentDetailSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return toPublicTournamentDetailResponse(tournament);
  }

  private toPublicTournamentWhere(
    query: ListPublicTournamentsQueryDto,
  ): Prisma.TournamentWhereInput {
    const statusFilter =
      query.status === undefined
        ? { in: [...publicTournamentStatuses] }
        : publicTournamentStatuses.includes(query.status)
          ? query.status
          : { in: [] };

    const where: Prisma.TournamentWhereInput = {
      visibility: TournamentVisibility.PUBLIC,
      status: statusFilter,
    };

    if (query.mode) {
      where.mode = query.mode;
    }

    if (query.gameKey) {
      where.gameKey = query.gameKey;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { gameKey: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toPublicTournamentOrderBy(
    query: ListPublicTournamentsQueryDto,
  ): Prisma.TournamentOrderByWithRelationInput {
    const sortBy = query.sortBy ?? PublicTournamentSortBy.PUBLISHED_AT;
    const sortDirection = query.sortDirection ?? SortDirection.DESC;

    return {
      [sortBy]: sortDirection,
    };
  }
}
