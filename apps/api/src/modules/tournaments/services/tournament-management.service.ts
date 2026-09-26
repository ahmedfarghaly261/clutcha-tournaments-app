import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type OrganizerTournamentDetailResponseDto } from '../dtos/organizer-tournament-detail-response.dto';
import { type CreateTournamentDto } from '../dtos/create-tournament.dto';
import { type TournamentResponseDto } from '../dtos/tournament-response.dto';
import { type UpdateTournamentDraftDto } from '../dtos/update-tournament-draft.dto';
import {
  TournamentCoverImageStorageService,
  type TournamentCoverImageFile,
} from './tournament-cover-image-storage.service';
import { TournamentQueryService } from './tournament-query.service';
import { toTournamentResponse } from '../mappers/tournament.mapper';

type ValidationIssue = {
  field: string;
  message: string;
};

type PublicationReadinessIssue =
  OrganizerTournamentDetailResponseDto['publicationReadiness']['issues'][number];

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

@Injectable()
export class TournamentManagementService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly coverImageStorageService: TournamentCoverImageStorageService,
    private readonly tournamentQueryService: TournamentQueryService,
  ) {}

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
