import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma, TeamStatus, UserRole, UserStatus } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { CaptainsService } from './captains.service';
import { UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';

jest.mock('@clutcha/database', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;

    constructor(
      message: string,
      options: { code: string; meta?: Record<string, unknown> },
    ) {
      super(message);
      this.code = options.code;
      this.meta = options.meta;
    }
  }

  return {
    Prisma: {
      PrismaClientKnownRequestError,
      TransactionIsolationLevel: {
        Serializable: 'Serializable',
      },
    },
    TeamStatus: {
      ACTIVE: 'ACTIVE',
    },
    UserRole: {
      CAPTAIN: 'CAPTAIN',
      ORGANIZER: 'ORGANIZER',
    },
    UserStatus: {
      ACTIVE: 'ACTIVE',
    },
  };
});

type CaptainUserRecord = {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  discordUsername: string | null;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

type UserFindFirstArgs = {
  where: {
    id: string;
    role: UserRole;
  };
};

type UserUpdateArgs = {
  where: { id: string };
  data: {
    displayName?: string;
    phoneNumber?: string;
    discordUsername?: string | null;
  };
};

type CaptainTeamRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gameKey: string;
  region: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  discordServerUrl: string | null;
  status: TeamStatus;
  captainId: string;
  createdAt: Date;
  updatedAt: Date;
};

type TeamFindUniqueArgs = {
  where: Partial<{
    id: string;
    slug: string;
    captainId: string;
  }>;
};

type TeamCreateArgs = {
  data: {
    name: string;
    slug: string;
    description?: string | null;
    gameKey: string;
    region?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    discordServerUrl?: string | null;
    status: TeamStatus;
    captainId: string;
  };
};

type TeamTransactionClient = {
  team: {
    findUnique: (
      args: TeamFindUniqueArgs,
    ) => Promise<CaptainTeamRecord | { id: string } | null>;
    create: (args: TeamCreateArgs) => Promise<CaptainTeamRecord>;
  };
};

type TeamTransactionCallback = (
  transaction: TeamTransactionClient,
) => Promise<CaptainTeamRecord>;

const createPrismaKnownRequestError = (
  code: string,
  target: string[],
): Error => {
  const KnownRequestError =
    Prisma.PrismaClientKnownRequestError as unknown as new (
      message: string,
      options: { code: string; meta: Record<string, unknown> },
    ) => Error;

  return new KnownRequestError('Prisma known request error', {
    code,
    meta: { target },
  });
};

