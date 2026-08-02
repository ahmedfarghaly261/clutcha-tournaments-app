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

type TournamentValidationErrorResponse = {
  message: string;
  issues: Array<{ field: string; message: string }>;
};

describe('TournamentsService', () => {
  let service: TournamentsService;
  let createdTournaments: Record<string, unknown>[];
  let create: jest.Mock<
    Promise<Record<string, unknown>>,
    [TournamentCreateArgs]
  >;
  let findUnique: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TournamentFindUniqueArgs]
  >;

  beforeEach(async () => {
    createdTournaments = [];
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

    const tournamentClient = {
      findUnique,
      create,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              $transaction: jest.fn(
                (callback: (transaction: unknown) => Promise<unknown>) =>
                  callback({ tournament: tournamentClient }),
              ),
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
    const response =
      exception.getResponse() as TournamentValidationErrorResponse;

    expect(response.message).toBe('Tournament draft validation failed.');
    expect(response.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(expectedFields),
    );
  }
};
