import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EligibilityStatus,
  Prisma,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
  UserRole,
} from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import {
  CaptainRegistrationNextAction,
  type CaptainRegistrationDetailResponseDto,
  type CaptainRegistrationListItemDto,
  type CaptainRegistrationListResponseDto,
} from './dto/captain-registration-response.dto';
import { type CancelTournamentDto } from './dto/cancel-tournament.dto';
import { type CreateGamingRoomDto } from './dto/create-gaming-room.dto';
import { type CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { type CreateTournamentDto } from './dto/create-tournament.dto';
import { type GamingRoomListResponseDto } from './dto/gaming-room-list-response.dto';
import { type GamingRoomResponseDto } from './dto/gaming-room-response.dto';
import {
  type ListOrganizerTournamentsQueryDto,
  OrganizerTournamentSortBy,
  SortDirection,
} from './dto/list-organizer-tournaments-query.dto';
import {
  CaptainRegistrationSortDirection,
  CaptainRegistrationSortBy,
  CaptainRegistrationTimeFilter,
  type ListCaptainRegistrationsQueryDto,
} from './dto/list-captain-registrations-query.dto';
import {
  type ListPublicTournamentsQueryDto,
  PublicTournamentSortBy,
} from './dto/list-public-tournaments-query.dto';
import { type OrganizerTournamentDetailResponseDto } from './dto/organizer-tournament-detail-response.dto';
import { type OrganizerTournamentListResponseDto } from './dto/organizer-tournament-list-response.dto';
import { type OnlineConfigurationResponseDto } from './dto/online-configuration-response.dto';
import { type PublicTournamentDetailResponseDto } from './dto/public-tournament-detail-response.dto';
import { type PublicTournamentListResponseDto } from './dto/public-tournament-list-response.dto';
import {
  TournamentEligibilityIssueCode,
  type TournamentEligibilityIssueDto,
  type TournamentEligibilityResponseDto,
} from './dto/tournament-eligibility-response.dto';
import { type TournamentRegistrationResponseDto } from './dto/tournament-registration-response.dto';
import { type TournamentResponseDto } from './dto/tournament-response.dto';
import { type UpdateGamingRoomDto } from './dto/update-gaming-room.dto';
import { type UpdateTournamentDraftDto } from './dto/update-tournament-draft.dto';
import { type UpsertOnlineConfigurationDto } from './dto/upsert-online-configuration.dto';
import { type UpsertVenueDto } from './dto/upsert-venue.dto';
import { type VenueResponseDto } from './dto/venue-response.dto';
import { toGamingRoomResponse } from './mappers/gaming-room.mapper';
import { toOnlineConfigurationResponse } from './mappers/online-configuration.mapper';
import { toPublicTournamentDetailResponse } from './mappers/public-tournament-detail.mapper';
import { toPublicTournamentSummaryResponse } from './mappers/public-tournament.mapper';
import { toTournamentResponse } from './mappers/tournament.mapper';
import { toVenueResponse } from './mappers/venue.mapper';

type ValidationIssue = {
  field: string;
  message: string;
};

type PublicationReadinessIssue =
  OrganizerTournamentDetailResponseDto['publicationReadiness']['issues'][number];

type OnlineConfigurationData = Omit<
  Prisma.TournamentOnlineConfigurationUncheckedCreateInput,
  'id' | 'tournamentId' | 'createdAt' | 'updatedAt'
>;

type VenueData = Omit<
  Prisma.TournamentVenueUncheckedCreateInput,
  'id' | 'tournamentId' | 'createdAt' | 'updatedAt'
>;

type GamingRoomData = Omit<
  Prisma.TournamentGamingRoomUncheckedCreateInput,
  'id' | 'venueId' | 'createdAt' | 'updatedAt'
>;

type EligibilityCaptain = Prisma.UserGetPayload<{
  select: typeof eligibilityCaptainSelect;
}>;

type EligibilityTeam = Prisma.TeamGetPayload<{
  select: typeof eligibilityTeamSelect;
}>;

type EligibilityTournament = Prisma.TournamentGetPayload<{
  select: typeof eligibilityTournamentSelect;
}>;

type RegistrationRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof tournamentRegistrationSelect;
}>;

type CaptainRegistrationListRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationListSelect;
}>;

type CaptainRegistrationDetailRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationDetailSelect;
}>;

type RegistrationContext = {
  activeRegistrationCount: number;
  existingTeamRegistrationCount: number;
};

type RosterSnapshotItem = {
  rosterPlayerId: string;
  gamerTag: string;
  realName: string | null;
  gameAccountId: string;
  phoneNumber: string;
  email: string | null;
  discordUsername: string | null;
  rosterType: RosterType;
  rank: string | null;
  country: string | null;
};

type CaptainContactSnapshot = {
  displayName: string;
  email: string;
  phoneNumber: string | null;
  discordUsername: string | null;
};

const activeRegistrationStatuses = [
  TournamentRegistrationStatus.PENDING_PAYMENT,
  TournamentRegistrationStatus.PENDING_APPROVAL,
  TournamentRegistrationStatus.CONFIRMED,
  TournamentRegistrationStatus.WAITLISTED,
  TournamentRegistrationStatus.CHECKED_IN,
  TournamentRegistrationStatus.REFUND_PENDING,
] as const;