describe('CaptainsService', () => {
  let service: CaptainsService;
  let users: CaptainUserRecord[];
  let teams: CaptainTeamRecord[];
  let findFirst: jest.Mock<
    Promise<CaptainUserRecord | null>,
    [UserFindFirstArgs]
  >;
  let update: jest.Mock<Promise<CaptainUserRecord>, [UserUpdateArgs]>;
  let teamFindUnique: jest.Mock<
    Promise<CaptainTeamRecord | { id: string } | null>,
    [TeamFindUniqueArgs]
  >;
  let teamCreate: jest.Mock<Promise<CaptainTeamRecord>, [TeamCreateArgs]>;

  beforeEach(async () => {
    users = [
      createUserRecord({
        id: 'captain-1',
        email: 'captain@example.com',
        displayName: 'Captain One',
        role: UserRole.CAPTAIN,
      }),
      createUserRecord({
        id: 'organizer-1',
        email: 'organizer@example.com',
        displayName: 'Organizer One',
        role: UserRole.ORGANIZER,
      }),
    ];
    teams = [];

    findFirst = jest.fn((args: UserFindFirstArgs) =>
      Promise.resolve(
        users.find(
          (user) => user.id === args.where.id && user.role === args.where.role,
        ) ?? null,
      ),
    );
    update = jest.fn((args: UserUpdateArgs) => {
      const user = users.find((item) => item.id === args.where.id);

      if (!user) {
        throw new Error('User not found in fake database.');
      }

      Object.assign(user, args.data);
      return Promise.resolve(user);
    });
    teamFindUnique = jest.fn((args: TeamFindUniqueArgs) => {
      if (args.where.captainId) {
        return Promise.resolve(
          teams.find((team) => team.captainId === args.where.captainId) ?? null,
        );
      }

      if (args.where.slug) {
        return Promise.resolve(
          teams.find((team) => team.slug === args.where.slug) ?? null,
        );
      }

      if (args.where.id) {
        return Promise.resolve(
          teams.find((team) => team.id === args.where.id) ?? null,
        );
      }

      return Promise.resolve(null);
    });
    teamCreate = jest.fn((args: TeamCreateArgs) => {
      if (teams.some((team) => team.captainId === args.data.captainId)) {
        throw createPrismaKnownRequestError('P2002', ['captainId']);
      }

      if (teams.some((team) => team.slug === args.data.slug)) {
        throw createPrismaKnownRequestError('P2002', ['slug']);
      }

      const now = new Date('2026-08-03T12:00:00.000Z');
      const team: CaptainTeamRecord = {
        id: `team-${teams.length + 1}`,
        name: args.data.name,
        slug: args.data.slug,
        description: args.data.description ?? null,
        gameKey: args.data.gameKey,
        region: args.data.region ?? null,
        logoUrl: args.data.logoUrl ?? null,
        coverUrl: args.data.coverUrl ?? null,
        discordServerUrl: args.data.discordServerUrl ?? null,
        status: args.data.status,
        captainId: args.data.captainId,
        createdAt: now,
        updatedAt: now,
      };

      teams.push(team);

      return Promise.resolve(team);
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaptainsService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              $transaction: jest.fn((callback: TeamTransactionCallback) =>
                callback({
                  team: {
                    findUnique: teamFindUnique,
                    create: teamCreate,
                  },
                }),
              ),
              user: {
                findFirst,
                update,
              },
              team: {
                findUnique: teamFindUnique,
                create: teamCreate,
              },
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(CaptainsService);
  });

  const firstUpdateArgs = (): UserUpdateArgs => {
    const firstCall = update.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected user.update to be called.');
    }

    return firstCall[0];
  };

  it('returns the authenticated Captain profile without sensitive fields', async () => {
    const result = await service.getProfile('captain-1');

    expect(result).toMatchObject({
      id: 'captain-1',
      displayName: 'Captain One',
      email: 'captain@example.com',
      phoneNumber: null,
      discordUsername: null,
      role: UserRole.CAPTAIN,
      status: UserStatus.ACTIVE,
      profileComplete: false,
      team: null,
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('emailVerifiedAt');
  });

  it('updates the Captain phone number and marks the profile complete', async () => {
    const result = await service.updateProfile('captain-1', {
      phoneNumber: '+201001234567',
    });
    const updateArgs = firstUpdateArgs();

    expect(updateArgs.where).toEqual({ id: 'captain-1' });
    expect(updateArgs.data).toEqual({
      displayName: undefined,
      phoneNumber: '+201001234567',
      discordUsername: undefined,
    });
    expect(result.phoneNumber).toBe('+201001234567');
    expect(result.profileComplete).toBe(true);
  });

  it('updates the Captain Discord username', async () => {
    const result = await service.updateProfile('captain-1', {
      discordUsername: 'fegoo',
    });

    expect(result.discordUsername).toBe('fegoo');
  });

  it('does not allow non-captains through the Captain service', async () => {
    await expect(service.getProfile('organizer-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects invalid phone numbers in the request DTO', async () => {
    const dto = plainToInstance(UpdateCaptainProfileDto, {
      phoneNumber: '01001234567',
    });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'phoneNumber',
        }),
      ]),
    );
  });

  it('normalizes empty Discord usernames to null in the request DTO', async () => {
    const dto = plainToInstance(UpdateCaptainProfileDto, {
      discordUsername: '   ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.discordUsername).toBeNull();
  });

  it('creates one active team for the authenticated Captain', async () => {
    const result = await service.createTeam('captain-1', {
      name: 'Cairo Titans',
      description: 'Competitive Valorant roster',
      gameKey: 'valorant',
      region: 'MENA',
      logoUrl: 'https://cdn.clutcha.gg/logo.png',
      coverUrl: 'https://cdn.clutcha.gg/cover.png',
      discordServerUrl: 'https://discord.gg/cairo-titans',
    });

    expect(result).toMatchObject({
      name: 'Cairo Titans',
      slug: 'cairo-titans',
      description: 'Competitive Valorant roster',
      gameKey: 'valorant',
      region: 'MENA',
      logoUrl: 'https://cdn.clutcha.gg/logo.png',
      coverUrl: 'https://cdn.clutcha.gg/cover.png',
      discordServerUrl: 'https://discord.gg/cairo-titans',
      status: TeamStatus.ACTIVE,
      captainId: 'captain-1',
    });
  });

  it('uses the authenticated user ID as captainId and ignores submitted ownership fields', async () => {
    await service.createTeam('captain-1', {
      name: 'JWT Owned Team',
      gameKey: 'valorant',
      captainId: 'attacker-captain',
      userId: 'attacker-user',
      status: TeamStatus.SUSPENDED,
    } as never);

    const createArgs = teamCreate.mock.calls.at(0)?.[0];

    expect(createArgs?.data.captainId).toBe('captain-1');
    expect(createArgs?.data.status).toBe(TeamStatus.ACTIVE);
  });

  it('returns the authenticated Captain team', async () => {
    teams.push(
      createTeamRecord({
        id: 'team-1',
        name: 'Captain One Team',
        captainId: 'captain-1',
      }),
      createTeamRecord({
        id: 'team-2',
        name: 'Other Captain Team',
        captainId: 'captain-2',
      }),
    );

    const result = await service.getTeam('captain-1');

    expect(result.id).toBe('team-1');
    expect(result.captainId).toBe('captain-1');
  });

  it('returns 404 when the authenticated Captain has no team', async () => {
    await expect(service.getTeam('captain-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 409 when the Captain already owns a team', async () => {
    teams.push(createTeamRecord({ captainId: 'captain-1' }));

    await expect(
      service.createTeam('captain-1', {
        name: 'Second Team',
        gameKey: 'valorant',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks concurrent duplicate team creation through the unique constraint', async () => {
    teamFindUnique.mockResolvedValueOnce(null);
    teamCreate.mockImplementationOnce(() => {
      throw createPrismaKnownRequestError('P2002', ['captainId']);
    });

    await expect(
      service.createTeam('captain-1', {
        name: 'Race Team',
        gameKey: 'valorant',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

const createUserRecord = (
  overrides: Partial<CaptainUserRecord> = {},
): CaptainUserRecord => ({
  id: 'captain-1',
  email: 'captain@example.com',
  displayName: 'Captain One',
  phoneNumber: null,
  discordUsername: null,
  role: UserRole.CAPTAIN,
  status: UserStatus.ACTIVE,
  passwordHash: 'hashed-password',
  emailVerifiedAt: null,
  createdAt: new Date('2026-08-03T12:00:00.000Z'),
  ...overrides,
});

const createTeamRecord = (
  overrides: Partial<CaptainTeamRecord> = {},
): CaptainTeamRecord => ({
  id: 'team-1',
  name: 'Cairo Titans',
  slug: 'cairo-titans',
  description: null,
  gameKey: 'valorant',
  region: null,
  logoUrl: null,
  coverUrl: null,
  discordServerUrl: null,
  status: TeamStatus.ACTIVE,
  captainId: 'captain-1',
  createdAt: new Date('2026-08-03T12:00:00.000Z'),
  updatedAt: new Date('2026-08-03T12:00:00.000Z'),
  ...overrides,
});
