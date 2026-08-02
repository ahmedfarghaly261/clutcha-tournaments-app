import {
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
import { DatabaseService } from '../../database/database.service';
import { type CreateTournamentDto } from './dto/create-tournament.dto';
import {
  type ListOrganizerTournamentsQueryDto,
  OrganizerTournamentSortBy,
  SortDirection,
} from './dto/list-organizer-tournaments-query.dto';
import { type OrganizerTournamentDetailResponseDto } from './dto/organizer-tournament-detail-response.dto';
import { type OrganizerTournamentListResponseDto } from './dto/organizer-tournament-list-response.dto';
import { type TournamentResponseDto } from './dto/tournament-response.dto';
import { toTournamentResponse } from './mappers/tournament.mapper';

type ValidationIssue = {
  field: string;
  message: string;
};

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
    },
  },
  venue: {
    select: {
      id: true,
      gamingRooms: {
        select: {
          id: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentSelect;

@Injectable()
export class TournamentsService {
  constructor(private readonly databaseService: DatabaseService) {}

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

  private getPublicationReadiness(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentDetailSelect;
    }>,
  ): OrganizerTournamentDetailResponseDto['publicationReadiness'] {
    const issues: OrganizerTournamentDetailResponseDto['publicationReadiness']['issues'] =
      [];

    if (!tournament.name.trim()) {
      issues.push({
        field: 'name',
        message: 'Tournament name is required before publishing.',
      });
    }

    if (!tournament.gameKey.trim()) {
      issues.push({
        field: 'gameKey',
        message: 'Game key is required before publishing.',
      });
    }

    if (!tournament.rules.trim()) {
      issues.push({
        field: 'rules',
        message: 'Tournament rules are required before publishing.',
      });
    }

    if (tournament.registrationOpensAt >= tournament.registrationClosesAt) {
      issues.push({
        field: 'registrationClosesAt',
        message:
          'Registration close date must be after registration open date.',
      });
    }

    if (tournament.registrationClosesAt >= tournament.startsAt) {
      issues.push({
        field: 'startsAt',
        message: 'Tournament start date must be after registration closes.',
      });
    }

    if (tournament.maximumTeams < tournament.minimumTeams) {
      issues.push({
        field: 'maximumTeams',
        message:
          'Maximum teams must be greater than or equal to minimum teams.',
      });
    }

    if (tournament.maximumStarters < tournament.minimumStarters) {
      issues.push({
        field: 'maximumStarters',
        message:
          'Maximum starters must be greater than or equal to minimum starters.',
      });
    }

    if (
      tournament.mode === TournamentMode.ONLINE &&
      !tournament.onlineConfiguration
    ) {
      issues.push({
        field: 'onlineConfiguration',
        message:
          'Online tournaments require online configuration before publishing.',
      });
    }

    if (tournament.mode === TournamentMode.ONSITE) {
      if (!tournament.venue) {
        issues.push({
          field: 'venue',
          message: 'On-site tournaments require a venue before publishing.',
        });
      } else if (tournament.venue.gamingRooms.length === 0) {
        issues.push({
          field: 'gamingRooms',
          message:
            'On-site tournaments require at least one gaming room before publishing.',
        });
      }
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  private async generateUniqueSlug(
    name: string,
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
  ): Promise<string> {
    const baseSlug = this.slugify(name);

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existing = await transaction.tournament.findUnique({
        where: { slug },
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
