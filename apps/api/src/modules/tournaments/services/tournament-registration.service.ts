import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import {
  CaptainRegistrationNextAction,
  type CaptainRegistrationDetailResponseDto,
  type CaptainRegistrationListItemDto,
  type CaptainRegistrationListResponseDto,
} from '../dtos/captain-registration-response.dto';
import {
  type CaptainCheckInIssueDto,
  type CaptainRegistrationCheckInResponseDto,
} from '../dtos/captain-registration-check-in-response.dto';
import { type CaptainRegistrationHubResponseDto } from '../dtos/captain-registration-hub-response.dto';
import {
  CaptainRegistrationSortDirection,
  CaptainRegistrationSortBy,
  CaptainRegistrationTimeFilter,
  type ListCaptainRegistrationsQueryDto,
} from '../dtos/list-captain-registrations-query.dto';
import {
  type OrganizerRegistrationDetailResponseDto,
  type OrganizerRegistrationListItemDto,
  type OrganizerRegistrationListResponseDto,
} from '../dtos/organizer-registration-response.dto';
import { type RejectOrganizerRegistrationDto } from '../dtos/reject-organizer-registration.dto';
import {
  TournamentEligibilityIssueCode,
  type TournamentEligibilityIssueDto,
} from '../dtos/tournament-eligibility-response.dto';
import { type WithdrawCaptainRegistrationDto } from '../dtos/withdraw-captain-registration.dto';
import { TournamentPaymentService } from './tournament-payment.service';

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
  tournament: { select: captainRegistrationTournamentSummarySelect },
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
  team: { select: { id: true, name: true } },
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

const captainCheckInRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  checkedInAt: true,
  captain: { select: { id: true, phoneNumber: true } },
  team: { select: eligibilityTeamSelect },
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
        select: { serverRegion: true, connectionRules: true },
      },
      venue: {
        select: { name: true, checkInLocation: true },
      },
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainCheckInMatchSelect = {
  gamingRoom: { select: { name: true } },
  onsiteStationLabel: true,
  scheduledAt: true,
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
  team: { select: organizerRegistrationTeamSelect },
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

type CaptainRegistrationListRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationListSelect;
}>;
type CaptainRegistrationDetailRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationDetailSelect;
}>;
type CaptainRegistrationHubRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof captainRegistrationHubSelect;
}>;
type CaptainCheckInRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainCheckInRegistrationSelect;
  }>;
type CaptainCheckInMatchRecord = Prisma.TournamentMatchGetPayload<{
  select: typeof captainCheckInMatchSelect;
}>;
type OrganizerRegistrationListRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof organizerRegistrationListSelect;
}>;
type OrganizerRegistrationDetailRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof organizerRegistrationDetailSelect;
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

@Injectable()
export class TournamentRegistrationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tournamentPaymentService: TournamentPaymentService,
  ) {}

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
        where: { id: registrationId, captainId },
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
        where: { id: registrationId, captainId },
        select: captainRegistrationHubSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);
    return this.toCaptainRegistrationHub(registration);
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
            where: { id: registrationId, captainId },
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
          where: { id: registrationId, captainId },
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

  private async findOwnedTournamentOrThrow(
    organizerId: string,
    tournamentId: string,
    client: Pick<Prisma.TransactionClient, 'tournament'> = this.databaseService
      .client,
  ): Promise<{ id: string; maximumTeams: number }> {
    const tournament = await client.tournament.findFirst({
      where: { id: tournamentId, organizerId },
      select: { id: true, maximumTeams: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private async findOrganizerRegistrationOrThrow(
    tournamentId: string,
    registrationId: string,
    client: Pick<Prisma.TransactionClient, 'tournamentRegistration'> = this
      .databaseService.client,
  ): Promise<OrganizerRegistrationDetailRecord> {
    const registration = await client.tournamentRegistration.findFirst({
      where: { id: registrationId, tournamentId },
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
    return {
      registrationId: registration.id,
      team: registration.team,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      approvalStatus: registration.approvalStatus,
      rulesVersion: registration.rulesVersion,
      submittedAt: registration.submittedAt,
      rejectionReason: registration.rejectionReason,
      eligibility: this.getOrganizerRegistrationEligibility(registration),
    };
  }

  private getOrganizerRegistrationEligibility(
    registration: OrganizerRegistrationListRecord,
  ): OrganizerRegistrationListItemDto['eligibility'] {
    const issues: TournamentEligibilityIssueDto[] = [];
    if (registration.team.status !== TeamStatus.ACTIVE) {
      issues.push({
        code: TournamentEligibilityIssueCode.TEAM_INACTIVE,
        field: 'team.status',
        message: 'Only active teams can be approved for tournaments.',
      });
    }

    return { eligible: issues.length === 0, issues };
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

  private toCaptainRegistrationWhere(
    captainId: string,
    query: ListCaptainRegistrationsQueryDto,
  ): Prisma.TournamentRegistrationWhereInput {
    const tournament: Prisma.TournamentWhereInput = {};
    if (query.gameKey) {
      tournament.gameKey = { equals: query.gameKey, mode: 'insensitive' };
    }
    if (query.mode) tournament.mode = query.mode;
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
    return sortBy === CaptainRegistrationSortBy.TOURNAMENT_STARTS_AT
      ? { tournament: { startsAt: direction } }
      : { submittedAt: direction };
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
      onlinePrivateInfo: registration.tournament.onlineConfiguration,
      venuePrivateInfo: registration.tournament.venue,
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

  private async findCaptainCheckInRegistrationOrThrow(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainCheckInRegistrationRecord> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: { id: registrationId, captainId },
        select: captainCheckInRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    return registration;
  }

  private async findNextCaptainMatch(
    registration: CaptainCheckInRegistrationRecord,
  ): Promise<CaptainCheckInMatchRecord | null> {
    return this.databaseService.client.tournamentMatch.findFirst({
      where: {
        tournamentId: registration.tournament.id,
        OR: [
          { teamAId: registration.team.id },
          { teamBId: registration.team.id },
        ],
      },
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainCheckInMatchSelect,
    });
  }

  private toCaptainRegistrationCheckIn(
    registration: CaptainCheckInRegistrationRecord,
    nextMatch: CaptainCheckInMatchRecord | null,
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

    return issues;
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
    if (condition) issues.push({ field, message });
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
    registration: CaptainRegistrationHubRecord,
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
}
