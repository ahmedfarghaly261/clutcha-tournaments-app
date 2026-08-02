import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import {
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type CreateTournamentDto } from './dto/create-tournament.dto';
import {
  OrganizerTournamentSortBy,
  SortDirection,
} from './dto/list-organizer-tournaments-query.dto';
import { TournamentsService } from './tournaments.service';

jest.mock('@clutcha/database', () => ({
  Prisma: {},
  TournamentFormat: {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
    DOUBLE_ELIMINATION: 'DOUBLE_ELIMINATION',
    ROUND_ROBIN: 'ROUND_ROBIN',
    GROUPS_THEN_PLAYOFFS: 'GROUPS_THEN_PLAYOFFS',
    SWISS: 'SWISS',
    BATTLE_ROYALE: 'BATTLE_ROYALE',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentSeedingMethod: {
    MANUAL: 'MANUAL',
    RANDOM: 'RANDOM',
    RANKED: 'RANKED',
  },
  TournamentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
    UNLISTED: 'UNLISTED',
    PRIVATE: 'PRIVATE',
  },
}));

type TournamentCreateArgs = {
  data: Record<string, unknown>;
};

type TournamentFindUniqueArgs = {
  where: { slug: string };
};

type TournamentFindManyArgs = {
  where: Record<string, unknown>;
  orderBy: Record<string, unknown>;
  skip: number;
  take: number;
};

type TournamentCountArgs = {
  where: Record<string, unknown>;
};

type TournamentValidationErrorResponse = {
  message: string;
  issues: Array<{ field: string; message: string }>;
};

let createdTournaments: Record<string, unknown>[];

