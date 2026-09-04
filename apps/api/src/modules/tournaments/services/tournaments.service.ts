import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentFormat,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import {
  CaptainRegistrationNextAction,
  type CaptainRegistrationDetailResponseDto,
  type CaptainRegistrationListItemDto,
  type CaptainRegistrationListResponseDto,
} from '../dtos/captain-registration-response.dto';
import { type CaptainRegistrationBracketResponseDto } from '../dtos/captain-registration-bracket-response.dto';
import {
  type CaptainCheckInIssueDto,
  type CaptainRegistrationCheckInResponseDto,
} from '../dtos/captain-registration-check-in-response.dto';
import { type CaptainRegistrationHubResponseDto } from '../dtos/captain-registration-hub-response.dto';
import { type CaptainRegistrationInformationResponseDto } from '../dtos/captain-registration-information-response.dto';
import {
  type CaptainMatchListResponseDto,
  type CaptainMatchResponseDto,
} from '../dtos/captain-registration-match-response.dto';
import {
  type CaptainProgressMatchSummaryDto,
  type CaptainRegistrationProgressResponseDto,
} from '../dtos/captain-registration-progress-response.dto';
import {
  type CaptainRegistrationStandingsResponseDto,
  type CaptainStandingItemDto,
} from '../dtos/captain-registration-standings-response.dto';
import { type CancelTournamentDto } from '../dtos/cancel-tournament.dto';
import { type CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { type CreateTournamentRegistrationDto } from '../dtos/create-tournament-registration.dto';
import { type CreateTournamentDto } from '../dtos/create-tournament.dto';
import { type GamingRoomListResponseDto } from '../dtos/gaming-room-list-response.dto';
import { type GamingRoomResponseDto } from '../dtos/gaming-room-response.dto';
import { type GenerateOrganizerBracketDto } from '../dtos/generate-organizer-bracket.dto';
import { type ListOrganizerTournamentsQueryDto } from '../dtos/list-organizer-tournaments-query.dto';
import {
  CaptainRegistrationSortDirection,
  CaptainRegistrationSortBy,
  CaptainRegistrationTimeFilter,
  type ListCaptainRegistrationsQueryDto,
} from '../dtos/list-captain-registrations-query.dto';
import { type ListPublicTournamentsQueryDto } from '../dtos/list-public-tournaments-query.dto';
import { type OrganizerTournamentDetailResponseDto } from '../dtos/organizer-tournament-detail-response.dto';
import { type OrganizerTournamentListResponseDto } from '../dtos/organizer-tournament-list-response.dto';
import {
  type OrganizerBracketMatchDto,
  type OrganizerBracketResponseDto,
} from '../dtos/organizer-bracket-response.dto';
import { type OnlineConfigurationResponseDto } from '../dtos/online-configuration-response.dto';
import { type PublicTournamentDetailResponseDto } from '../dtos/public-tournament-detail-response.dto';
import { type PublicTournamentListResponseDto } from '../dtos/public-tournament-list-response.dto';
import {
  type OrganizerRegistrationDetailResponseDto,
  type OrganizerRegistrationListItemDto,
  type OrganizerRegistrationListResponseDto,
} from '../dtos/organizer-registration-response.dto';
import { type RejectOrganizerRegistrationDto } from '../dtos/reject-organizer-registration.dto';
import { type RejectPaymentProofDto } from '../dtos/reject-payment-proof.dto';
import { type ScheduleOrganizerMatchDto } from '../dtos/schedule-organizer-match.dto';
import { type SubmitPaymentProofDto } from '../dtos/submit-payment-proof.dto';
import {
  TournamentEligibilityIssueCode,
  type TournamentEligibilityIssueDto,
  type TournamentEligibilityResponseDto,
} from '../dtos/tournament-eligibility-response.dto';
import { type TournamentRegistrationResponseDto } from '../dtos/tournament-registration-response.dto';
import { type TournamentResponseDto } from '../dtos/tournament-response.dto';
import { type UpdateGamingRoomDto } from '../dtos/update-gaming-room.dto';
import { type UpdateTournamentDraftDto } from '../dtos/update-tournament-draft.dto';
import { type UpsertOnlineConfigurationDto } from '../dtos/upsert-online-configuration.dto';
import { type UpsertTournamentPaymentMethodDto } from '../dtos/upsert-tournament-payment-method.dto';
import { type UpsertVenueDto } from '../dtos/upsert-venue.dto';
import { type VenueResponseDto } from '../dtos/venue-response.dto';
import { type WithdrawCaptainRegistrationDto } from '../dtos/withdraw-captain-registration.dto';
import { toGamingRoomResponse } from '../mappers/gaming-room.mapper';
import { toTournamentResponse } from '../mappers/tournament.mapper';
import {
  TournamentCoverImageStorageService,
  type TournamentCoverImageFile,
} from './tournament-cover-image-storage.service';
import { type TournamentPaymentProofFile } from './tournament-payment-proof-storage.service';
import {
  generateSingleEliminationBracket,
  getSingleEliminationBracketSize,
} from './single-elimination-bracket.generator';
import { TournamentConfigurationService } from './tournament-configuration.service';
import { TournamentEligibilityService } from './tournament-eligibility.service';
import { TournamentLifecycleService } from './tournament-lifecycle.service';
import { TournamentPaymentService } from './tournament-payment.service';
import { TournamentQueryService } from './tournament-query.service';

type ValidationIssue = {
  field: string;
  message: string;
};

type PublicationReadinessIssue =
  OrganizerTournamentDetailResponseDto['publicationReadiness']['issues'][number];

type GamingRoomData = Omit<
  Prisma.TournamentGamingRoomUncheckedCreateInput,
  'id' | 'venueId' | 'createdAt' | 'updatedAt'
>;

type CaptainRegistrationListRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationListSelect;
}>;

type CaptainRegistrationDetailRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationDetailSelect;
}>;

type CaptainRegistrationHubRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationHubSelect;
}>;

type CaptainMatchAccessRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainMatchAccessRegistrationSelect;
  }>;

type CaptainInformationRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainInformationRegistrationSelect;
  }>;

type CaptainCheckInRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainCheckInRegistrationSelect;
  }>;

type CaptainMatchRecord = Prisma.TournamentMatchGetPayload<{
  select: typeof captainMatchSelect;
}>;

type CaptainStandingAccumulator = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  mapsWon: number;
  mapsLost: number;
};

type OrganizerRegistrationListRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof organizerRegistrationListSelect;
}>;

type OrganizerRegistrationDetailRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof organizerRegistrationDetailSelect;
  }>;

type OrganizerBracketRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof organizerBracketRegistrationSelect;
  }>;

type OrganizerBracketMatchRecord = Prisma.TournamentMatchGetPayload<{
  select: typeof organizerBracketMatchSelect;
}>;

const withdrawalBlockedTournamentStatuses: readonly TournamentStatus[] = [
  TournamentStatus.CHECK_IN_OPEN,
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.COMPLETED,
  TournamentStatus.CANCELLED,
  TournamentStatus.ARCHIVED,
] as const;

const withdrawalBlockedRegistrationStatuses: readonly TournamentRegistrationStatus[] =
  [
    TournamentRegistrationStatus.WITHDRAWN,
    TournamentRegistrationStatus.CHECKED_IN,
    TournamentRegistrationStatus.DISQUALIFIED,
    TournamentRegistrationStatus.REFUNDED,
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
  paymentMethods: {
    select: {
      enabled: true,
      instructions: true,
    },
  },
} satisfies Prisma.TournamentSelect;

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

const captainRegistrationHubSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  submittedAt: true,
  approvedAt: true,
  rulesVersion: true,
  rulesAcceptedAt: true,
  rosterSnapshot: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  tournament: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      coverUrl: true,
      gameKey: true,
      mode: true,
      status: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      onlineConfiguration: {
        select: {
          serverRegion: true,
          connectionRules: true,
          discordServerUrl: true,
          captainSupportChannel: true,
          matchReportingChannel: true,
          lobbyInstructions: true,
          privateSupportContact: true,
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
          venueRules: true,
          parkingInfo: true,
          equipmentProvided: true,
          playersMayBring: true,
          playersMustBring: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainMatchAccessRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  tournament: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainInformationRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  tournament: {
    select: {
      id: true,
      name: true,
      mode: true,
      status: true,
      startsAt: true,
      checkInOpensAt: true,
      checkInRules: true,
      timezone: true,
      onlineConfiguration: {
        select: {
          serverRegion: true,
          connectionRules: true,
          screenshotRequirements: true,
          discordServerUrl: true,
          captainSupportChannel: true,
          matchReportingChannel: true,
          lobbyInstructions: true,
          privateSupportContact: true,
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
          venueRules: true,
          parkingInfo: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainCheckInRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  checkedInAt: true,
  captain: {
    select: {
      id: true,
      phoneNumber: true,
    },
  },
  team: {
    select: eligibilityTeamSelect,
  },
  tournament: {
    select: {
      id: true,
      name: true,
      mode: true,
      status: true,
      startsAt: true,
      checkInOpensAt: true,
      checkInClosesAt: true,
      checkInRules: true,
      timezone: true,
      minimumStarters: true,
      maximumStarters: true,
      maximumSubstitutes: true,
      requiredGameAccountId: true,
      onlineConfiguration: {
        select: {
          serverRegion: true,
          connectionRules: true,
        },
      },
      venue: {
        select: {
          name: true,
          checkInLocation: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainMatchSelect = {
  id: true,
  stage: true,
  round: true,
  bracketPosition: true,
  bestOf: true,
  scheduledAt: true,
  teamAId: true,
  teamBId: true,
  winnerTeamId: true,
  status: true,
  teamAScore: true,
  teamBScore: true,
  forfeitStatus: true,
  officialResultStatus: true,
  disputeStatus: true,
  evidenceUrl: true,
  onlineServerInfo: true,
  onsiteStationLabel: true,
  tournament: {
    select: {
      id: true,
      name: true,
      mode: true,
      timezone: true,
    },
  },
  teamA: {
    select: {
      id: true,
      name: true,
    },
  },
  teamB: {
    select: {
      id: true,
      name: true,
    },
  },
  gamingRoom: {
    select: {
      id: true,
      name: true,
    },
  },
  games: {
    orderBy: {
      gameNumber: 'asc',
    },
    select: {
      id: true,
      gameNumber: true,
      mapName: true,
      teamAScore: true,
      teamBScore: true,
      winnerTeamId: true,
      evidenceUrl: true,
    },
  },
} satisfies Prisma.TournamentMatchSelect;

const organizerRegistrationTeamSelect = {
  id: true,
  name: true,
  slug: true,
  gameKey: true,
  region: true,
  status: true,
} satisfies Prisma.TeamSelect;

const organizerRegistrationListSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  rulesVersion: true,
  submittedAt: true,
  rejectionReason: true,
  team: {
    select: organizerRegistrationTeamSelect,
  },
} satisfies Prisma.TournamentRegistrationSelect;

const organizerRegistrationDetailSelect = {
  ...organizerRegistrationListSelect,
  rulesAcceptedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rosterSnapshot: true,
  captainContactSnapshot: true,
  paymentProofs: {
    orderBy: { submittedAt: 'desc' },
    take: 1,
    include: { paymentMethod: true },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const organizerBracketRegistrationSelect = {
  team: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const organizerBracketMatchSelect = {
  id: true,
  stage: true,
  round: true,
  bracketPosition: true,
  bestOf: true,
  scheduledAt: true,
  status: true,
  teamAScore: true,
  teamBScore: true,
  winnerTeamId: true,
  officialResultStatus: true,
  onlineServerInfo: true,
  gamingRoomId: true,
  onsiteStationLabel: true,
  teamA: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
  teamB: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
  gamingRoom: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TournamentMatchSelect;

@Injectable()
export class TournamentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly coverImageStorageService: TournamentCoverImageStorageService,
    private readonly tournamentQueryService: TournamentQueryService,
    private readonly tournamentConfigurationService: TournamentConfigurationService,
    private readonly tournamentEligibilityService: TournamentEligibilityService,
    private readonly tournamentLifecycleService: TournamentLifecycleService,
    private readonly tournamentPaymentService: TournamentPaymentService,
  ) {}

  async listPublicTournaments(
    query: ListPublicTournamentsQueryDto,
  ): Promise<PublicTournamentListResponseDto> {
    return this.tournamentQueryService.listPublicTournaments(query);
  }

  async getPublicTournamentDetails(
    slug: string,
  ): Promise<PublicTournamentDetailResponseDto> {
    return this.tournamentQueryService.getPublicTournamentDetails(slug);
  }

  async getCaptainTournamentEligibility(
    captainId: string,
    tournamentId: string,
  ): Promise<TournamentEligibilityResponseDto> {
    return this.tournamentEligibilityService.getCaptainTournamentEligibility(
      captainId,
      tournamentId,
    );
  }

  async createCaptainTournamentRegistration(
    captainId: string,
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationResponseDto> {
    return this.tournamentEligibilityService.createCaptainTournamentRegistration(
      captainId,
      tournamentId,
      dto,
    );
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

  async getCaptainRegistrationHub(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationHubResponseDto> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainRegistrationHubSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);

    return this.toCaptainRegistrationHub(registration);
  }

  async listCaptainRegistrationMatches(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainMatchListResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: this.toCaptainMatchOwnershipWhere(registration),
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return {
      items: matches.map((match) =>
        this.toCaptainMatchResponse(match, registration.team.id),
      ),
    };
  }

  async getCaptainRegistrationMatch(
    captainId: string,
    registrationId: string,
    matchId: string,
  ): Promise<CaptainMatchResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const match = await this.databaseService.client.tournamentMatch.findFirst({
      where: {
        id: matchId,
        ...this.toCaptainMatchOwnershipWhere(registration),
      },
      select: captainMatchSelect,
    });

    if (!match) {
      throw new NotFoundException('Match was not found for this registration.');
    }

    return this.toCaptainMatchResponse(match, registration.team.id);
  }

  async getCaptainRegistrationProgress(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationProgressResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: this.toCaptainMatchOwnershipWhere(registration),
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationProgress(
      registration,
      matches,
      new Date(),
    );
  }

  async getCaptainRegistrationBracket(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationBracketResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: { tournamentId: registration.tournament.id },
      orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationBracket(registration, matches);
  }

  async getCaptainRegistrationStandings(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationStandingsResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: { tournamentId: registration.tournament.id },
      orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationStandings(registration, matches);
  }

  async getCaptainRegistrationInformation(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationInformationResponseDto> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainInformationRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);

    const nextMatch =
      await this.databaseService.client.tournamentMatch.findFirst({
        where: this.toCaptainMatchOwnershipWhere(registration),
        orderBy: [
          { scheduledAt: 'asc' },
          { round: 'asc' },
          { createdAt: 'asc' },
        ],
        select: captainMatchSelect,
      });

    return this.toCaptainRegistrationInformation(
      registration,
      nextMatch,
      new Date(),
    );
  }

  async getCaptainRegistrationCheckIn(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    const registration = await this.findCaptainCheckInRegistrationOrThrow(
      captainId,
      registrationId,
    );
    const nextMatch = await this.findNextCaptainMatch(registration);

    return this.toCaptainRegistrationCheckIn(
      registration,
      nextMatch,
      new Date(),
    );
  }

  async checkInCaptainRegistration(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    const updatedRegistration = await this.databaseService.client.$transaction(
      async (transaction) => {
        const registration = await transaction.tournamentRegistration.findFirst(
          {
            where: {
              id: registrationId,
              captainId,
            },
            select: captainCheckInRegistrationSelect,
          },
        );

        if (!registration) {
          throw new NotFoundException('Registration was not found');
        }

        const issues = this.getCaptainCheckInIssues(registration, new Date());

        if (issues.length > 0) {
          throw new ConflictException({
            message: 'Registration cannot be checked in.',
            issues,
          });
        }

        return transaction.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: TournamentRegistrationStatus.CHECKED_IN,
            checkedInAt: new Date(),
          },
          select: captainCheckInRegistrationSelect,
        });
      },
    );
    const nextMatch = await this.findNextCaptainMatch(updatedRegistration);

    return this.toCaptainRegistrationCheckIn(
      updatedRegistration,
      nextMatch,
      new Date(),
    );
  }

  async withdrawCaptainRegistration(
    captainId: string,
    registrationId: string,
    dto: WithdrawCaptainRegistrationDto,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    void dto.reason;

    const registration = await this.databaseService.client.$transaction(
      async (transaction) => {
        const existing = await transaction.tournamentRegistration.findFirst({
          where: {
            id: registrationId,
            captainId,
          },
          select: captainRegistrationDetailSelect,
        });

        if (!existing) {
          throw new NotFoundException('Registration was not found');
        }

        this.assertRegistrationCanBeWithdrawn(existing);

        return transaction.tournamentRegistration.update({
          where: { id: existing.id },
          data: {
            status: TournamentRegistrationStatus.WITHDRAWN,
            withdrawnAt: new Date(),
          },
          select: captainRegistrationDetailSelect,
        });
      },
    );

    return this.toCaptainRegistrationDetail(registration);
  }

  async listOrganizerTournamentRegistrations(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerRegistrationListResponseDto> {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);

    const where: Prisma.TournamentRegistrationWhereInput = { tournamentId };
    const [items, totalItems] = await this.databaseService.client.$transaction([
      this.databaseService.client.tournamentRegistration.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: 0,
        take: 100,
        select: organizerRegistrationListSelect,
      }),
      this.databaseService.client.tournamentRegistration.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toOrganizerRegistrationListItem(item)),
      meta: {
        page: 1,
        limit: 100,
        totalItems,
        totalPages: totalItems > 0 ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  async getOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerBracketResponseDto> {
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );
    const [registrations, matches] = await Promise.all([
      this.findApprovedBracketRegistrations(tournamentId),
      this.databaseService.client.tournamentMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }],
        select: organizerBracketMatchSelect,
      }),
    ]);

    return this.toOrganizerBracketResponse(tournament, registrations, matches);
  }

  async generateOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
    dto: GenerateOrganizerBracketDto,
  ): Promise<OrganizerBracketResponseDto> {
    await this.databaseService.client.$transaction(async (transaction) => {
      const tournament = await this.findOwnedTournamentOrThrow(
        organizerId,
        tournamentId,
        transaction,
      );

      this.assertTournamentCanGenerateBracket(tournament);

      const registrations = await this.findApprovedBracketRegistrations(
        tournamentId,
        transaction,
      );
      const approvedTeamIds = registrations.map(
        (registration) => registration.team.id,
      );

      if (approvedTeamIds.length < 2) {
        throw new ConflictException(
          'At least two approved teams are required to generate a bracket.',
        );
      }

      this.assertOrderedTeamsMatchApprovedTeams(
        dto.orderedTeamIds,
        approvedTeamIds,
      );

      const existingMatchCount = await transaction.tournamentMatch.count({
        where: { tournamentId },
      });
      if (existingMatchCount > 0) {
        throw new ConflictException(
          'A bracket has already been generated for this tournament.',
        );
      }

      const orderedTeamIds =
        tournament.seedingMethod === TournamentSeedingMethod.RANDOM
          ? this.shuffleTeamIds(dto.orderedTeamIds)
          : dto.orderedTeamIds;
      const generated = generateSingleEliminationBracket(
        orderedTeamIds,
        tournament.defaultBestOf,
        tournament.finalBestOf,
        tournament.thirdPlaceMatch,
      );

      await transaction.tournamentMatch.createMany({
        data: generated.matches.map((match) => ({
          tournamentId,
          stage: match.stage,
          round: match.round,
          bracketPosition: match.bracketPosition,
          bestOf: match.bestOf,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
        })),
      });
    });

    return this.getOrganizerTournamentBracket(organizerId, tournamentId);
  }

  async scheduleOrganizerTournamentMatch(
    organizerId: string,
    tournamentId: string,
    matchId: string,
    dto: ScheduleOrganizerMatchDto,
  ): Promise<OrganizerBracketMatchDto> {
    const match = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          organizerId,
          tournamentId,
          transaction,
        );
        this.assertTournamentCanScheduleMatches(tournament.status);

        const existing = await transaction.tournamentMatch.findFirst({
          where: {
            id: matchId,
            tournamentId,
          },
          select: organizerBracketMatchSelect,
        });

        if (!existing) {
          throw new NotFoundException('Tournament match was not found.');
        }

        this.assertMatchCanBeScheduled(existing.status);
        const scheduledAt = new Date(dto.scheduledAt);
        this.assertMatchScheduleWithinTournament(tournament, scheduledAt);

        const assignment =
          tournament.mode === TournamentMode.ONLINE
            ? this.toOnlineMatchAssignment(dto)
            : await this.toOnsiteMatchAssignment(
                transaction,
                tournamentId,
                dto,
              );

        return transaction.tournamentMatch.update({
          where: { id: existing.id },
          data: {
            scheduledAt,
            status: TournamentMatchStatus.SCHEDULED,
            ...assignment,
          },
          select: organizerBracketMatchSelect,
        });
      },
    );

    return this.toOrganizerBracketMatch(match);
  }

  async getOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);

    const registration = await this.findOrganizerRegistrationOrThrow(
      tournamentId,
      registrationId,
    );

    return this.toOrganizerRegistrationDetail(registration);
  }

  async approveOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    const registration = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          organizerId,
          tournamentId,
          transaction,
        );
        const existing = await this.findOrganizerRegistrationOrThrow(
          tournamentId,
          registrationId,
          transaction,
        );

        this.assertOrganizerRegistrationCanBeApproved(existing);
        const activeRegistrationCount =
          await transaction.tournamentRegistration.count({
            where: {
              tournamentId,
              status: {
                in: [
                  TournamentRegistrationStatus.CONFIRMED,
                  TournamentRegistrationStatus.CHECKED_IN,
                ],
              },
            },
          });

        if (activeRegistrationCount >= tournament.maximumTeams) {
          throw new ConflictException(
            'Tournament capacity has already been reached.',
          );
        }

        const eligibility = this.getOrganizerRegistrationEligibility(existing);

        if (!eligibility.eligible) {
          throw new ConflictException(
            'Team no longer meets tournament registration requirements.',
          );
        }

        return transaction.tournamentRegistration.update({
          where: { id: existing.id },
          data: {
            status: TournamentRegistrationStatus.CONFIRMED,
            approvalStatus: RegistrationApprovalStatus.APPROVED,
            approvedAt: new Date(),
            rejectedAt: null,
            rejectionReason: null,
          },
          select: organizerRegistrationDetailSelect,
        });
      },
    );

    return this.toOrganizerRegistrationDetail(registration);
  }

  async rejectOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
    dto: RejectOrganizerRegistrationDto,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    const registration = await this.databaseService.client.$transaction(
      async (transaction) => {
        await this.findOwnedTournamentOrThrow(
          organizerId,
          tournamentId,
          transaction,
        );
        const existing = await this.findOrganizerRegistrationOrThrow(
          tournamentId,
          registrationId,
          transaction,
        );

        this.assertOrganizerRegistrationCanBeRejected(existing);

        return transaction.tournamentRegistration.update({
          where: { id: existing.id },
          data: {
            status: TournamentRegistrationStatus.REJECTED,
            approvalStatus: RegistrationApprovalStatus.REJECTED,
            rejectedAt: new Date(),
            rejectionReason: dto.reason,
          },
          select: organizerRegistrationDetailSelect,
        });
      },
    );

    return this.toOrganizerRegistrationDetail(registration);
  }

  async listOrganizerTournamentPaymentMethods(
    organizerId: string,
    tournamentId: string,
  ) {
    return this.tournamentPaymentService.listOrganizerTournamentPaymentMethods(
      organizerId,
      tournamentId,
    );
  }

  async listCaptainTournamentPaymentMethods(tournamentId: string) {
    return this.tournamentPaymentService.listCaptainTournamentPaymentMethods(
      tournamentId,
    );
  }

  async createOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    return this.tournamentPaymentService.createOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async updateOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    return this.tournamentPaymentService.updateOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
      dto,
    );
  }

  async deleteOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
  ) {
    return this.tournamentPaymentService.deleteOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
    );
  }

  async submitCaptainRegistrationPaymentProof(
    captainId: string,
    registrationId: string,
    dto: SubmitPaymentProofDto,
    file: TournamentPaymentProofFile | undefined,
    publicOrigin: string,
  ) {
    return this.tournamentPaymentService.submitCaptainRegistrationPaymentProof(
      captainId,
      registrationId,
      dto,
      file,
      publicOrigin,
    );
  }

  async verifyOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    return this.tournamentPaymentService.verifyOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      registrationId,
    );
  }

  async rejectOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
    dto: RejectPaymentProofDto,
  ) {
    return this.tournamentPaymentService.rejectOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      registrationId,
      dto,
    );
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
    return this.tournamentLifecycleService.openRegistration(
      organizerId,
      tournamentId,
    );
  }

  async closeOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.closeRegistration(
      organizerId,
      tournamentId,
    );
  }

  async openOrganizerTournamentCheckIn(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.openCheckIn(
      organizerId,
      tournamentId,
    );
  }

  async cancelOrganizerTournament(
    organizerId: string,
    tournamentId: string,
    dto: CancelTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.cancel(
      organizerId,
      tournamentId,
      dto.reason,
    );
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
    return this.tournamentConfigurationService.getVenue(
      organizerId,
      tournamentId,
    );
  }

  async upsertVenue(
    organizerId: string,
    tournamentId: string,
    dto: UpsertVenueDto,
  ): Promise<VenueResponseDto> {
    return this.tournamentConfigurationService.upsertVenue(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async getOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentConfigurationService.getOnlineConfiguration(
      organizerId,
      tournamentId,
    );
  }

  async upsertOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
    dto: UpsertOnlineConfigurationDto,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentConfigurationService.upsertOnlineConfiguration(
      organizerId,
      tournamentId,
      dto,
    );
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

  async uploadOrganizerTournamentCover(
    organizerId: string,
    tournamentId: string,
    file: TournamentCoverImageFile | undefined,
    publicOrigin: string,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );
    this.assertDraftLifecycle(tournament.status, 'updated');

    const coverUrl = await this.coverImageStorageService.saveCoverImage(
      tournament.id,
      file,
      publicOrigin,
    );

    const updated = await this.databaseService.client.tournament.update({
      where: { id: tournament.id },
      data: { coverUrl },
      select: tournamentSelect,
    });

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
    const tournament =
      await this.tournamentQueryService.getOrganizerTournamentDetailsRecord(
        organizerId,
        tournamentId,
      );

    return {
      tournament: toTournamentResponse(tournament),
      publicationReadiness: this.getPublicationReadiness(tournament),
    };
  }

  async listOrganizerTournaments(
    organizerId: string,
    query: ListOrganizerTournamentsQueryDto,
  ): Promise<OrganizerTournamentListResponseDto> {
    return this.tournamentQueryService.listOrganizerTournaments(
      organizerId,
      query,
    );
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

  private async findOwnedTournamentOrThrow(
    organizerId: string,
    tournamentId: string,
    client: Pick<Prisma.TransactionClient, 'tournament'> = this.databaseService
      .client,
  ): Promise<Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>> {
    const tournament = await client.tournament.findFirst({
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

  private async findApprovedBracketRegistrations(
    tournamentId: string,
    client: Pick<Prisma.TransactionClient, 'tournamentRegistration'> = this
      .databaseService.client,
  ): Promise<OrganizerBracketRegistrationRecord[]> {
    return client.tournamentRegistration.findMany({
      where: {
        tournamentId,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        status: {
          in: [
            TournamentRegistrationStatus.CONFIRMED,
            TournamentRegistrationStatus.CHECKED_IN,
          ],
        },
      },
      orderBy: [{ approvedAt: 'asc' }, { submittedAt: 'asc' }],
      select: organizerBracketRegistrationSelect,
    });
  }

  private assertTournamentCanGenerateBracket(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
  ): void {
    if (tournament.format !== TournamentFormat.SINGLE_ELIMINATION) {
      throw new ConflictException(
        'This bracket generator currently supports single-elimination tournaments only.',
      );
    }

    if (
      tournament.status !== TournamentStatus.REGISTRATION_CLOSED &&
      tournament.status !== TournamentStatus.CHECK_IN_OPEN
    ) {
      throw new ConflictException(
        'Close tournament registration before generating the bracket.',
      );
    }
  }

  private assertTournamentCanScheduleMatches(status: TournamentStatus): void {
    const allowedStatuses: readonly TournamentStatus[] = [
      TournamentStatus.REGISTRATION_CLOSED,
      TournamentStatus.CHECK_IN_OPEN,
      TournamentStatus.IN_PROGRESS,
      TournamentStatus.POSTPONED,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ConflictException(
        'Matches can only be scheduled after registration closes and before the tournament reaches a terminal status.',
      );
    }
  }

  private assertMatchCanBeScheduled(status: TournamentMatchStatus): void {
    if (
      status !== TournamentMatchStatus.SCHEDULED &&
      status !== TournamentMatchStatus.POSTPONED
    ) {
      throw new ConflictException(
        'Live, completed, cancelled, or forfeited matches cannot be rescheduled.',
      );
    }
  }

  private assertMatchScheduleWithinTournament(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
    scheduledAt: Date,
  ): void {
    if (scheduledAt < tournament.startsAt) {
      throw new UnprocessableEntityException(
        'Match time cannot be earlier than the tournament start time.',
      );
    }

    if (tournament.endsAt && scheduledAt > tournament.endsAt) {
      throw new UnprocessableEntityException(
        'Match time cannot be later than the tournament end time.',
      );
    }
  }

  private toOnlineMatchAssignment(dto: ScheduleOrganizerMatchDto): {
    onlineServerInfo: Prisma.InputJsonObject;
    gamingRoomId: null;
    onsiteStationLabel: null;
  } {
    if (!dto.onlineServerInfo) {
      throw new UnprocessableEntityException(
        'onlineServerInfo is required for online tournament matches.',
      );
    }

    if (
      !dto.onlineServerInfo.serverRegion.trim() ||
      !dto.onlineServerInfo.lobbyName.trim()
    ) {
      throw new UnprocessableEntityException(
        'serverRegion and lobbyName are required for online tournament matches.',
      );
    }

    if (dto.gamingRoomId || dto.onsiteStationLabel) {
      throw new UnprocessableEntityException(
        'gamingRoomId and onsiteStationLabel are only valid for on-site tournament matches.',
      );
    }

    const onlineServerInfo: Prisma.InputJsonObject = {
      serverRegion: dto.onlineServerInfo.serverRegion.trim(),
      lobbyName: dto.onlineServerInfo.lobbyName.trim(),
      ...(dto.onlineServerInfo.lobbyCode
        ? { lobbyCode: dto.onlineServerInfo.lobbyCode.trim() }
        : {}),
      ...(dto.onlineServerInfo.lobbyPassword
        ? { lobbyPassword: dto.onlineServerInfo.lobbyPassword.trim() }
        : {}),
      ...(dto.onlineServerInfo.notes
        ? { notes: dto.onlineServerInfo.notes.trim() }
        : {}),
    };

    return {
      onlineServerInfo,
      gamingRoomId: null,
      onsiteStationLabel: null,
    };
  }

  private async toOnsiteMatchAssignment(
    transaction: Pick<Prisma.TransactionClient, 'tournamentGamingRoom'>,
    tournamentId: string,
    dto: ScheduleOrganizerMatchDto,
  ): Promise<{
    onlineServerInfo: typeof Prisma.DbNull;
    gamingRoomId: string;
    onsiteStationLabel: string;
  }> {
    if (dto.onlineServerInfo) {
      throw new UnprocessableEntityException(
        'onlineServerInfo is only valid for online tournament matches.',
      );
    }

    if (!dto.gamingRoomId || !dto.onsiteStationLabel?.trim()) {
      throw new UnprocessableEntityException(
        'gamingRoomId and onsiteStationLabel are required for on-site tournament matches.',
      );
    }

    const gamingRoom = await transaction.tournamentGamingRoom.findFirst({
      where: {
        id: dto.gamingRoomId,
        venue: {
          tournamentId,
        },
      },
      select: { id: true },
    });
    if (!gamingRoom) {
      throw new NotFoundException(
        'Gaming room was not found for this tournament.',
      );
    }

    return {
      onlineServerInfo: Prisma.DbNull,
      gamingRoomId: gamingRoom.id,
      onsiteStationLabel: dto.onsiteStationLabel.trim(),
    };
  }

  private assertOrderedTeamsMatchApprovedTeams(
    orderedTeamIds: string[],
    approvedTeamIds: string[],
  ): void {
    const orderedTeamIdSet = new Set(orderedTeamIds);
    const approvedTeamIdSet = new Set(approvedTeamIds);
    const containsEveryApprovedTeam = approvedTeamIds.every((teamId) =>
      orderedTeamIdSet.has(teamId),
    );
    const containsOnlyApprovedTeams = orderedTeamIds.every((teamId) =>
      approvedTeamIdSet.has(teamId),
    );

    if (
      orderedTeamIdSet.size !== orderedTeamIds.length ||
      orderedTeamIds.length !== approvedTeamIds.length ||
      !containsEveryApprovedTeam ||
      !containsOnlyApprovedTeams
    ) {
      throw new ConflictException(
        'orderedTeamIds must contain every approved tournament team exactly once.',
      );
    }
  }

  private shuffleTeamIds(teamIds: string[]): string[] {
    const shuffled = [...teamIds];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  private toOrganizerBracketResponse(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
    registrations: OrganizerBracketRegistrationRecord[],
    matches: OrganizerBracketMatchRecord[],
  ): OrganizerBracketResponseDto {
    const bracketSize = getSingleEliminationBracketSize(registrations.length);
    const totalRounds = bracketSize > 0 ? Math.log2(bracketSize) : 0;
    const rounds = new Map<
      number,
      OrganizerBracketResponseDto['rounds'][number]
    >();

    matches.forEach((match) => {
      const round = rounds.get(match.round) ?? {
        round: match.round,
        label: this.getBracketRoundLabel(match.round, totalRounds),
        matches: [],
      };
      round.matches.push(this.toOrganizerBracketMatch(match));
      rounds.set(match.round, round);
    });

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        seedingMethod: tournament.seedingMethod,
        mode: tournament.mode,
        timezone: tournament.timezone,
      },
      generated: matches.length > 0,
      teamCount: registrations.length,
      bracketSize,
      approvedTeams: registrations.map((registration) => registration.team),
      rounds: Array.from(rounds.values()),
    };
  }

  private toOrganizerBracketMatch(
    match: OrganizerBracketMatchRecord,
  ): OrganizerBracketMatchDto {
    return {
      id: match.id,
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition ?? `R${match.round}`,
      bestOf: match.bestOf,
      scheduledAt: match.scheduledAt,
      status: match.status,
      teamA: match.teamA,
      teamB: match.teamB,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winnerTeamId: match.winnerTeamId,
      officialResultStatus: match.officialResultStatus,
      onlineServerInfo: match.onlineServerInfo,
      gamingRoomId: match.gamingRoomId,
      gamingRoomName: match.gamingRoom?.name ?? null,
      onsiteStationLabel: match.onsiteStationLabel,
    };
  }

  private getBracketRoundLabel(round: number, totalRounds: number): string {
    const roundsRemaining = totalRounds - round;
    if (roundsRemaining === 0) return 'Final';
    if (roundsRemaining === 1) return 'Semifinals';
    if (roundsRemaining === 2) return 'Quarterfinals';
    return `Round ${round}`;
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

  private async findOrganizerRegistrationOrThrow(
    tournamentId: string,
    registrationId: string,
    client: Pick<Prisma.TransactionClient, 'tournamentRegistration'> = this
      .databaseService.client,
  ): Promise<OrganizerRegistrationDetailRecord> {
    const registration = await client.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
      select: organizerRegistrationDetailSelect,
    });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    return registration;
  }

  private toOrganizerRegistrationListItem(
    registration: OrganizerRegistrationListRecord,
  ): OrganizerRegistrationListItemDto {
    const eligibility = this.getOrganizerRegistrationEligibility(registration);

    return {
      registrationId: registration.id,
      team: registration.team,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      approvalStatus: registration.approvalStatus,
      rulesVersion: registration.rulesVersion,
      submittedAt: registration.submittedAt,
      rejectionReason: registration.rejectionReason,
      eligibility,
    };
  }

  private toOrganizerRegistrationDetail(
    registration: OrganizerRegistrationDetailRecord,
  ): OrganizerRegistrationDetailResponseDto {
    return {
      ...this.toOrganizerRegistrationListItem(registration),
      captainContactSnapshot: registration.captainContactSnapshot,
      rosterSnapshot: registration.rosterSnapshot,
      approvedAt: registration.approvedAt,
      rejectedAt: registration.rejectedAt,
      latestPaymentProof: registration.paymentProofs?.[0]
        ? this.tournamentPaymentService.toPaymentProofResponse(
            registration.paymentProofs[0],
          )
        : null,
    };
  }

  private getOrganizerRegistrationEligibility(
    registration: OrganizerRegistrationListRecord,
  ): OrganizerRegistrationListItemDto['eligibility'] {
    const issues: TournamentEligibilityIssueDto[] = [];

    if (registration.team.status !== TeamStatus.ACTIVE) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TEAM_INACTIVE,
        'team.status',
        'Only active teams can be approved for tournaments.',
      );
    }

    return {
      eligible: issues.length === 0,
      issues,
    };
  }

  private assertOrganizerRegistrationCanBeApproved(
    registration: OrganizerRegistrationDetailRecord,
  ): void {
    if (
      registration.paymentStatus !==
        RegistrationPaymentStatus.PROOF_SUBMITTED &&
      registration.paymentStatus !== RegistrationPaymentStatus.VERIFIED &&
      registration.paymentStatus !== RegistrationPaymentStatus.NOT_REQUIRED
    ) {
      throw new ConflictException(
        'Paid registrations require submitted payment proof before approval.',
      );
    }

    if (registration.approvalStatus !== RegistrationApprovalStatus.PENDING) {
      throw new ConflictException(
        'Only pending registrations can be approved.',
      );
    }

    if (
      registration.status !== TournamentRegistrationStatus.PENDING_APPROVAL &&
      registration.status !== TournamentRegistrationStatus.WAITLISTED
    ) {
      throw new ConflictException(
        'Registration status does not allow approval.',
      );
    }
  }

  private assertOrganizerRegistrationCanBeRejected(
    registration: OrganizerRegistrationDetailRecord,
  ): void {
    if (registration.approvalStatus !== RegistrationApprovalStatus.PENDING) {
      throw new ConflictException(
        'Only pending registrations can be rejected.',
      );
    }

    if (
      registration.status === TournamentRegistrationStatus.WITHDRAWN ||
      registration.status === TournamentRegistrationStatus.CHECKED_IN ||
      registration.status === TournamentRegistrationStatus.DISQUALIFIED ||
      registration.status === TournamentRegistrationStatus.REFUNDED
    ) {
      throw new ConflictException(
        'Registration status does not allow rejection.',
      );
    }
  }

  private addEligibilityIssue(
    issues: TournamentEligibilityIssueDto[],
    code: TournamentEligibilityIssueCode,
    field: string,
    message: string,
  ): void {
    issues.push({ code, field, message });
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

  private toCaptainRegistrationHub(
    registration: CaptainRegistrationHubRecord,
  ): CaptainRegistrationHubResponseDto {
    return {
      registration: {
        id: registration.id,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        approvalStatus: registration.approvalStatus,
        submittedAt: registration.submittedAt,
        approvedAt: registration.approvedAt,
        rulesVersion: registration.rulesVersion,
        rulesAcceptedAt: registration.rulesAcceptedAt,
      },
      tournament: {
        id: registration.tournament.id,
        slug: registration.tournament.slug,
        name: registration.tournament.name,
        logoUrl: registration.tournament.logoUrl,
        coverUrl: registration.tournament.coverUrl,
        gameKey: registration.tournament.gameKey,
        mode: registration.tournament.mode,
        status: registration.tournament.status,
        startsAt: registration.tournament.startsAt,
        endsAt: registration.tournament.endsAt,
        timezone: registration.tournament.timezone,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
        seed: null,
      },
      rosterSnapshot: registration.rosterSnapshot,
      privateInformationAvailable: true,
      onlinePrivateInfo: registration.tournament.onlineConfiguration
        ? {
            serverRegion:
              registration.tournament.onlineConfiguration.serverRegion,
            connectionRules:
              registration.tournament.onlineConfiguration.connectionRules,
            discordServerUrl:
              registration.tournament.onlineConfiguration.discordServerUrl,
            captainSupportChannel:
              registration.tournament.onlineConfiguration.captainSupportChannel,
            matchReportingChannel:
              registration.tournament.onlineConfiguration.matchReportingChannel,
            lobbyInstructions:
              registration.tournament.onlineConfiguration.lobbyInstructions,
            privateSupportContact:
              registration.tournament.onlineConfiguration.privateSupportContact,
          }
        : null,
      venuePrivateInfo: registration.tournament.venue
        ? {
            name: registration.tournament.venue.name,
            country: registration.tournament.venue.country,
            city: registration.tournament.venue.city,
            address: registration.tournament.venue.address,
            mapUrl: registration.tournament.venue.mapUrl,
            checkInLocation: registration.tournament.venue.checkInLocation,
            venueRules: registration.tournament.venue.venueRules,
            parkingInfo: registration.tournament.venue.parkingInfo,
            equipmentProvided: registration.tournament.venue.equipmentProvided,
            playersMayBring: registration.tournament.venue.playersMayBring,
            playersMustBring: registration.tournament.venue.playersMustBring,
          }
        : null,
      progress: {
        currentStage: null,
        currentRound: null,
        nextMatch: null,
        upcomingMatches: [],
        officialScoreSummary: null,
        wins: null,
        losses: null,
        placement: null,
        qualificationState: null,
      },
      checkedIn:
        registration.status === TournamentRegistrationStatus.CHECKED_IN,
      announcements: [],
      requiredActions: this.getCaptainHubRequiredActions(registration),
    };
  }

  private async findCaptainMatchAccessRegistration(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainMatchAccessRegistrationRecord> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainMatchAccessRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);

    return registration;
  }

  private toCaptainMatchOwnershipWhere(
    registration:
      | CaptainMatchAccessRegistrationRecord
      | CaptainInformationRegistrationRecord
      | CaptainCheckInRegistrationRecord,
  ): Prisma.TournamentMatchWhereInput {
    return {
      tournamentId: registration.tournament.id,
      OR: [
        {
          teamAId: registration.team.id,
        },
        {
          teamBId: registration.team.id,
        },
      ],
    };
  }

  private toCaptainMatchResponse(
    match: CaptainMatchRecord,
    captainTeamId: string,
  ): CaptainMatchResponseDto {
    const captainIsTeamA = match.teamAId === captainTeamId;
    const opponent = captainIsTeamA ? match.teamB : match.teamA;
    const captainTeamScore = captainIsTeamA
      ? match.teamAScore
      : match.teamBScore;
    const opponentScore = captainIsTeamA ? match.teamBScore : match.teamAScore;

    return {
      id: match.id,
      tournament: {
        id: match.tournament.id,
        name: match.tournament.name,
        mode: match.tournament.mode,
      },
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition,
      opponent: opponent
        ? {
            teamId: opponent.id,
            teamName: opponent.name,
          }
        : null,
      scheduledAt: match.scheduledAt,
      timezone: match.tournament.timezone,
      bestOf: match.bestOf,
      status: match.status,
      captainTeamScore,
      opponentScore,
      mapResults: match.games.map((game) => ({
        id: game.id,
        gameNumber: game.gameNumber,
        mapName: game.mapName,
        captainTeamScore: captainIsTeamA ? game.teamAScore : game.teamBScore,
        opponentScore: captainIsTeamA ? game.teamBScore : game.teamAScore,
        winnerTeamId: game.winnerTeamId,
        evidenceAvailable: Boolean(game.evidenceUrl),
      })),
      winnerTeamId: match.winnerTeamId,
      forfeitStatus: match.forfeitStatus,
      officialResultStatus: match.officialResultStatus,
      evidenceAvailable:
        Boolean(match.evidenceUrl) ||
        match.games.some((game) => Boolean(game.evidenceUrl)),
      disputeStatus: match.disputeStatus,
      onlineServer:
        match.tournament.mode === TournamentMode.ONLINE &&
        match.onlineServerInfo !== null
          ? {
              onlineServerInfo: match.onlineServerInfo,
            }
          : null,
      onsiteAssignment:
        match.tournament.mode === TournamentMode.ONSITE && match.gamingRoom
          ? {
              gamingRoomId: match.gamingRoom.id,
              roomName: match.gamingRoom.name,
              stationLabel: match.onsiteStationLabel,
            }
          : null,
    };
  }

  private toCaptainRegistrationProgress(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
    now: Date,
  ): CaptainRegistrationProgressResponseDto {
    const officialCompletedMatches = matches.filter((match) =>
      this.isOfficialCompletedCaptainMatch(match),
    );
    const upcomingMatches = matches.filter((match) =>
      this.isUpcomingCaptainMatch(match, now),
    );
    const nextMatch = upcomingMatches.at(0) ?? null;
    const latestOfficialMatch = officialCompletedMatches.at(-1) ?? null;
    const currentSourceMatch = nextMatch ?? latestOfficialMatch;
    const mapsWon = officialCompletedMatches.reduce(
      (total, match) =>
        total +
        match.games.filter((game) => game.winnerTeamId === registration.team.id)
          .length,
      0,
    );
    const mapsLost = officialCompletedMatches.reduce(
      (total, match) =>
        total +
        match.games.filter(
          (game) =>
            game.winnerTeamId !== null &&
            game.winnerTeamId !== registration.team.id,
        ).length,
      0,
    );

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
      },
      currentStage: currentSourceMatch?.stage ?? null,
      currentRound: currentSourceMatch?.round ?? null,
      nextMatch: nextMatch
        ? this.toCaptainProgressMatchSummary(nextMatch, registration.team.id)
        : null,
      upcomingMatches: upcomingMatches.map((match) =>
        this.toCaptainProgressMatchSummary(match, registration.team.id),
      ),
      wins: officialCompletedMatches.filter(
        (match) => match.winnerTeamId === registration.team.id,
      ).length,
      losses: officialCompletedMatches.filter(
        (match) =>
          match.winnerTeamId !== null &&
          match.winnerTeamId !== registration.team.id,
      ).length,
      matchesPlayed: officialCompletedMatches.length,
      matchesRemaining: upcomingMatches.length,
      officialScoreSummary: {
        matchesWithOfficialResults: officialCompletedMatches.length,
        mapsWon,
        mapsLost,
      },
      placement: null,
      qualificationState: null,
    };
  }

  private toCaptainRegistrationBracket(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
  ): CaptainRegistrationBracketResponseDto {
    const stages = new Map<
      string,
      CaptainRegistrationBracketResponseDto['stages'][number]
    >();

    matches.forEach((match) => {
      const existingStage = stages.get(match.stage) ?? {
        stage: match.stage,
        matches: [],
      };

      existingStage.matches.push({
        id: match.id,
        stage: match.stage,
        round: match.round,
        bracketPosition: match.bracketPosition,
        scheduledAt: match.scheduledAt,
        status: match.status,
        teamA: match.teamA
          ? {
              id: match.teamA.id,
              name: match.teamA.name,
              isCaptainTeam: match.teamA.id === registration.team.id,
            }
          : null,
        teamB: match.teamB
          ? {
              id: match.teamB.id,
              name: match.teamB.name,
              isCaptainTeam: match.teamB.id === registration.team.id,
            }
          : null,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        winnerTeamId: match.winnerTeamId,
        officialResultStatus: match.officialResultStatus,
      });
      stages.set(match.stage, existingStage);
    });

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
      },
      captainTeamId: registration.team.id,
      stages: Array.from(stages.values()),
    };
  }

  private toCaptainRegistrationStandings(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
  ): CaptainRegistrationStandingsResponseDto {
    const standings = new Map<string, CaptainStandingAccumulator>();
    const officialCompletedMatches = matches.filter((match) =>
      this.isOfficialCompletedCaptainMatch(match),
    );

    matches.forEach((match) => {
      this.ensureStandingTeam(standings, match.teamA);
      this.ensureStandingTeam(standings, match.teamB);
    });

    officialCompletedMatches.forEach((match) => {
      if (!match.teamA || !match.teamB || !match.winnerTeamId) {
        return;
      }

      const teamAStanding = this.ensureStandingTeam(standings, match.teamA);
      const teamBStanding = this.ensureStandingTeam(standings, match.teamB);
      const teamAMapsWon = match.games.filter(
        (game) => game.winnerTeamId === match.teamAId,
      ).length;
      const teamBMapsWon = match.games.filter(
        (game) => game.winnerTeamId === match.teamBId,
      ).length;

      teamAStanding.matchesPlayed += 1;
      teamBStanding.matchesPlayed += 1;
      teamAStanding.mapsWon += teamAMapsWon;
      teamAStanding.mapsLost += teamBMapsWon;
      teamBStanding.mapsWon += teamBMapsWon;
      teamBStanding.mapsLost += teamAMapsWon;

      if (match.winnerTeamId === match.teamAId) {
        teamAStanding.wins += 1;
        teamBStanding.losses += 1;
      } else if (match.winnerTeamId === match.teamBId) {
        teamBStanding.wins += 1;
        teamAStanding.losses += 1;
      }
    });

    const items = Array.from(standings.values())
      .sort((left, right) => this.compareCaptainStandings(left, right))
      .map((standing, index): CaptainStandingItemDto => ({
        rank: index + 1,
        team: {
          id: standing.teamId,
          name: standing.teamName,
          isCaptainTeam: standing.teamId === registration.team.id,
        },
        wins: standing.wins,
        losses: standing.losses,
        matchesPlayed: standing.matchesPlayed,
        mapsWon: standing.mapsWon,
        mapsLost: standing.mapsLost,
        mapDifferential: standing.mapsWon - standing.mapsLost,
      }));

    return {
      registrationId: registration.id,
      tournamentId: registration.tournament.id,
      tournamentName: registration.tournament.name,
      captainTeamId: registration.team.id,
      officialResultsOnly: true,
      items,
    };
  }

  private toCaptainRegistrationInformation(
    registration: CaptainInformationRegistrationRecord,
    nextMatch: CaptainMatchRecord | null,
    now: Date,
  ): CaptainRegistrationInformationResponseDto {
    const lobbyInformationReleasesAt = new Date(
      registration.tournament.startsAt.getTime() - 24 * 60 * 60 * 1000,
    );
    const lobbyInformationReleased =
      now >= lobbyInformationReleasesAt ||
      registration.tournament.status === TournamentStatus.CHECK_IN_OPEN ||
      registration.tournament.status === TournamentStatus.IN_PROGRESS;

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
        mode: registration.tournament.mode,
        timezone: registration.tournament.timezone,
      },
      releaseGate: {
        lobbyInformationReleased,
        lobbyInformationReleasesAt,
      },
      checkInInstructions: registration.tournament.checkInRules,
      onlineInformation: registration.tournament.onlineConfiguration
        ? {
            serverRegion:
              registration.tournament.onlineConfiguration.serverRegion,
            connectionRules:
              registration.tournament.onlineConfiguration.connectionRules,
            tournamentDiscordInvitation:
              registration.tournament.onlineConfiguration.discordServerUrl,
            captainSupportChannel:
              registration.tournament.onlineConfiguration.captainSupportChannel,
            matchReportingChannel:
              registration.tournament.onlineConfiguration.matchReportingChannel,
            technicalSupportInstructions:
              registration.tournament.onlineConfiguration
                .screenshotRequirements,
            organizerSupportContact:
              registration.tournament.onlineConfiguration.privateSupportContact,
            lobbyInformation: lobbyInformationReleased
              ? registration.tournament.onlineConfiguration.lobbyInstructions
              : null,
            nextMatchServerInformation:
              lobbyInformationReleased &&
              nextMatch !== null &&
              nextMatch.onlineServerInfo !== null
                ? nextMatch.onlineServerInfo
                : null,
          }
        : null,
      venueInformation: registration.tournament.venue
        ? {
            name: registration.tournament.venue.name,
            country: registration.tournament.venue.country,
            city: registration.tournament.venue.city,
            address: registration.tournament.venue.address,
            mapUrl: registration.tournament.venue.mapUrl,
            checkInLocation: registration.tournament.venue.checkInLocation,
            venueInstructions: registration.tournament.venue.venueRules,
            parkingInfo: registration.tournament.venue.parkingInfo,
            arrivalTime:
              registration.tournament.checkInOpensAt ??
              registration.tournament.startsAt,
            assignedRoomId: nextMatch?.gamingRoom?.id ?? null,
            assignedRoomName: nextMatch?.gamingRoom?.name ?? null,
            assignedStation: nextMatch?.onsiteStationLabel ?? null,
          }
        : null,
    };
  }

  private async findCaptainCheckInRegistrationOrThrow(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainCheckInRegistrationRecord> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainCheckInRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    return registration;
  }

  private async findNextCaptainMatch(
    registration:
      CaptainCheckInRegistrationRecord | CaptainInformationRegistrationRecord,
  ): Promise<CaptainMatchRecord | null> {
    return this.databaseService.client.tournamentMatch.findFirst({
      where: this.toCaptainMatchOwnershipWhere(registration),
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });
  }

  private toCaptainRegistrationCheckIn(
    registration: CaptainCheckInRegistrationRecord,
    nextMatch: CaptainMatchRecord | null,
    now: Date,
  ): CaptainRegistrationCheckInResponseDto {
    const outstandingIssues = this.getCaptainCheckInIssues(registration, now);
    const checkedIn =
      registration.status === TournamentRegistrationStatus.CHECKED_IN;

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
        mode: registration.tournament.mode,
        timezone: registration.tournament.timezone,
      },
      registration: {
        status: registration.status,
        approvalStatus: registration.approvalStatus,
        paymentStatus: registration.paymentStatus,
        checkedInAt: registration.checkedInAt,
      },
      canCheckIn: outstandingIssues.length === 0 && !checkedIn,
      checkedIn,
      outstandingIssues,
      instructions: {
        checkInInstructions: registration.tournament.checkInRules,
        arrivalTime:
          registration.tournament.checkInOpensAt ??
          registration.tournament.startsAt,
        serverRegion:
          registration.tournament.onlineConfiguration?.serverRegion ?? null,
        onlineInstructions:
          registration.tournament.onlineConfiguration?.connectionRules ?? null,
        venueName: registration.tournament.venue?.name ?? null,
        checkInLocation: registration.tournament.venue?.checkInLocation ?? null,
        assignedRoomName: nextMatch?.gamingRoom?.name ?? null,
        assignedStation: nextMatch?.onsiteStationLabel ?? null,
      },
    };
  }

  private getCaptainCheckInIssues(
    registration: CaptainCheckInRegistrationRecord,
    now: Date,
  ): CaptainCheckInIssueDto[] {
    const issues: CaptainCheckInIssueDto[] = [];

    this.addCheckInIssueIf(
      issues,
      registration.approvalStatus !== RegistrationApprovalStatus.APPROVED,
      'registration.approvalStatus',
      'Organizer must approve the team before check-in.',
    );
    this.addCheckInIssueIf(
      issues,
      registration.status !== TournamentRegistrationStatus.CONFIRMED,
      'registration.status',
      registration.status === TournamentRegistrationStatus.CHECKED_IN
        ? 'Team is already checked in.'
        : 'Registration must be confirmed by the organizer before check-in.',
    );
    this.addCheckInIssueIf(
      issues,
      !this.isTournamentCheckInWindowOpen(registration, now),
      'tournament.checkInWindow',
      'Tournament check-in window is not open.',
    );
    this.addCheckInIssueIf(
      issues,
      !registration.captain.phoneNumber,
      'captain.phoneNumber',
      'Captain profile must include a phone number before check-in.',
    );
    this.addCheckInIssueIf(
      issues,
      registration.team.status !== TeamStatus.ACTIVE,
      'team.status',
      'Only active teams can check in.',
    );
    this.addCheckInRosterIssues(issues, registration);

    return issues;
  }

  private addCheckInRosterIssues(
    issues: CaptainCheckInIssueDto[],
    registration: CaptainCheckInRegistrationRecord,
  ): void {
    const starters = registration.team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.STARTER,
    );
    const substitutes = registration.team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.SUBSTITUTE,
    );

    this.addCheckInIssueIf(
      issues,
      starters.length < registration.tournament.minimumStarters,
      'team.rosterPlayers',
      `At least ${registration.tournament.minimumStarters} starters are required before check-in.`,
    );
    this.addCheckInIssueIf(
      issues,
      starters.length > registration.tournament.maximumStarters,
      'team.rosterPlayers',
      `No more than ${registration.tournament.maximumStarters} starters are allowed before check-in.`,
    );
    this.addCheckInIssueIf(
      issues,
      substitutes.length > registration.tournament.maximumSubstitutes,
      'team.rosterPlayers',
      `No more than ${registration.tournament.maximumSubstitutes} substitutes are allowed before check-in.`,
    );

    registration.team.rosterPlayers.forEach((player) => {
      this.addCheckInIssueIf(
        issues,
        registration.tournament.requiredGameAccountId &&
          !player.gameAccountId.trim(),
        `team.rosterPlayers.${player.id}.gameAccountId`,
        `${player.gamerTag} must have a game account ID before check-in.`,
      );
      this.addCheckInIssueIf(
        issues,
        !player.phoneNumber.trim(),
        `team.rosterPlayers.${player.id}.phoneNumber`,
        `${player.gamerTag} must have a phone number before check-in.`,
      );
    });
  }

  private isTournamentCheckInWindowOpen(
    registration: CaptainCheckInRegistrationRecord,
    now: Date,
  ): boolean {
    if (registration.tournament.status === TournamentStatus.CHECK_IN_OPEN) {
      return true;
    }

    if (
      registration.tournament.checkInOpensAt &&
      registration.tournament.checkInClosesAt
    ) {
      return (
        now >= registration.tournament.checkInOpensAt &&
        now <= registration.tournament.checkInClosesAt
      );
    }

    return false;
  }

  private addCheckInIssueIf(
    issues: CaptainCheckInIssueDto[],
    condition: boolean,
    field: string,
    message: string,
  ): void {
    if (condition) {
      issues.push({ field, message });
    }
  }

  private ensureStandingTeam(
    standings: Map<string, CaptainStandingAccumulator>,
    team: CaptainMatchRecord['teamA'],
  ): CaptainStandingAccumulator {
    if (!team) {
      return {
        teamId: '',
        teamName: '',
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        mapsWon: 0,
        mapsLost: 0,
      };
    }

    const existing = standings.get(team.id);

    if (existing) {
      return existing;
    }

    const created: CaptainStandingAccumulator = {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mapsWon: 0,
      mapsLost: 0,
    };
    standings.set(team.id, created);

    return created;
  }

  private compareCaptainStandings(
    left: CaptainStandingAccumulator,
    right: CaptainStandingAccumulator,
  ): number {
    const leftMapDifferential = left.mapsWon - left.mapsLost;
    const rightMapDifferential = right.mapsWon - right.mapsLost;

    return (
      right.wins - left.wins ||
      left.losses - right.losses ||
      rightMapDifferential - leftMapDifferential ||
      right.mapsWon - left.mapsWon ||
      left.teamName.localeCompare(right.teamName)
    );
  }

  private toCaptainProgressMatchSummary(
    match: CaptainMatchRecord,
    captainTeamId: string,
  ): CaptainProgressMatchSummaryDto {
    const opponent =
      match.teamAId === captainTeamId ? match.teamB : match.teamA;

    return {
      id: match.id,
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition,
      opponent: opponent
        ? {
            teamId: opponent.id,
            teamName: opponent.name,
          }
        : null,
      scheduledAt: match.scheduledAt,
      status: match.status,
    };
  }

  private isOfficialCompletedCaptainMatch(match: CaptainMatchRecord): boolean {
    return (
      match.officialResultStatus ===
        TournamentMatchOfficialResultStatus.CONFIRMED &&
      (match.status === TournamentMatchStatus.COMPLETED ||
        match.status === TournamentMatchStatus.FORFEIT)
    );
  }

  private isUpcomingCaptainMatch(
    match: CaptainMatchRecord,
    now: Date,
  ): boolean {
    if (
      match.status !== TournamentMatchStatus.SCHEDULED &&
      match.status !== TournamentMatchStatus.LIVE &&
      match.status !== TournamentMatchStatus.POSTPONED
    ) {
      return false;
    }

    return match.scheduledAt === null || match.scheduledAt >= now;
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
      registration.paymentStatus === RegistrationPaymentStatus.AWAITING_PROOF ||
      registration.paymentStatus === RegistrationPaymentStatus.REJECTED ||
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

  private assertRegistrationCanAccessHub(
    registration:
      | CaptainRegistrationHubRecord
      | CaptainMatchAccessRegistrationRecord
      | CaptainInformationRegistrationRecord,
  ): void {
    if (registration.approvalStatus !== RegistrationApprovalStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved registrations can access the tournament hub.',
      );
    }

    if (
      registration.status !== TournamentRegistrationStatus.CONFIRMED &&
      registration.status !== TournamentRegistrationStatus.CHECKED_IN
    ) {
      throw new ForbiddenException(
        'Registration status does not allow tournament hub access.',
      );
    }

    if (
      registration.paymentStatus !==
        RegistrationPaymentStatus.PROOF_SUBMITTED &&
      registration.paymentStatus !== RegistrationPaymentStatus.VERIFIED &&
      registration.paymentStatus !== RegistrationPaymentStatus.NOT_REQUIRED
    ) {
      throw new ForbiddenException(
        'Registration payment must be completed before accessing the tournament hub.',
      );
    }
  }

  private getCaptainHubRequiredActions(
    registration: CaptainRegistrationHubRecord,
  ): CaptainRegistrationNextAction[] {
    if (
      registration.status === TournamentRegistrationStatus.CONFIRMED &&
      registration.tournament.status === TournamentStatus.CHECK_IN_OPEN
    ) {
      return [CaptainRegistrationNextAction.CHECK_IN];
    }

    if (registration.tournament.status === TournamentStatus.COMPLETED) {
      return [CaptainRegistrationNextAction.TOURNAMENT_COMPLETED];
    }

    return [CaptainRegistrationNextAction.NONE];
  }

  private assertRegistrationCanBeWithdrawn(
    registration: CaptainRegistrationDetailRecord,
  ): void {
    if (
      withdrawalBlockedRegistrationStatuses.includes(registration.status) ||
      registration.paymentStatus === RegistrationPaymentStatus.REFUNDED
    ) {
      throw new ConflictException(
        'This registration can no longer be withdrawn.',
      );
    }

    if (registration.tournament.status === TournamentStatus.COMPLETED) {
      throw new ConflictException(
        'Completed tournaments cannot be withdrawn from.',
      );
    }

    if (
      withdrawalBlockedTournamentStatuses.includes(
        registration.tournament.status,
      )
    ) {
      throw new ConflictException(
        'Tournament lifecycle no longer allows withdrawal.',
      );
    }
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

    if (Number(tournament.registrationFee.toString()) > 0) {
      const activePaymentMethods = tournament.paymentMethods.filter(
        (method) => method.enabled,
      );

      if (activePaymentMethods.length === 0) {
        this.addPublicationIssue(
          issues,
          'paymentMethods',
          'Paid tournaments require at least one active manual payment method.',
        );
      }

      if (
        activePaymentMethods.some(
          (method) => method.instructions.trim().length < 10,
        )
      ) {
        this.addPublicationIssue(
          issues,
          'paymentMethods.instructions',
          'Active payment methods must include clear payment instructions.',
        );
      }
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
}