const tournamentSelect = {
  id: true,
  organizerId: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  gameKey: true,
  mode: true,
  visibility: true,
  status: true,
  format: true,
  minimumTeams: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
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
  registrationFee: true,
  currency: true,
  prizePool: true,
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
  registrationClosesAt: true,
  rosterLocksAt: true,
  checkInOpensAt: true,
  checkInClosesAt: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  waitlistEnabled: true,
  maximumWaitlistSize: true,
  manualApprovalRequired: true,
  publishedAt: true,
  registrationOpenedAt: true,
  registrationClosedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentSelect;

const tournamentDetailSelect = {
  ...tournamentSelect,
  onlineConfiguration: {
    select: {
      id: true,
      serverRegion: true,
      evidenceRequired: true,
      screenshotRequirements: true,
    },
  },
  venue: {
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      address: true,
      checkInLocation: true,
      equipmentProvided: true,
      gamingRooms: {
        select: {
          id: true,
          name: true,
          stationCount: true,
          cpu: true,
          gpu: true,
          ram: true,
          storage: true,
          operatingSystem: true,
          monitorModel: true,
          monitorRefreshRateHz: true,
          mouse: true,
          keyboard: true,
          headset: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentSelect;

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

const gamingRoomSelect = {
  id: true,
  venueId: true,
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
  internetConnection: true,
  equipmentNotes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentGamingRoomSelect;

const eligibilityCaptainSelect = {
  id: true,
  email: true,
  displayName: true,
  phoneNumber: true,
  discordUsername: true,
  role: true,
} satisfies Prisma.UserSelect;

const eligibilityTeamSelect = {
  id: true,
  name: true,
  gameKey: true,
  region: true,
  status: true,
  rosterPlayers: {
    select: {
      id: true,
      gamerTag: true,
      realName: true,
      gameAccountId: true,
      phoneNumber: true,
      email: true,
      discordUsername: true,
      country: true,
      rank: true,
      rosterType: true,
      eligibilityStatus: true,
    },
  },
} satisfies Prisma.TeamSelect;

const eligibilityTournamentSelect = {
  id: true,
  gameKey: true,
  visibility: true,
  status: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  maximumSubstitutes: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumRank: true,
  maximumRank: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  cancelledAt: true,
} satisfies Prisma.TournamentSelect;

const registrationTournamentSelect = {
  id: true,
  slug: true,
  name: true,
  gameKey: true,
  mode: true,
  visibility: true,
  status: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  maximumSubstitutes: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumRank: true,
  maximumRank: true,
  registrationFee: true,
  currency: true,
  rulesVersion: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  startsAt: true,
  cancelledAt: true,
} satisfies Prisma.TournamentSelect;

const tournamentRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  rulesVersion: true,
  rulesAcceptedAt: true,
  submittedAt: true,
  tournament: {
    select: {
      id: true,
      slug: true,
      name: true,
      gameKey: true,
      mode: true,
      registrationFee: true,
      currency: true,
      startsAt: true,
    },
  },
  team: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainRegistrationTournamentSummarySelect = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  gameKey: true,
  mode: true,
  status: true,
  registrationFee: true,
  currency: true,
  startsAt: true,
} satisfies Prisma.TournamentSelect;

const captainRegistrationListSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  submittedAt: true,
  rejectionReason: true,
  tournament: {
    select: captainRegistrationTournamentSummarySelect,
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainRegistrationDetailSelect = {
  ...captainRegistrationListSelect,
  rulesVersion: true,
  rulesAcceptedAt: true,
  approvedAt: true,
  rejectedAt: true,
  withdrawnAt: true,
  checkedInAt: true,
  disqualifiedAt: true,
  rosterSnapshot: true,
  captainContactSnapshot: true,
} satisfies Prisma.TournamentRegistrationSelect;

@Injectable()
export class TournamentsService {
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

  async getCaptainTournamentEligibility(
    captainId: string,
    tournamentId: string,
  ): Promise<TournamentEligibilityResponseDto> {
    const [captain, team, tournament] = await Promise.all([
      this.databaseService.client.user.findFirst({
        where: {
          id: captainId,
          role: UserRole.CAPTAIN,
        },
        select: eligibilityCaptainSelect,
      }),
      this.databaseService.client.team.findUnique({
        where: { captainId },
        select: eligibilityTeamSelect,
      }),
      this.databaseService.client.tournament.findUnique({
        where: { id: tournamentId },
        select: eligibilityTournamentSelect,
      }),
    ]);

    if (!captain) {
      throw new NotFoundException('Captain profile was not found');
    }

    if (!team) {
      throw new UnprocessableEntityException('Captain team was not found');
    }

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    const registrationContext = await this.getRegistrationContextForEligibility(
      tournament.id,
      team.id,
    );
    const issues = this.evaluateTournamentEligibility(
      captain,
      team,
      tournament,
      new Date(),
      registrationContext,
    );

    return {
      eligible: issues.length === 0,
      team: {
        id: team.id,
        name: team.name,
      },
      issues,
    };
  }

  async createCaptainTournamentRegistration(
    captainId: string,
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationResponseDto> {
    if (dto.acceptRules !== true) {
      throw new BadRequestException('Tournament rules must be accepted.');
    }

    try {
      const registration = await this.databaseService.client.$transaction(
        async (transaction) => {
          const [captain, team, tournament] = await Promise.all([
            transaction.user.findFirst({
              where: {
                id: captainId,
                role: UserRole.CAPTAIN,
              },
              select: eligibilityCaptainSelect,
            }),
            transaction.team.findUnique({
              where: { captainId },
              select: eligibilityTeamSelect,
            }),
            transaction.tournament.findUnique({
              where: { id: tournamentId },
              select: registrationTournamentSelect,
            }),
          ]);

          if (!captain) {
            throw new NotFoundException('Captain profile was not found');
          }

          if (!team) {
            throw new UnprocessableEntityException(
              'Captain team was not found',
            );
          }

          if (!tournament) {
            throw new NotFoundException('Tournament was not found');
          }

          const registrationContext =
            await this.getRegistrationContextForEligibility(
              tournament.id,
              team.id,
              transaction,
            );

          if (registrationContext.existingTeamRegistrationCount > 0) {
            throw new ConflictException(
              'Team is already registered for this tournament.',
            );
          }

          const issues = this.evaluateTournamentEligibility(
            captain,
            team,
            tournament,
            new Date(),
            registrationContext,
          );

          if (issues.length > 0) {
            throw new UnprocessableEntityException({
              message: 'Captain team is not eligible for this tournament.',
              issues,
            });
          }

          const paidTournament =
            Number(tournament.registrationFee.toString()) > 0;
          const now = new Date();

          return transaction.tournamentRegistration.create({
            data: {
              tournamentId: tournament.id,
              teamId: team.id,
              captainId: captain.id,
              status: paidTournament
                ? TournamentRegistrationStatus.PENDING_PAYMENT
                : TournamentRegistrationStatus.PENDING_APPROVAL,
              paymentStatus: paidTournament
                ? RegistrationPaymentStatus.PENDING
                : RegistrationPaymentStatus.NOT_REQUIRED,
              approvalStatus: RegistrationApprovalStatus.PENDING,
              rosterSnapshot: this.createRosterSnapshot(team),
              captainContactSnapshot:
                this.createCaptainContactSnapshot(captain),
              rulesVersion: tournament.rulesVersion,
              rulesAcceptedAt: now,
              submittedAt: now,
            },
            select: tournamentRegistrationSelect,
          });
        },
      );

      return this.toTournamentRegistrationResponse(registration);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Team is already registered for this tournament.',
        );
      }

      throw error;
    }
  }

  async listCaptainRegistrations(
    captainId: string,
    query: ListCaptainRegistrationsQueryDto,
  ): Promise<CaptainRegistrationListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.toCaptainRegistrationWhere(captainId, query);
    const orderBy = this.toCaptainRegistrationOrderBy(query);

    const [items, totalItems] = await this.databaseService.client.$transaction([
      this.databaseService.client.tournamentRegistration.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: captainRegistrationListSelect,
      }),
      this.databaseService.client.tournamentRegistration.count({ where }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items.map((item) => this.toCaptainRegistrationListItem(item)),
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

  async getCaptainRegistrationDetails(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainRegistrationDetailSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    return this.toCaptainRegistrationDetail(registration);
  }

  async publishOrganizerTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentDetailOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.DRAFT],
          'Only draft tournaments can be published.',
        );

        const publicationReadiness = this.getPublicationReadiness(tournament);

        if (!publicationReadiness.ready) {
          throw new UnprocessableEntityException({
            message: 'Tournament is not ready to publish.',
            issues: publicationReadiness.issues,
          });
        }

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.PUBLISHED,
            publishedAt: new Date(),
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async openOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentForLifecycleOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.PUBLISHED],
          'Only published tournaments can open registration.',
        );

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.REGISTRATION_OPEN,
            registrationOpenedAt: new Date(),
            registrationClosedAt: null,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async closeOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentForLifecycleOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.REGISTRATION_OPEN],
          'Only registration-open tournaments can close registration.',
        );

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.REGISTRATION_CLOSED,
            registrationClosedAt: new Date(),
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async cancelOrganizerTournament(
    organizerId: string,
    tournamentId: string,
    dto: CancelTournamentDto,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentForLifecycleOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [
            TournamentStatus.DRAFT,
            TournamentStatus.PUBLISHED,
            TournamentStatus.REGISTRATION_OPEN,
            TournamentStatus.REGISTRATION_CLOSED,
            TournamentStatus.CHECK_IN_OPEN,
            TournamentStatus.IN_PROGRESS,
            TournamentStatus.POSTPONED,
          ],
          'This tournament cannot be cancelled from its current status.',
        );

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: dto.reason,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async listGamingRooms(
    organizerId: string,
    tournamentId: string,
  ): Promise<GamingRoomListResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );

    const rooms =
      await this.databaseService.client.tournamentGamingRoom.findMany({
        where: { venueId: venue.id },
        orderBy: { createdAt: 'asc' },
        select: gamingRoomSelect,
      });

    return {
      items: rooms.map((room) => toGamingRoomResponse(room)),
    };
  }

  async createGamingRoom(
    organizerId: string,
    tournamentId: string,
    dto: CreateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );

    const room = await this.databaseService.client.tournamentGamingRoom.create({
      data: {
        venueId: venue.id,
        ...this.toGamingRoomData(dto),
      },
      select: gamingRoomSelect,
    });

    return toGamingRoomResponse(room);
  }

  async getGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    const room = await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    return toGamingRoomResponse(room);
  }

  async updateGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
    dto: UpdateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    const room = await this.databaseService.client.tournamentGamingRoom.update({
      where: { id: gamingRoomId },
      data: this.toGamingRoomUpdateData(dto),
      select: gamingRoomSelect,
    });

    return toGamingRoomResponse(room);
  }

  async deleteGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ): Promise<void> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    await this.databaseService.client.tournamentGamingRoom.delete({
      where: { id: gamingRoomId },
      select: { id: true },
    });
  }

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

  async updateOrganizerTournamentDraft(
    organizerId: string,
    tournamentId: string,
    dto: UpdateTournamentDraftDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );
    this.assertDraftLifecycle(tournament.status, 'updated');

    const merged = this.mergeTournamentDraft(tournament, dto);
    this.validateCreateDraft(merged);

    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const slug =
          typeof dto.name === 'string' && dto.name !== tournament.name
            ? await this.generateUniqueSlug(
                dto.name,
                transaction,
                tournament.id,
              )
            : undefined;

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            ...this.toTournamentUpdateData(dto),
            ...(slug ? { slug } : {}),
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async deleteOrganizerTournamentDraft(
    organizerId: string,
    tournamentId: string,
  ): Promise<void> {
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );
    this.assertDraftLifecycle(tournament.status, 'deleted');

    await this.databaseService.client.tournament.delete({
      where: { id: tournament.id },
      select: { id: true },
    });
  }

  async getOrganizerTournamentDetails(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerTournamentDetailResponseDto> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: tournamentDetailSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return {
      tournament: toTournamentResponse(tournament),
      publicationReadiness: this.getPublicationReadiness(tournament),
    };
  }

  async listOrganizerTournaments(
    organizerId: string,
    query: ListOrganizerTournamentsQueryDto,
  ): Promise<OrganizerTournamentListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.toOrganizerTournamentWhere(organizerId, query);
    const orderBy = this.toOrganizerTournamentOrderBy(query);

    const [items, totalItems] = await this.databaseService.client.$transaction([
      this.databaseService.client.tournament.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: tournamentSelect,
      }),

      this.databaseService.client.tournament.count({ where }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items.map((item) => toTournamentResponse(item)),
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

  async createOrganizerDraft(
    organizerId: string,
    dto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    this.validateCreateDraft(dto);

    const tournament = await this.databaseService.client.$transaction(
      async (transaction) => {
        const slug = await this.generateUniqueSlug(dto.name, transaction);

        return transaction.tournament.create({
          data: {
            organizerId,
            name: dto.name,
            slug,
            shortDescription: dto.shortDescription,
            description: dto.description,
            logoUrl: dto.logoUrl,
            coverUrl: dto.coverUrl,
            gameKey: dto.gameKey,
            mode: dto.mode,
            visibility: dto.visibility ?? TournamentVisibility.PUBLIC,
            status: TournamentStatus.DRAFT,
            format: dto.format,
            minimumTeams: dto.minimumTeams,
            maximumTeams: dto.maximumTeams,
            minimumStarters: dto.minimumStarters,
            maximumStarters: dto.maximumStarters,
            maximumSubstitutes: dto.maximumSubstitutes ?? 0,
            defaultBestOf: dto.defaultBestOf ?? 1,
            finalBestOf: dto.finalBestOf ?? 3,
            seedingMethod: dto.seedingMethod ?? TournamentSeedingMethod.MANUAL,
            thirdPlaceMatch: dto.thirdPlaceMatch ?? false,
            requiredGameAccountId: dto.requiredGameAccountId ?? true,
            allowedRegion: dto.allowedRegion,
            allowedCountries: dto.allowedCountries ?? [],
            allowedPlatforms: dto.allowedPlatforms ?? [],
            minimumPlayerAge: dto.minimumPlayerAge,
            minimumRank: dto.minimumRank,
            maximumRank: dto.maximumRank,
            registrationFee: this.toMoney(dto.registrationFee ?? 0),
            currency: dto.currency ?? 'EGP',
            prizePool: this.toMoney(dto.prizePool ?? 0),
            prizeDistribution:
              dto.prizeDistribution === undefined
                ? undefined
                : (dto.prizeDistribution as Prisma.InputJsonValue),
            refundPolicy: dto.refundPolicy,
            cancellationPolicy: dto.cancellationPolicy,
            rules: dto.rules,
            rulesVersion: dto.rulesVersion ?? '1.0',
            rosterChangeRules: dto.rosterChangeRules,
            checkInRules: dto.checkInRules,
            matchReportingRules: dto.matchReportingRules,
            evidenceRequirements: dto.evidenceRequirements,
            disputeDeadlineMinutes: dto.disputeDeadlineMinutes,
            forfeitRules: dto.forfeitRules,
            codeOfConduct: dto.codeOfConduct,
            registrationOpensAt: dto.registrationOpensAt,
            registrationClosesAt: dto.registrationClosesAt,
            rosterLocksAt: dto.rosterLocksAt,
            checkInOpensAt: dto.checkInOpensAt,
            checkInClosesAt: dto.checkInClosesAt,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            timezone: dto.timezone ?? 'Africa/Cairo',
            waitlistEnabled: dto.waitlistEnabled ?? false,
            maximumWaitlistSize: dto.maximumWaitlistSize,
            manualApprovalRequired: dto.manualApprovalRequired ?? true,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(tournament);
  }

  private validateCreateDraft(dto: CreateTournamentDto): void {
    const issues: ValidationIssue[] = [];

    this.requireOrder(
      issues,
      'maximumTeams',
      dto.maximumTeams >= dto.minimumTeams,
      'maximumTeams must be greater than or equal to minimumTeams.',
    );
    this.requireOrder(
      issues,
      'maximumStarters',
      dto.maximumStarters >= dto.minimumStarters,
      'maximumStarters must be greater than or equal to minimumStarters.',
    );
    this.requireOddBestOf(issues, 'defaultBestOf', dto.defaultBestOf ?? 1);
    this.requireOddBestOf(issues, 'finalBestOf', dto.finalBestOf ?? 3);
    this.requireOrder(
      issues,
      'registrationClosesAt',
      dto.registrationOpensAt < dto.registrationClosesAt,
      'registrationClosesAt must be after registrationOpensAt.',
    );
    this.requireOrder(
      issues,
      'startsAt',
      dto.registrationClosesAt < dto.startsAt,
      'startsAt must be after registrationClosesAt.',
    );

    if (dto.rosterLocksAt) {
      this.requireOrder(
        issues,
        'rosterLocksAt',
        dto.rosterLocksAt >= dto.registrationClosesAt &&
          dto.rosterLocksAt <= dto.startsAt,
        'rosterLocksAt must be between registrationClosesAt and startsAt.',
      );
    }

    if (dto.checkInOpensAt || dto.checkInClosesAt) {
      this.requireOrder(
        issues,
        'checkInOpensAt',
        Boolean(dto.checkInOpensAt),
        'checkInOpensAt is required when checkInClosesAt is provided.',
      );
      this.requireOrder(
        issues,
        'checkInClosesAt',
        Boolean(dto.checkInClosesAt),
        'checkInClosesAt is required when checkInOpensAt is provided.',
      );
    }

    if (dto.checkInOpensAt && dto.checkInClosesAt) {
      this.requireOrder(
        issues,
        'checkInClosesAt',
        dto.checkInOpensAt < dto.checkInClosesAt,
        'checkInClosesAt must be after checkInOpensAt.',
      );
      this.requireOrder(
        issues,
        'checkInClosesAt',
        dto.checkInClosesAt <= dto.startsAt,
        'checkInClosesAt must be before or equal to startsAt.',
      );
    }

    if (dto.endsAt) {
      this.requireOrder(
        issues,
        'endsAt',
        dto.endsAt > dto.startsAt,
        'endsAt must be after startsAt.',
      );
    }

    if (dto.waitlistEnabled === false && dto.maximumWaitlistSize) {
      issues.push({
        field: 'maximumWaitlistSize',
        message: 'maximumWaitlistSize requires waitlistEnabled to be true.',
      });
    }

    if (!this.isValidTimezone(dto.timezone ?? 'Africa/Cairo')) {
      issues.push({
        field: 'timezone',
        message: 'timezone must be a valid IANA time zone.',
      });
    }

    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Tournament draft validation failed.',
        issues,
      });
    }
  }

  private toOrganizerTournamentWhere(
    organizerId: string,
    query: ListOrganizerTournamentsQueryDto,
  ): Prisma.TournamentWhereInput {
    const where: Prisma.TournamentWhereInput = {
      organizerId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.mode) {
      where.mode = query.mode;
    }

    if (query.visibility) {
      where.visibility = query.visibility;
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

  private toOrganizerTournamentOrderBy(
    query: ListOrganizerTournamentsQueryDto,
  ): Prisma.TournamentOrderByWithRelationInput {
    const sortBy = query.sortBy ?? OrganizerTournamentSortBy.CREATED_AT;
    const sortDirection = query.sortDirection ?? SortDirection.DESC;

    return {
      [sortBy]: sortDirection,
    };
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

  private async findOwnedTournamentOrThrow(
    organizerId: string,
    tournamentId: string,
  ): Promise<Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: tournamentSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private async findOwnedTournamentForLifecycleOrThrow(
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
    organizerId: string,
    tournamentId: string,
  ): Promise<Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>> {
    const tournament = await transaction.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: tournamentSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private async findOwnedTournamentDetailOrThrow(
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
    organizerId: string,
    tournamentId: string,
  ): Promise<
    Prisma.TournamentGetPayload<{
      select: typeof tournamentDetailSelect;
    }>
  > {
    const tournament = await transaction.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: tournamentDetailSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private async assertOwnedOnlineTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<void> {
    const tournament = await this.findOwnedTournamentOrThrow(
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
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );

    if (tournament.mode !== TournamentMode.ONSITE) {
      throw new ConflictException(
        'Venue configuration is only available for on-site tournaments',
      );
    }
  }

  private async findOwnedOnsiteVenueOrThrow(
    organizerId: string,
    tournamentId: string,
  ): Promise<{ id: string }> {
    await this.assertOwnedOnsiteTournament(organizerId, tournamentId);

    const venue = await this.databaseService.client.tournamentVenue.findUnique({
      where: { tournamentId },
      select: { id: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue was not found');
    }

    return venue;
  }

  private async findGamingRoomOrThrow(
    venueId: string,
    gamingRoomId: string,
  ): Promise<
    Prisma.TournamentGamingRoomGetPayload<{ select: typeof gamingRoomSelect }>
  > {
    const room =
      await this.databaseService.client.tournamentGamingRoom.findFirst({
        where: {
          id: gamingRoomId,
          venueId,
        },
        select: gamingRoomSelect,
      });

    if (!room) {
      throw new NotFoundException('Gaming room was not found');
    }

    return room;
  }

  private toCaptainRegistrationWhere(
    captainId: string,
    query: ListCaptainRegistrationsQueryDto,
  ): Prisma.TournamentRegistrationWhereInput {
    const tournament: Prisma.TournamentWhereInput = {};

    if (query.gameKey) {
      tournament.gameKey = {
        equals: query.gameKey,
        mode: 'insensitive',
      };
    }

    if (query.mode) {
      tournament.mode = query.mode;
    }

    if (query.time === CaptainRegistrationTimeFilter.UPCOMING) {
      tournament.startsAt = { gte: new Date() };
    }

    if (query.time === CaptainRegistrationTimeFilter.PAST) {
      tournament.startsAt = { lt: new Date() };
    }

    return {
      captainId,
      ...(query.status ? { status: query.status } : {}),
      ...(Object.keys(tournament).length > 0 ? { tournament } : {}),
    };
  }

  private toCaptainRegistrationOrderBy(
    query: ListCaptainRegistrationsQueryDto,
  ): Prisma.TournamentRegistrationOrderByWithRelationInput {
    const direction =
      query.sortDirection ?? CaptainRegistrationSortDirection.DESC;
    const sortBy = query.sortBy ?? CaptainRegistrationSortBy.SUBMITTED_AT;

    if (sortBy === CaptainRegistrationSortBy.TOURNAMENT_STARTS_AT) {
      return {
        tournament: {
          startsAt: direction,
        },
      };
    }

    return {
      submittedAt: direction,
    };
  }

  private toCaptainRegistrationListItem(
    registration: CaptainRegistrationListRecord,
  ): CaptainRegistrationListItemDto {
    return {
      registrationId: registration.id,
      tournament: this.toCaptainRegistrationTournamentSummary(
        registration.tournament,
      ),
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      approvalStatus: registration.approvalStatus,
      submittedAt: registration.submittedAt,
      rejectionReason: registration.rejectionReason,
      nextAction: this.getCaptainRegistrationNextAction(registration),
    };
  }

  private toCaptainRegistrationDetail(
    registration: CaptainRegistrationDetailRecord,
  ): CaptainRegistrationDetailResponseDto {
    return {
      registrationId: registration.id,
      tournament: this.toCaptainRegistrationTournamentSummary(
        registration.tournament,
      ),
      lifecycle: {
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        approvalStatus: registration.approvalStatus,
        submittedAt: registration.submittedAt,
        approvedAt: registration.approvedAt,
        rejectedAt: registration.rejectedAt,
        rejectionReason: registration.rejectionReason,
        withdrawnAt: registration.withdrawnAt,
        checkedInAt: registration.checkedInAt,
        disqualifiedAt: registration.disqualifiedAt,
      },
      rulesVersion: registration.rulesVersion,
      rulesAcceptedAt: registration.rulesAcceptedAt,
      rosterSnapshot: registration.rosterSnapshot,
      captainContactSnapshot: registration.captainContactSnapshot,
      nextAction: this.getCaptainRegistrationNextAction(registration),
    };
  }

  private toCaptainRegistrationTournamentSummary(
    tournament: CaptainRegistrationListRecord['tournament'],
  ): CaptainRegistrationListItemDto['tournament'] {
    return {
      id: tournament.id,
      slug: tournament.slug,
      name: tournament.name,
      logoUrl: tournament.logoUrl,
      gameKey: tournament.gameKey,
      mode: tournament.mode,
      status: tournament.status,
      startsAt: tournament.startsAt,
      registrationFee: tournament.registrationFee.toString(),
      currency: tournament.currency,
    };
  }

  private getCaptainRegistrationNextAction(
    registration: Pick<
      CaptainRegistrationListRecord,
      'status' | 'paymentStatus' | 'approvalStatus' | 'tournament'
    >,
  ): CaptainRegistrationNextAction {
    if (
      registration.paymentStatus === RegistrationPaymentStatus.PENDING ||
      registration.status === TournamentRegistrationStatus.PENDING_PAYMENT
    ) {
      return CaptainRegistrationNextAction.COMPLETE_PAYMENT;
    }

    if (registration.approvalStatus === RegistrationApprovalStatus.REJECTED) {
      return CaptainRegistrationNextAction.REVIEW_REJECTION;
    }

    if (registration.status === TournamentRegistrationStatus.PENDING_APPROVAL) {
      return CaptainRegistrationNextAction.WAIT_FOR_APPROVAL;
    }

    if (registration.tournament.status === TournamentStatus.COMPLETED) {
      return CaptainRegistrationNextAction.TOURNAMENT_COMPLETED;
    }

    if (
      registration.status === TournamentRegistrationStatus.CONFIRMED &&
      registration.tournament.status === TournamentStatus.CHECK_IN_OPEN
    ) {
      return CaptainRegistrationNextAction.CHECK_IN;
    }

    if (
      registration.status === TournamentRegistrationStatus.CONFIRMED ||
      registration.status === TournamentRegistrationStatus.CHECKED_IN
    ) {
      return CaptainRegistrationNextAction.OPEN_TOURNAMENT_HUB;
    }

    return CaptainRegistrationNextAction.NONE;
  }

  private async getRegistrationContextForEligibility(
    tournamentId: string,
    teamId: string,
    client: Prisma.TransactionClient | DatabaseService['client'] = this
      .databaseService.client,
  ): Promise<RegistrationContext> {
    const [activeRegistrationCount, existingTeamRegistrationCount] =
      await Promise.all([
        client.tournamentRegistration.count({
          where: {
            tournamentId,
            status: {
              in: [...activeRegistrationStatuses],
            },
          },
        }),
        client.tournamentRegistration.count({
          where: {
            tournamentId,
            teamId,
          },
        }),
      ]);

    return {
      activeRegistrationCount,
      existingTeamRegistrationCount,
    };
  }

  private evaluateTournamentEligibility(
    captain: EligibilityCaptain,
    team: EligibilityTeam,
    tournament: EligibilityTournament,
    now: Date,
    registrationContext: RegistrationContext,
  ): TournamentEligibilityIssueDto[] {
    const issues: TournamentEligibilityIssueDto[] = [];
    const starters = team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.STARTER,
    );
    const substitutes = team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.SUBSTITUTE,
    );

    if (!captain.phoneNumber) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.CAPTAIN_PROFILE_INCOMPLETE,
        'profile.phoneNumber',
        'Captain profile must include a phone number before registration.',
      );
    }

    if (team.status !== TeamStatus.ACTIVE) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TEAM_INACTIVE,
        'team.status',
        'Only active teams can register for tournaments.',
      );
    }

    if (tournament.visibility !== TournamentVisibility.PUBLIC) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.visibility',
        'This tournament is not publicly open for Captain registration.',
      );
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.status',
        'Tournament registration is not open.',
      );
    }

    if (
      tournament.cancelledAt ||
      tournament.status === TournamentStatus.CANCELLED ||
      tournament.status === TournamentStatus.ARCHIVED
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.status',
        'Cancelled or archived tournaments are not open for registration.',
      );
    }

    if (now > tournament.registrationClosesAt) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_DEADLINE_PASSED,
        'tournament.registrationClosesAt',
        'The tournament registration deadline has passed.',
      );
    }

    if (now < tournament.registrationOpensAt) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.registrationOpensAt',
        'The tournament registration window has not opened yet.',
      );
    }

    if (
      registrationContext.activeRegistrationCount >= tournament.maximumTeams
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOURNAMENT_FULL,
        'tournament.maximumTeams',
        'This tournament has reached its team capacity.',
      );
    }

    if (registrationContext.existingTeamRegistrationCount > 0) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.ALREADY_REGISTERED,
        'team',
        'This team is already registered for this tournament.',
      );
    }

    if (team.gameKey !== tournament.gameKey) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.GAME_MISMATCH,
        'team.gameKey',
        'Team game must match the tournament game.',
      );
    }

    if (starters.length < tournament.minimumStarters) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.INSUFFICIENT_STARTERS,
        'roster',
        `This tournament requires at least ${tournament.minimumStarters} starter players.`,
      );
    }

    if (starters.length > tournament.maximumStarters) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOO_MANY_STARTERS,
        'roster',
        `This tournament allows at most ${tournament.maximumStarters} starter players.`,
      );
    }

    if (substitutes.length > tournament.maximumSubstitutes) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOO_MANY_SUBSTITUTES,
        'roster',
        `This tournament allows at most ${tournament.maximumSubstitutes} substitute players.`,
      );
    }

    if (
      tournament.allowedRegion &&
      (!team.region || team.region !== tournament.allowedRegion)
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGION_NOT_ALLOWED,
        'team.region',
        `Team region must be ${tournament.allowedRegion}.`,
      );
    }

    for (const player of team.rosterPlayers) {
      if (tournament.requiredGameAccountId && !player.gameAccountId.trim()) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.MISSING_GAME_ACCOUNT_ID,
          `roster.${player.id}.gameAccountId`,
          `${player.gamerTag} must have a game account ID.`,
        );
      }

      if (!player.phoneNumber.trim()) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.MISSING_PLAYER_PHONE,
          `roster.${player.id}.phoneNumber`,
          `${player.gamerTag} must have a phone number.`,
        );
      }

      if (
        tournament.allowedCountries.length > 0 &&
        (!player.country ||
          !tournament.allowedCountries.includes(player.country))
      ) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.COUNTRY_NOT_ALLOWED,
          `roster.${player.id}.country`,
          `${player.gamerTag} is not from an allowed country.`,
        );
      }

      if ((tournament.minimumRank || tournament.maximumRank) && !player.rank) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.RANK_NOT_ALLOWED,
          `roster.${player.id}.rank`,
          `${player.gamerTag} must include a rank for this tournament.`,
        );
      }

      if (player.eligibilityStatus === EligibilityStatus.INELIGIBLE) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.PLAYER_INELIGIBLE,
          `roster.${player.id}.eligibilityStatus`,
          `${player.gamerTag} is marked ineligible.`,
        );
      }
    }

    return issues;
  }

  private createRosterSnapshot(team: EligibilityTeam): Prisma.InputJsonValue {
    const snapshot: RosterSnapshotItem[] = team.rosterPlayers.map((player) => ({
      rosterPlayerId: player.id,
      gamerTag: player.gamerTag,
      realName: player.realName,
      gameAccountId: player.gameAccountId,
      phoneNumber: player.phoneNumber,
      email: player.email,
      discordUsername: player.discordUsername,
      rosterType: player.rosterType,
      rank: player.rank,
      country: player.country,
    }));

    return snapshot;
  }

  private createCaptainContactSnapshot(
    captain: EligibilityCaptain,
  ): Prisma.InputJsonObject {
    const snapshot: CaptainContactSnapshot = {
      displayName: captain.displayName,
      email: captain.email,
      phoneNumber: captain.phoneNumber,
      discordUsername: captain.discordUsername,
    };

    return snapshot;
  }

  private toTournamentRegistrationResponse(
    registration: RegistrationRecord,
  ): TournamentRegistrationResponseDto {
    return {
      id: registration.id,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      approvalStatus: registration.approvalStatus,
      rulesVersion: registration.rulesVersion,
      rulesAcceptedAt: registration.rulesAcceptedAt,
      submittedAt: registration.submittedAt,
      tournament: {
        id: registration.tournament.id,
        slug: registration.tournament.slug,
        name: registration.tournament.name,
        gameKey: registration.tournament.gameKey,
        mode: registration.tournament.mode,
        registrationFee: registration.tournament.registrationFee.toString(),
        currency: registration.tournament.currency,
        startsAt: registration.tournament.startsAt,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
      },
    };
  }

  private addEligibilityIssue(
    issues: TournamentEligibilityIssueDto[],
    code: TournamentEligibilityIssueCode,
    field: string,
    message: string,
  ): void {
    issues.push({ code, field, message });
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

  private toGamingRoomData(dto: CreateGamingRoomDto): GamingRoomData {
    return {
      name: dto.name,
      description: dto.description,
      purpose: dto.purpose,
      stationCount: dto.stationCount,
      cpu: dto.cpu,
      gpu: dto.gpu,
      ram: dto.ram,
      storage: dto.storage,
      operatingSystem: dto.operatingSystem,
      monitorBrand: dto.monitorBrand,
      monitorModel: dto.monitorModel,
      monitorSizeInches: this.toOptionalDecimalString(dto.monitorSizeInches),
      monitorResolution: dto.monitorResolution,
      monitorRefreshRateHz: dto.monitorRefreshRateHz,
      monitorResponseTimeMs: this.toOptionalDecimalString(
        dto.monitorResponseTimeMs,
      ),
      mouse: dto.mouse,
      keyboard: dto.keyboard,
      headset: dto.headset,
      mousePad: dto.mousePad,
      controller: dto.controller,
      internetConnection: dto.internetConnection,
      equipmentNotes: dto.equipmentNotes,
    };
  }

  private toGamingRoomUpdateData(
    dto: UpdateGamingRoomDto,
  ): Prisma.TournamentGamingRoomUncheckedUpdateInput {
    return {
      name: dto.name,
      description: dto.description,
      purpose: dto.purpose,
      stationCount: dto.stationCount,
      cpu: dto.cpu,
      gpu: dto.gpu,
      ram: dto.ram,
      storage: dto.storage,
      operatingSystem: dto.operatingSystem,
      monitorBrand: dto.monitorBrand,
      monitorModel: dto.monitorModel,
      monitorSizeInches: this.toOptionalDecimalString(dto.monitorSizeInches),
      monitorResolution: dto.monitorResolution,
      monitorRefreshRateHz: dto.monitorRefreshRateHz,
      monitorResponseTimeMs: this.toOptionalDecimalString(
        dto.monitorResponseTimeMs,
      ),
      mouse: dto.mouse,
      keyboard: dto.keyboard,
      headset: dto.headset,
      mousePad: dto.mousePad,
      controller: dto.controller,
      internetConnection: dto.internetConnection,
      equipmentNotes: dto.equipmentNotes,
    };
  }

  private toOptionalDecimalString(
    value: number | undefined,
  ): string | undefined {
    return value === undefined ? undefined : value.toFixed(1);
  }

  private assertDraftLifecycle(
    status: TournamentStatus,
    action: 'updated' | 'deleted',
  ): void {
    if (status !== TournamentStatus.DRAFT) {
      throw new ConflictException(`Only draft tournaments can be ${action}`);
    }
  }

  private assertLifecycleStatus(
    status: TournamentStatus,
    allowedStatuses: TournamentStatus[],
    message: string,
  ): void {
    if (!allowedStatuses.includes(status)) {
      throw new ConflictException(message);
    }
  }

  private mergeTournamentDraft(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
    dto: UpdateTournamentDraftDto,
  ): CreateTournamentDto {
    return {
      name: dto.name ?? tournament.name,
      shortDescription:
        dto.shortDescription ?? tournament.shortDescription ?? undefined,
      description: dto.description ?? tournament.description ?? undefined,
      logoUrl: dto.logoUrl ?? tournament.logoUrl ?? undefined,
      coverUrl: dto.coverUrl ?? tournament.coverUrl ?? undefined,
      gameKey: dto.gameKey ?? tournament.gameKey,
      mode: dto.mode ?? tournament.mode,
      visibility: dto.visibility ?? tournament.visibility,
      format: dto.format ?? tournament.format,
      minimumTeams: dto.minimumTeams ?? tournament.minimumTeams,
      maximumTeams: dto.maximumTeams ?? tournament.maximumTeams,
      minimumStarters: dto.minimumStarters ?? tournament.minimumStarters,
      maximumStarters: dto.maximumStarters ?? tournament.maximumStarters,
      maximumSubstitutes:
        dto.maximumSubstitutes ?? tournament.maximumSubstitutes,
      defaultBestOf: dto.defaultBestOf ?? tournament.defaultBestOf,
      finalBestOf: dto.finalBestOf ?? tournament.finalBestOf,
      seedingMethod: dto.seedingMethod ?? tournament.seedingMethod,
      thirdPlaceMatch: dto.thirdPlaceMatch ?? tournament.thirdPlaceMatch,
      requiredGameAccountId:
        dto.requiredGameAccountId ?? tournament.requiredGameAccountId,
      allowedRegion: dto.allowedRegion ?? tournament.allowedRegion ?? undefined,
      allowedCountries: dto.allowedCountries ?? tournament.allowedCountries,
      allowedPlatforms: dto.allowedPlatforms ?? tournament.allowedPlatforms,
      minimumPlayerAge:
        dto.minimumPlayerAge ?? tournament.minimumPlayerAge ?? undefined,
      minimumRank: dto.minimumRank ?? tournament.minimumRank ?? undefined,
      maximumRank: dto.maximumRank ?? tournament.maximumRank ?? undefined,
      registrationFee:
        dto.registrationFee ?? Number(tournament.registrationFee.toString()),
      currency: dto.currency ?? tournament.currency,
      prizePool: dto.prizePool ?? Number(tournament.prizePool.toString()),
      prizeDistribution:
        dto.prizeDistribution ??
        this.toRecord(tournament.prizeDistribution) ??
        undefined,
      refundPolicy: dto.refundPolicy ?? tournament.refundPolicy ?? undefined,
      cancellationPolicy:
        dto.cancellationPolicy ?? tournament.cancellationPolicy ?? undefined,
      rules: dto.rules ?? tournament.rules,
      rulesVersion: dto.rulesVersion ?? tournament.rulesVersion,
      rosterChangeRules:
        dto.rosterChangeRules ?? tournament.rosterChangeRules ?? undefined,
      checkInRules: dto.checkInRules ?? tournament.checkInRules ?? undefined,
      matchReportingRules:
        dto.matchReportingRules ?? tournament.matchReportingRules ?? undefined,
      evidenceRequirements:
        dto.evidenceRequirements ??
        tournament.evidenceRequirements ??
        undefined,
      disputeDeadlineMinutes:
        dto.disputeDeadlineMinutes ??
        tournament.disputeDeadlineMinutes ??
        undefined,
      forfeitRules: dto.forfeitRules ?? tournament.forfeitRules ?? undefined,
      codeOfConduct: dto.codeOfConduct ?? tournament.codeOfConduct ?? undefined,
      registrationOpensAt:
        dto.registrationOpensAt ?? tournament.registrationOpensAt,
      registrationClosesAt:
        dto.registrationClosesAt ?? tournament.registrationClosesAt,
      rosterLocksAt: dto.rosterLocksAt ?? tournament.rosterLocksAt ?? undefined,
      checkInOpensAt:
        dto.checkInOpensAt ?? tournament.checkInOpensAt ?? undefined,
      checkInClosesAt:
        dto.checkInClosesAt ?? tournament.checkInClosesAt ?? undefined,
      startsAt: dto.startsAt ?? tournament.startsAt,
      endsAt: dto.endsAt ?? tournament.endsAt ?? undefined,
      timezone: dto.timezone ?? tournament.timezone,
      waitlistEnabled: dto.waitlistEnabled ?? tournament.waitlistEnabled,
      maximumWaitlistSize:
        dto.maximumWaitlistSize ?? tournament.maximumWaitlistSize ?? undefined,
      manualApprovalRequired:
        dto.manualApprovalRequired ?? tournament.manualApprovalRequired,
    };
  }

  private toTournamentUpdateData(
    dto: UpdateTournamentDraftDto,
  ): Prisma.TournamentUncheckedUpdateInput {
    return {
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      logoUrl: dto.logoUrl,
      coverUrl: dto.coverUrl,
      gameKey: dto.gameKey,
      mode: dto.mode,
      visibility: dto.visibility,
      format: dto.format,
      minimumTeams: dto.minimumTeams,
      maximumTeams: dto.maximumTeams,
      minimumStarters: dto.minimumStarters,
      maximumStarters: dto.maximumStarters,
      maximumSubstitutes: dto.maximumSubstitutes,
      defaultBestOf: dto.defaultBestOf,
      finalBestOf: dto.finalBestOf,
      seedingMethod: dto.seedingMethod,
      thirdPlaceMatch: dto.thirdPlaceMatch,
      requiredGameAccountId: dto.requiredGameAccountId,
      allowedRegion: dto.allowedRegion,
      allowedCountries: dto.allowedCountries,
      allowedPlatforms: dto.allowedPlatforms,
      minimumPlayerAge: dto.minimumPlayerAge,
      minimumRank: dto.minimumRank,
      maximumRank: dto.maximumRank,
      registrationFee:
        dto.registrationFee === undefined
          ? undefined
          : this.toMoney(dto.registrationFee),
      currency: dto.currency,
      prizePool:
        dto.prizePool === undefined ? undefined : this.toMoney(dto.prizePool),
      prizeDistribution:
        dto.prizeDistribution === undefined
          ? undefined
          : (dto.prizeDistribution as Prisma.InputJsonValue),
      refundPolicy: dto.refundPolicy,
      cancellationPolicy: dto.cancellationPolicy,
      rules: dto.rules,
      rulesVersion: dto.rulesVersion,
      rosterChangeRules: dto.rosterChangeRules,
      checkInRules: dto.checkInRules,
      matchReportingRules: dto.matchReportingRules,
      evidenceRequirements: dto.evidenceRequirements,
      disputeDeadlineMinutes: dto.disputeDeadlineMinutes,
      forfeitRules: dto.forfeitRules,
      codeOfConduct: dto.codeOfConduct,
      registrationOpensAt: dto.registrationOpensAt,
      registrationClosesAt: dto.registrationClosesAt,
      rosterLocksAt: dto.rosterLocksAt,
      checkInOpensAt: dto.checkInOpensAt,
      checkInClosesAt: dto.checkInClosesAt,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      timezone: dto.timezone,
      waitlistEnabled: dto.waitlistEnabled,
      maximumWaitlistSize: dto.maximumWaitlistSize,
      manualApprovalRequired: dto.manualApprovalRequired,
    };
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private getPublicationReadiness(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentDetailSelect;
    }>,
  ): OrganizerTournamentDetailResponseDto['publicationReadiness'] {
    const issues: PublicationReadinessIssue[] = [];

    if (!tournament.name.trim()) {
      this.addPublicationIssue(
        issues,
        'name',
        'Tournament name is required before publishing.',
      );
    }

    if (!tournament.gameKey.trim()) {
      this.addPublicationIssue(
        issues,
        'gameKey',
        'Game key is required before publishing.',
      );
    }

    if (!tournament.rules.trim()) {
      this.addPublicationIssue(
        issues,
        'rules',
        'Tournament rules are required before publishing.',
      );
    }

    if (tournament.registrationOpensAt >= tournament.registrationClosesAt) {
      this.addPublicationIssue(
        issues,
        'registrationClosesAt',
        'Registration close date must be after registration open date.',
      );
    }

    if (tournament.registrationClosesAt >= tournament.startsAt) {
      this.addPublicationIssue(
        issues,
        'startsAt',
        'Tournament start date must be after registration closes.',
      );
    }

    if (
      tournament.rosterLocksAt &&
      (tournament.rosterLocksAt < tournament.registrationClosesAt ||
        tournament.rosterLocksAt > tournament.startsAt)
    ) {
      this.addPublicationIssue(
        issues,
        'rosterLocksAt',
        'Roster lock date must be between registration close and tournament start.',
      );
    }

    if (tournament.checkInOpensAt || tournament.checkInClosesAt) {
      if (!tournament.checkInOpensAt) {
        this.addPublicationIssue(
          issues,
          'checkInOpensAt',
          'Check-in open date is required when check-in close date is set.',
        );
      }

      if (!tournament.checkInClosesAt) {
        this.addPublicationIssue(
          issues,
          'checkInClosesAt',
          'Check-in close date is required when check-in open date is set.',
        );
      }
    }

    if (tournament.checkInOpensAt && tournament.checkInClosesAt) {
      if (tournament.checkInOpensAt >= tournament.checkInClosesAt) {
        this.addPublicationIssue(
          issues,
          'checkInClosesAt',
          'Check-in close date must be after check-in open date.',
        );
      }

      if (tournament.checkInClosesAt > tournament.startsAt) {
        this.addPublicationIssue(
          issues,
          'checkInClosesAt',
          'Check-in close date must be before or equal to tournament start.',
        );
      }
    }

    if (tournament.endsAt && tournament.endsAt <= tournament.startsAt) {
      this.addPublicationIssue(
        issues,
        'endsAt',
        'Tournament end date must be after tournament start.',
      );
    }

    if (tournament.maximumTeams < tournament.minimumTeams) {
      this.addPublicationIssue(
        issues,
        'maximumTeams',
        'Maximum teams must be greater than or equal to minimum teams.',
      );
    }

    if (tournament.maximumStarters < tournament.minimumStarters) {
      this.addPublicationIssue(
        issues,
        'maximumStarters',
        'Maximum starters must be greater than or equal to minimum starters.',
      );
    }

    this.requirePublicationOddBestOf(
      issues,
      'defaultBestOf',
      tournament.defaultBestOf,
    );
    this.requirePublicationOddBestOf(
      issues,
      'finalBestOf',
      tournament.finalBestOf,
    );

    if (
      !tournament.waitlistEnabled &&
      tournament.maximumWaitlistSize !== null
    ) {
      this.addPublicationIssue(
        issues,
        'maximumWaitlistSize',
        'Maximum waitlist size requires waitlist to be enabled.',
      );
    }

    if (!this.isValidTimezone(tournament.timezone)) {
      this.addPublicationIssue(
        issues,
        'timezone',
        'Timezone must be a valid IANA time zone.',
      );
    }

    if (tournament.mode === TournamentMode.ONLINE) {
      this.addOnlinePublicationIssues(issues, tournament.onlineConfiguration);
    }

    if (tournament.mode === TournamentMode.ONSITE) {
      this.addOnsitePublicationIssues(issues, tournament.venue);
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  private addOnlinePublicationIssues(
    issues: PublicationReadinessIssue[],
    onlineConfiguration:
      | Prisma.TournamentGetPayload<{
          select: typeof tournamentDetailSelect;
        }>['onlineConfiguration']
      | null,
  ): void {
    if (!onlineConfiguration) {
      this.addPublicationIssue(
        issues,
        'onlineConfiguration',
        'Online tournaments require online configuration before publishing.',
      );
      return;
    }

    if (!onlineConfiguration.serverRegion.trim()) {
      this.addPublicationIssue(
        issues,
        'onlineConfiguration.serverRegion',
        'Online configuration requires a server region before publishing.',
      );
    }

    if (
      onlineConfiguration.evidenceRequired &&
      !onlineConfiguration.screenshotRequirements?.trim()
    ) {
      this.addPublicationIssue(
        issues,
        'onlineConfiguration.screenshotRequirements',
        'Screenshot requirements are required when evidence is required.',
      );
    }
  }

  private addOnsitePublicationIssues(
    issues: PublicationReadinessIssue[],
    venue:
      | Prisma.TournamentGetPayload<{
          select: typeof tournamentDetailSelect;
        }>['venue']
      | null,
  ): void {
    if (!venue) {
      this.addPublicationIssue(
        issues,
        'venue',
        'On-site tournaments require a venue before publishing.',
      );
      return;
    }

    this.requirePublicationText(
      issues,
      'venue.name',
      venue.name,
      'Venue name is required before publishing.',
    );
    this.requirePublicationText(
      issues,
      'venue.country',
      venue.country,
      'Venue country is required before publishing.',
    );
    this.requirePublicationText(
      issues,
      'venue.city',
      venue.city,
      'Venue city is required before publishing.',
    );
    this.requirePublicationText(
      issues,
      'venue.address',
      venue.address,
      'Venue address is required before publishing.',
    );
    this.requirePublicationText(
      issues,
      'venue.checkInLocation',
      venue.checkInLocation,
      'Venue check-in location is required before publishing.',
    );

    if (!this.toRecord(venue.equipmentProvided)) {
      this.addPublicationIssue(
        issues,
        'venue.equipmentProvided',
        'Venue equipment policy is required before publishing.',
      );
    }

    if (venue.gamingRooms.length === 0) {
      this.addPublicationIssue(
        issues,
        'gamingRooms',
        'On-site tournaments require at least one gaming room before publishing.',
      );
      return;
    }

    venue.gamingRooms.forEach((room, index) => {
      const roomField = `gamingRooms.${index}`;

      this.requirePublicationText(
        issues,
        `${roomField}.name`,
        room.name,
        'Gaming room name is required before publishing.',
      );

      if (room.stationCount < 1) {
        this.addPublicationIssue(
          issues,
          `${roomField}.stationCount`,
          'Gaming room station count must be at least 1.',
        );
      }

      this.requirePublicationText(
        issues,
        `${roomField}.cpu`,
        room.cpu,
        'Gaming room CPU specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.gpu`,
        room.gpu,
        'Gaming room GPU specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.ram`,
        room.ram,
        'Gaming room RAM specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.storage`,
        room.storage,
        'Gaming room storage specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.operatingSystem`,
        room.operatingSystem,
        'Gaming room operating system is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.monitorModel`,
        room.monitorModel,
        'Gaming room monitor model is required before publishing.',
      );

      if (room.monitorRefreshRateHz < 30) {
        this.addPublicationIssue(
          issues,
          `${roomField}.monitorRefreshRateHz`,
          'Gaming room monitor refresh rate must be at least 30Hz.',
        );
      }

      this.requirePublicationText(
        issues,
        `${roomField}.mouse`,
        room.mouse,
        'Gaming room mouse specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.keyboard`,
        room.keyboard,
        'Gaming room keyboard specification is required before publishing.',
      );
      this.requirePublicationText(
        issues,
        `${roomField}.headset`,
        room.headset,
        'Gaming room headset specification is required before publishing.',
      );
    });
  }

  private requirePublicationText(
    issues: PublicationReadinessIssue[],
    field: string,
    value: string | null,
    message: string,
  ): void {
    if (!value?.trim()) {
      this.addPublicationIssue(issues, field, message);
    }
  }

  private requirePublicationOddBestOf(
    issues: PublicationReadinessIssue[],
    field: string,
    value: number,
  ): void {
    if (value < 1 || value % 2 === 0) {
      this.addPublicationIssue(
        issues,
        field,
        `${field} must be a positive odd number.`,
      );
    }
  }

  private addPublicationIssue(
    issues: PublicationReadinessIssue[],
    field: string,
    message: string,
  ): void {
    issues.push({ field, message });
  }

  private async generateUniqueSlug(
    name: string,
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
    excludeTournamentId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existing = await transaction.tournament.findFirst({
        where: {
          slug,
          ...(excludeTournamentId ? { NOT: { id: excludeTournamentId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }
    }

    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');

    return slug.length > 0 ? slug : 'tournament';
  }

  private requireOrder(
    issues: ValidationIssue[],
    field: string,
    condition: boolean,
    message: string,
  ): void {
    if (!condition) {
      issues.push({ field, message });
    }
  }

  private requireOddBestOf(
    issues: ValidationIssue[],
    field: string,
    value: number,
  ): void {
    if (value % 2 === 0) {
      issues.push({
        field,
        message: `${field} must be an odd number.`,
      });
    }
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  private toMoney(value: number): string {
    return value.toFixed(2);
  }

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