describe('TournamentsService', () => {
  let service: TournamentsService;
  let create: jest.Mock<
    Promise<Record<string, unknown>>,
    [TournamentCreateArgs]
  >;
  let findUnique: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TournamentFindUniqueArgs]
  >;
  let findMany: jest.Mock<
    Promise<Record<string, unknown>[]>,
    [TournamentFindManyArgs]
  >;
  let count: jest.Mock<Promise<number>, [TournamentCountArgs]>;

  beforeEach(async () => {
    createdTournaments = [
      createTournamentRecord({
        id: 'tournament-1',
        organizerId: 'organizer-1',
        name: 'Alpha Valorant Cup',
        slug: 'alpha-valorant-cup',
      }),
      createTournamentRecord({
        id: 'tournament-2',
        organizerId: 'organizer-1',
        name: 'Beta Valorant Cup',
        slug: 'beta-valorant-cup',
        status: TournamentStatus.PUBLISHED,
      }),
      createTournamentRecord({
        id: 'tournament-3',
        organizerId: 'other-organizer',
        name: 'Other Organizer Cup',
        slug: 'other-organizer-cup',
      }),
    ];
    findUnique = jest.fn((args: TournamentFindUniqueArgs) =>
      Promise.resolve(
        createdTournaments.find((item) => item.slug === args.where.slug) ??
          null,
      ),
    );
    create = jest.fn((args: TournamentCreateArgs) => {
      const now = new Date('2026-08-02T12:00:00.000Z');
      const tournament = {
        id: `tournament-${createdTournaments.length + 1}`,
        ...args.data,
        publishedAt: null,
        registrationOpenedAt: null,
        registrationClosedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: now,
        updatedAt: now,
      };
      createdTournaments.push(tournament);
      return Promise.resolve(tournament);
    });
    findMany = jest.fn((args: TournamentFindManyArgs) =>
      Promise.resolve(applyListArgs(args)),
    );
    count = jest.fn((args: TournamentCountArgs) =>
      Promise.resolve(applyWhere(args.where).length),
    );

    const tournamentClient = {
      findUnique,
      create,
      findMany,
      count,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              $transaction: jest.fn((input: unknown) => {
                if (Array.isArray(input)) {
                  return Promise.all(input);
                }

                const callback = input as (
                  transaction: unknown,
                ) => Promise<unknown>;
                return callback({ tournament: tournamentClient });
              }),
              tournament: tournamentClient,
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TournamentsService);
  });

  const firstCreateData = (): Record<string, unknown> => {
    const firstCall = create.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournament.create to be called.');
    }

    return firstCall[0].data;
  };

  const firstFindManyArgs = (): TournamentFindManyArgs => {
    const firstCall = findMany.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournament.findMany to be called.');
    }

    return firstCall[0];
  };

  it('creates a draft tournament owned by the authenticated organizer', async () => {
    const result = await service.createOrganizerDraft(
      'organizer-from-token',
      validCreateDto(),
    );

    expect(firstCreateData()).toMatchObject({
      organizerId: 'organizer-from-token',
      status: TournamentStatus.DRAFT,
    });
    expect(result.organizerId).toBe('organizer-from-token');
    expect(result.status).toBe(TournamentStatus.DRAFT);
  });

  it('lists only tournaments owned by the authenticated organizer', async () => {
    const result = await service.listOrganizerTournaments('organizer-1', {});

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every((item) => item.organizerId === 'organizer-1'),
    ).toBe(true);
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(firstFindManyArgs()).toMatchObject({
      where: { organizerId: 'organizer-1' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
  });

  it('supports pagination, filters, search, and sorting', async () => {
    const result = await service.listOrganizerTournaments('organizer-1', {
      page: 2,
      limit: 1,
      status: TournamentStatus.PUBLISHED,
      mode: TournamentMode.ONLINE,
      visibility: TournamentVisibility.PUBLIC,
      gameKey: 'valorant',
      search: 'beta',
      sortBy: OrganizerTournamentSortBy.STARTS_AT,
      sortDirection: SortDirection.ASC,
    });

    expect(result.items).toHaveLength(0);
    expect(result.meta).toEqual({
      page: 2,
      limit: 1,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(firstFindManyArgs()).toMatchObject({
      where: {
        organizerId: 'organizer-1',
        status: TournamentStatus.PUBLISHED,
        mode: TournamentMode.ONLINE,
        visibility: TournamentVisibility.PUBLIC,
        gameKey: 'valorant',
      },
      orderBy: { startsAt: 'asc' },
      skip: 1,
      take: 1,
    });
    expect(firstFindManyArgs().where).toHaveProperty('OR');
  });

  it('ignores any organizerId overflow and uses the JWT organizer id', async () => {
    await service.createOrganizerDraft('real-organizer', {
      ...validCreateDto(),
      organizerId: 'malicious-organizer',
    } as never);

    expect(firstCreateData()).toMatchObject({
      organizerId: 'real-organizer',
    });
  });

  it('generates a unique slug when the base slug already exists', async () => {
    await service.createOrganizerDraft('organizer-1', validCreateDto());
    const second = await service.createOrganizerDraft(
      'organizer-1',
      validCreateDto(),
    );

    expect(second.slug).toBe('clutcha-valorant-cairo-cup-2');
  });

  it('defaults optional values for a draft tournament', async () => {
    const result = await service.createOrganizerDraft(
      'organizer-1',
      validCreateDto({
        currency: undefined,
        defaultBestOf: undefined,
        finalBestOf: undefined,
        maximumSubstitutes: undefined,
        seedingMethod: undefined,
        visibility: undefined,
      }),
    );

    expect(result.currency).toBe('EGP');
    expect(result.defaultBestOf).toBe(1);
    expect(result.finalBestOf).toBe(3);
    expect(result.maximumSubstitutes).toBe(0);
    expect(result.seedingMethod).toBe(TournamentSeedingMethod.MANUAL);
    expect(result.visibility).toBe(TournamentVisibility.PUBLIC);
  });

  it('rejects invalid date ordering with structured issues', async () => {
    await expectValidationIssues(
      service.createOrganizerDraft(
        'organizer-1',
        validCreateDto({
          registrationClosesAt: new Date('2026-09-01T09:00:00.000Z'),
        }),
      ),
      ['registrationClosesAt'],
    );
  });

  it('rejects invalid team and roster limits', async () => {
    await expect(
      service.createOrganizerDraft(
        'organizer-1',
        validCreateDto({
          maximumTeams: 4,
          minimumTeams: 8,
          maximumStarters: 4,
          minimumStarters: 5,
        }),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects even best-of values', async () => {
    await expectValidationIssues(
      service.createOrganizerDraft(
        'organizer-1',
        validCreateDto({ defaultBestOf: 2, finalBestOf: 4 }),
      ),
      ['defaultBestOf', 'finalBestOf'],
    );
  });

  it('rejects invalid time zones', async () => {
    await expectValidationIssues(
      service.createOrganizerDraft(
        'organizer-1',
        validCreateDto({ timezone: 'Mars/OlympusMons' }),
      ),
      ['timezone'],
    );
  });
});

const validCreateDto = (
  overrides: Partial<CreateTournamentDto> = {},
): CreateTournamentDto => ({
  name: 'CLUTCHA Valorant Cairo Cup',
  gameKey: 'valorant',
  mode: TournamentMode.ONLINE,
  visibility: TournamentVisibility.PUBLIC,
  format: TournamentFormat.SINGLE_ELIMINATION,
  minimumTeams: 8,
  maximumTeams: 16,
  minimumStarters: 5,
  maximumStarters: 5,
  maximumSubstitutes: 2,
  defaultBestOf: 1,
  finalBestOf: 3,
  seedingMethod: TournamentSeedingMethod.MANUAL,
  rules: 'Teams must follow the CLUTCHA competitive ruleset.',
  registrationOpensAt: new Date('2026-09-01T10:00:00.000Z'),
  registrationClosesAt: new Date('2026-09-10T20:00:00.000Z'),
  startsAt: new Date('2026-09-12T18:00:00.000Z'),
  timezone: 'Africa/Cairo',
  ...overrides,
});

const createTournamentRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'tournament-1',
  organizerId: 'organizer-1',
  name: 'CLUTCHA Valorant Cairo Cup',
  slug: 'clutcha-valorant-cairo-cup',
  shortDescription: null,
  description: null,
  logoUrl: null,
  coverUrl: null,
  gameKey: 'valorant',
  mode: TournamentMode.ONLINE,
  visibility: TournamentVisibility.PUBLIC,
  status: TournamentStatus.DRAFT,
  format: TournamentFormat.SINGLE_ELIMINATION,
  minimumTeams: 8,
  maximumTeams: 16,
  minimumStarters: 5,
  maximumStarters: 5,
  maximumSubstitutes: 2,
  defaultBestOf: 1,
  finalBestOf: 3,
  seedingMethod: TournamentSeedingMethod.MANUAL,
  thirdPlaceMatch: false,
  requiredGameAccountId: true,
  allowedRegion: null,
  allowedCountries: [],
  allowedPlatforms: [],
  minimumPlayerAge: null,
  minimumRank: null,
  maximumRank: null,
  registrationFee: { toString: () => '0' },
  currency: 'EGP',
  prizePool: { toString: () => '0' },
  prizeDistribution: null,
  refundPolicy: null,
  cancellationPolicy: null,
  rules: 'Teams must follow the CLUTCHA competitive ruleset.',
  rulesVersion: '1.0',
  rosterChangeRules: null,
  checkInRules: null,
  matchReportingRules: null,
  evidenceRequirements: null,
  disputeDeadlineMinutes: null,
  forfeitRules: null,
  codeOfConduct: null,
  registrationOpensAt: new Date('2026-09-01T10:00:00.000Z'),
  registrationClosesAt: new Date('2026-09-10T20:00:00.000Z'),
  rosterLocksAt: null,
  checkInOpensAt: null,
  checkInClosesAt: null,
  startsAt: new Date('2026-09-12T18:00:00.000Z'),
  endsAt: null,
  timezone: 'Africa/Cairo',
  waitlistEnabled: false,
  maximumWaitlistSize: null,
  manualApprovalRequired: true,
  publishedAt: null,
  registrationOpenedAt: null,
  registrationClosedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2026-08-02T12:00:00.000Z'),
  updatedAt: new Date('2026-08-02T12:00:00.000Z'),
  ...overrides,
});

const applyListArgs = (
  args: TournamentFindManyArgs,
): Record<string, unknown>[] => {
  const sortEntry = Object.entries(args.orderBy).at(0);
  const filtered = applyWhere(args.where);

  if (sortEntry) {
    const [field, direction] = sortEntry;
    filtered.sort((left, right) => {
      const leftValue = left[field];
      const rightValue = right[field];

      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return direction === SortDirection.ASC
          ? leftValue.localeCompare(rightValue)
          : rightValue.localeCompare(leftValue);
      }

      if (leftValue instanceof Date && rightValue instanceof Date) {
        return direction === SortDirection.ASC
          ? leftValue.getTime() - rightValue.getTime()
          : rightValue.getTime() - leftValue.getTime();
      }

      return 0;
    });
  }

  return filtered.slice(args.skip, args.skip + args.take);
};

const applyWhere = (
  where: Record<string, unknown>,
): Record<string, unknown>[] =>
  createdTournaments.filter((tournament) => {
    if (where.organizerId && tournament.organizerId !== where.organizerId) {
      return false;
    }
    if (where.status && tournament.status !== where.status) {
      return false;
    }
    if (where.mode && tournament.mode !== where.mode) {
      return false;
    }
    if (where.visibility && tournament.visibility !== where.visibility) {
      return false;
    }
    if (where.gameKey && tournament.gameKey !== where.gameKey) {
      return false;
    }

    const searchConditions = where.OR;

    if (Array.isArray(searchConditions)) {
      const search = getSearchTerm(searchConditions);
      const haystack = [
        tournament.name,
        tournament.slug,
        tournament.shortDescription,
        tournament.gameKey,
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();

      return haystack.includes(search.toLowerCase());
    }

    return true;
  });

const getSearchTerm = (conditions: unknown[]): string => {
  const firstCondition = conditions.at(0);

  if (!firstCondition || typeof firstCondition !== 'object') {
    return '';
  }

  const firstFieldCondition = Object.values(
    firstCondition as Record<string, unknown>,
  ).at(0);

  if (!firstFieldCondition || typeof firstFieldCondition !== 'object') {
    return '';
  }

  const contains = (firstFieldCondition as { contains?: unknown }).contains;

  return typeof contains === 'string' ? contains : '';
};

const expectValidationIssues = async (
  promise: Promise<unknown>,
  expectedFields: string[],
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected tournament draft validation to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    const exception = error as UnprocessableEntityException;
    const response = exception.getResponse();

    if (!isTournamentValidationErrorResponse(response)) {
      throw new Error('Expected a structured tournament validation response.');
    }

    expect(response.message).toBe('Tournament draft validation failed.');
    expect(response.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(expectedFields),
    );
  }
};

const isTournamentValidationErrorResponse = (
  value: string | object,
): value is TournamentValidationErrorResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<TournamentValidationErrorResponse>;

  return (
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.issues) &&
    candidate.issues.every(
      (issue) =>
        typeof issue === 'object' &&
        issue !== null &&
        typeof issue.field === 'string' &&
        typeof issue.message === 'string',
    )
  );
};
