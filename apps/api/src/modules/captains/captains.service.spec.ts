import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  EligibilityStatus,
  Prisma,
  RosterType,
  TeamStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { CaptainsService } from './captains.service';
import { CreateRosterPlayerDto } from './dto/create-roster-player.dto';
import { UpdateCaptainTeamDto } from './dto/update-captain-team.dto';
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
    RosterType: {
      STARTER: 'STARTER',
      SUBSTITUTE: 'SUBSTITUTE',
    },
    VerificationStatus: {
      UNVERIFIED: 'UNVERIFIED',
    },
    EligibilityStatus: {
      PENDING_REVIEW: 'PENDING_REVIEW',
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

type TeamUpdateArgs = {
  where: {
    captainId: string;
  };
  data: Partial<{
    name: string;
    description: string | null;
    gameKey: string;
    region: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    discordServerUrl: string | null;
    captainId: string;
  }>;
};

type RosterPlayerRecord = {
  id: string;
  gamerTag: string;
  realName: string | null;
  gameAccountId: string;
  phoneNumber: string;
  email: string | null;
  discordUsername: string | null;
  rank: string | null;
  country: string | null;
  rosterType: RosterType;
  verificationStatus: VerificationStatus;
  eligibilityStatus: EligibilityStatus;
  teamId: string;
  captainUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RosterPlayerFindManyArgs = {
  where: { teamId: string };
  select?: unknown;
  orderBy?: unknown;
};

type RosterPlayerFindFirstArgs = {
  where: {
    id: string;
    teamId: string;
  };
};

type RosterPlayerCreateArgs = {
  data: {
    gamerTag: string;
    realName?: string | null;
    gameAccountId: string;
    phoneNumber: string;
    email?: string | null;
    discordUsername?: string | null;
    rank?: string | null;
    country?: string | null;
    rosterType?: RosterType;
    teamId: string;
    captainUserId?: string;
  };
};

type RosterPlayerUpdateArgs = {
  where: { id: string };
  data: Partial<{
    gamerTag: string;
    realName: string | null;
    gameAccountId: string;
    phoneNumber: string;
    email: string | null;
    discordUsername: string | null;
    rank: string | null;
    country: string | null;
    rosterType: RosterType;
  }>;
};

type RosterPlayerDeleteArgs = {
  where: { id: string };
};

type TeamTransactionClient = {
  team: {
    findUnique: (
      args: TeamFindUniqueArgs,
    ) => Promise<CaptainTeamRecord | { id: string } | null>;
    create: (args: TeamCreateArgs) => Promise<CaptainTeamRecord>;
  };
  rosterPlayer: {
    create: (args: RosterPlayerCreateArgs) => Promise<RosterPlayerRecord>;
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
  let rosterPlayers: RosterPlayerRecord[];
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
  let teamUpdate: jest.Mock<Promise<CaptainTeamRecord>, [TeamUpdateArgs]>;
  let rosterPlayerFindMany: jest.Mock<
    Promise<RosterPlayerRecord[]>,
    [RosterPlayerFindManyArgs]
  >;
  let rosterPlayerFindFirst: jest.Mock<
    Promise<RosterPlayerRecord | null>,
    [RosterPlayerFindFirstArgs]
  >;
  let rosterPlayerCreate: jest.Mock<
    Promise<RosterPlayerRecord>,
    [RosterPlayerCreateArgs]
  >;
  let rosterPlayerUpdate: jest.Mock<
    Promise<RosterPlayerRecord>,
    [RosterPlayerUpdateArgs]
  >;
  let rosterPlayerDelete: jest.Mock<
    Promise<RosterPlayerRecord>,
    [RosterPlayerDeleteArgs]
  >;

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
    rosterPlayers = [];

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
    teamUpdate = jest.fn((args: TeamUpdateArgs) => {
      const team = teams.find(
        (item) => item.captainId === args.where.captainId,
      );

      if (!team) {
        throw new Error('Team not found in fake database.');
      }

      Object.assign(team, args.data, {
        updatedAt: new Date('2026-08-03T13:00:00.000Z'),
      });

      return Promise.resolve(team);
    });
    rosterPlayerFindMany = jest.fn((args: RosterPlayerFindManyArgs) =>
      Promise.resolve(
        rosterPlayers.filter((player) => player.teamId === args.where.teamId),
      ),
    );
    rosterPlayerFindFirst = jest.fn((args: RosterPlayerFindFirstArgs) =>
      Promise.resolve(
        rosterPlayers.find(
          (player) =>
            player.id === args.where.id && player.teamId === args.where.teamId,
        ) ?? null,
      ),
    );
    rosterPlayerCreate = jest.fn((args: RosterPlayerCreateArgs) => {
      if (
        args.data.captainUserId &&
        rosterPlayers.some(
          (player) => player.captainUserId === args.data.captainUserId,
        )
      ) {
        throw createPrismaKnownRequestError('P2002', ['captain_user_id']);
      }

      if (
        rosterPlayers.some(
          (player) =>
            player.teamId === args.data.teamId &&
            player.gameAccountId === args.data.gameAccountId,
        )
      ) {
        throw createPrismaKnownRequestError('P2002', [
          'teamId',
          'gameAccountId',
        ]);
      }

      const player = createRosterPlayerRecord({
        id: `player-${rosterPlayers.length + 1}`,
        gamerTag: args.data.gamerTag,
        realName: args.data.realName ?? null,
        gameAccountId: args.data.gameAccountId,
        phoneNumber: args.data.phoneNumber,
        email: args.data.email ?? null,
        discordUsername: args.data.discordUsername ?? null,
        rank: args.data.rank ?? null,
        country: args.data.country ?? null,
        rosterType: args.data.rosterType ?? RosterType.STARTER,
        teamId: args.data.teamId,
        captainUserId: args.data.captainUserId ?? null,
      });

      rosterPlayers.push(player);

      return Promise.resolve(player);
    });
    rosterPlayerUpdate = jest.fn((args: RosterPlayerUpdateArgs) => {
      const player = rosterPlayers.find((item) => item.id === args.where.id);

      if (!player) {
        throw new Error('Roster player not found in fake database.');
      }

      if (
        args.data.gameAccountId &&
        rosterPlayers.some(
          (item) =>
            item.id !== player.id &&
            item.teamId === player.teamId &&
            item.gameAccountId === args.data.gameAccountId,
        )
      ) {
        throw createPrismaKnownRequestError('P2002', [
          'teamId',
          'gameAccountId',
        ]);
      }

      Object.assign(player, args.data, {
        updatedAt: new Date('2026-08-04T13:00:00.000Z'),
      });

      return Promise.resolve(player);
    });
    rosterPlayerDelete = jest.fn((args: RosterPlayerDeleteArgs) => {
      const playerIndex = rosterPlayers.findIndex(
        (player) => player.id === args.where.id,
      );

      if (playerIndex < 0) {
        throw new Error('Roster player not found in fake database.');
      }

      const [player] = rosterPlayers.splice(playerIndex, 1);

      return Promise.resolve(player);
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
                  rosterPlayer: {
                    create: rosterPlayerCreate,
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
                update: teamUpdate,
              },
              rosterPlayer: {
                findMany: rosterPlayerFindMany,
                findFirst: rosterPlayerFindFirst,
                create: rosterPlayerCreate,
                update: rosterPlayerUpdate,
                delete: rosterPlayerDelete,
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
    users[0].phoneNumber = '+201001234567';
    const result = await service.createTeam('captain-1', {
      name: 'Cairo Titans',
      description: 'Competitive Valorant roster',
      gameKey: 'valorant',
      region: 'MENA',
      logoUrl: 'https://cdn.clutcha.gg/logo.png',
      coverUrl: 'https://cdn.clutcha.gg/cover.png',
      discordServerUrl: 'https://discord.gg/cairo-titans',
      captainRosterPlayer: {
        gamerTag: 'CaptainOne',
        gameAccountId: 'CAPTAIN#0001',
        rank: 'Immortal 2',
        country: 'EG',
        rosterType: RosterType.STARTER,
      },
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
    expect(rosterPlayers).toEqual([
      expect.objectContaining({
        gamerTag: 'CaptainOne',
        realName: 'Captain One',
        gameAccountId: 'CAPTAIN#0001',
        phoneNumber: '+201001234567',
        email: 'captain@example.com',
        captainUserId: 'captain-1',
        teamId: result.id,
      }),
    ]);
  });

  it('uses the authenticated user ID as captainId and ignores submitted ownership fields', async () => {
    users[0].phoneNumber = '+201001234567';
    await service.createTeam('captain-1', {
      name: 'JWT Owned Team',
      gameKey: 'valorant',
      captainId: 'attacker-captain',
      userId: 'attacker-user',
      status: TeamStatus.SUSPENDED,
      captainRosterPlayer: {
        gamerTag: 'CaptainOne',
        gameAccountId: 'CAPTAIN#0001',
      },
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
    users[0].phoneNumber = '+201001234567';
    teams.push(createTeamRecord({ captainId: 'captain-1' }));

    await expect(
      service.createTeam('captain-1', {
        name: 'Second Team',
        gameKey: 'valorant',
        captainRosterPlayer: {
          gamerTag: 'CaptainOne',
          gameAccountId: 'CAPTAIN#0001',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks concurrent duplicate team creation through the unique constraint', async () => {
    users[0].phoneNumber = '+201001234567';
    teamFindUnique.mockResolvedValueOnce(null);
    teamCreate.mockImplementationOnce(() => {
      throw createPrismaKnownRequestError('P2002', ['captainId']);
    });

    await expect(
      service.createTeam('captain-1', {
        name: 'Race Team',
        gameKey: 'valorant',
        captainRosterPlayer: {
          gamerTag: 'CaptainOne',
          gameAccountId: 'CAPTAIN#0001',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates the authenticated Captain team profile', async () => {
    teams.push(createTeamRecord({ captainId: 'captain-1' }));

    const result = await service.updateTeam('captain-1', {
      name: 'Updated Cairo Titans',
      description: 'Updated private team profile',
      gameKey: 'valorant',
      region: 'EG',
      logoUrl: 'https://cdn.clutcha.gg/updated-logo.png',
      coverUrl: 'https://cdn.clutcha.gg/updated-cover.png',
      discordServerUrl: 'https://discord.gg/updated-cairo-titans',
    });

    expect(result).toMatchObject({
      name: 'Updated Cairo Titans',
      description: 'Updated private team profile',
      gameKey: 'valorant',
      region: 'EG',
      logoUrl: 'https://cdn.clutcha.gg/updated-logo.png',
      coverUrl: 'https://cdn.clutcha.gg/updated-cover.png',
      discordServerUrl: 'https://discord.gg/updated-cairo-titans',
      captainId: 'captain-1',
    });
  });

  it('does not allow team ownership to be changed during update', async () => {
    teams.push(createTeamRecord({ captainId: 'captain-1' }));

    await service.updateTeam('captain-1', {
      name: 'Ownership Safe Team',
      captainId: 'attacker-captain',
    } as never);

    const updateArgs = teamUpdate.mock.calls.at(0)?.[0];

    expect(updateArgs?.where).toEqual({ captainId: 'captain-1' });
    expect(updateArgs?.data).not.toHaveProperty('captainId');
  });

  it('returns 404 when updating before the Captain has a team', async () => {
    await expect(
      service.updateTeam('captain-1', {
        name: 'Missing Team',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not update another Captain's team", async () => {
    teams.push(createTeamRecord({ captainId: 'captain-2' }));

    await expect(
      service.updateTeam('captain-1', {
        name: 'Attempted Takeover',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(teams.at(0)?.name).toBe('Cairo Titans');
  });

  it('rejects invalid team Discord server URLs in the request DTO', async () => {
    const dto = plainToInstance(UpdateCaptainTeamDto, {
      discordServerUrl: 'http://discord.gg/not-https',
    });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'discordServerUrl',
        }),
      ]),
    );
  });

  it('normalizes empty optional team fields to null in the update DTO', async () => {
    const dto = plainToInstance(UpdateCaptainTeamDto, {
      discordServerUrl: '   ',
      description: '',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.discordServerUrl).toBeNull();
    expect(dto.description).toBeNull();
  });

  it('adds a roster player with required phone number and private contacts', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));

    const result = await service.createRosterPlayer('captain-1', {
      gamerTag: 'Fegoo',
      realName: 'Ahmed Farghaly',
      gameAccountId: 'VALORANT#1234',
      phoneNumber: '+201001234567',
      email: 'player@example.com',
      discordUsername: 'fegoo',
      rank: 'Immortal 2',
      country: 'EG',
      rosterType: RosterType.STARTER,
    });

    expect(result).toMatchObject({
      gamerTag: 'Fegoo',
      realName: 'Ahmed Farghaly',
      gameAccountId: 'VALORANT#1234',
      phoneNumber: '+201001234567',
      email: 'player@example.com',
      discordUsername: 'fegoo',
      rosterType: RosterType.STARTER,
      verificationStatus: VerificationStatus.UNVERIFIED,
      eligibilityStatus: EligibilityStatus.PENDING_REVIEW,
      teamId: 'team-1',
    });
  });

  it('backfills the Captain roster member from profile contact data', async () => {
    users[0].phoneNumber = '+201001234567';
    users[0].discordUsername = 'captain-discord';
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));

    const result = await service.createCaptainRosterPlayer('captain-1', {
      gamerTag: 'CaptainOne',
      gameAccountId: 'CAPTAIN#0001',
      rank: 'Immortal 2',
      country: 'EG',
      rosterType: RosterType.STARTER,
    });

    expect(result).toMatchObject({
      gamerTag: 'CaptainOne',
      realName: 'Captain One',
      gameAccountId: 'CAPTAIN#0001',
      phoneNumber: '+201001234567',
      email: 'captain@example.com',
      discordUsername: 'captain-discord',
      isCaptain: true,
    });
  });

  it('rejects a duplicate Captain roster member', async () => {
    users[0].phoneNumber = '+201001234567';
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(
      createRosterPlayerRecord({
        id: 'captain-player',
        captainUserId: 'captain-1',
      }),
    );

    await expect(
      service.createCaptainRosterPlayer('captain-1', {
        gamerTag: 'CaptainAgain',
        gameAccountId: 'CAPTAIN#0002',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing roster-player phone number in the request DTO', async () => {
    const dto = plainToInstance(CreateRosterPlayerDto, {
      gamerTag: 'Fegoo',
      gameAccountId: 'VALORANT#1234',
    });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'phoneNumber',
        }),
      ]),
    );
  });

  it('normalizes optional roster-player email and Discord username', async () => {
    const dto = plainToInstance(CreateRosterPlayerDto, {
      gamerTag: 'Fegoo',
      gameAccountId: 'VALORANT#1234',
      phoneNumber: '+201001234567',
      email: ' PLAYER@EXAMPLE.COM ',
      discordUsername: '  fegoo  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('player@example.com');
    expect(dto.discordUsername).toBe('fegoo');
  });

  it('lists, reads, updates, and deletes roster players for the authenticated Captain team', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(createRosterPlayerRecord({ id: 'player-1' }));

    await expect(service.listRosterPlayers('captain-1')).resolves.toHaveLength(
      1,
    );
    await expect(
      service.getRosterPlayer('captain-1', 'player-1'),
    ).resolves.toMatchObject({ id: 'player-1' });

    const updated = await service.updateRosterPlayer('captain-1', 'player-1', {
      gamerTag: 'UpdatedFegoo',
      rosterType: RosterType.SUBSTITUTE,
      email: null,
      discordUsername: 'updated-fegoo',
    });

    expect(updated).toMatchObject({
      gamerTag: 'UpdatedFegoo',
      rosterType: RosterType.SUBSTITUTE,
      email: null,
      discordUsername: 'updated-fegoo',
    });

    const deleted = await service.deleteRosterPlayer('captain-1', 'player-1');

    expect(deleted.id).toBe('player-1');
    expect(rosterPlayers).toHaveLength(0);
  });

  it('does not allow another Captain to access a roster player outside their team', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(
      createRosterPlayerRecord({ id: 'player-2', teamId: 'other-team' }),
    );

    await expect(
      service.getRosterPlayer('captain-1', 'player-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not allow the Captain roster member to be removed', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(
      createRosterPlayerRecord({
        id: 'captain-player',
        captainUserId: 'captain-1',
      }),
    );

    await expect(
      service.deleteRosterPlayer('captain-1', 'captain-player'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(rosterPlayers).toHaveLength(1);
  });

  it('returns 409 for duplicate game account IDs on the same team', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(
      createRosterPlayerRecord({
        id: 'player-1',
        teamId: 'team-1',
        gameAccountId: 'VALORANT#1234',
      }),
    );

    await expect(
      service.createRosterPlayer('captain-1', {
        gamerTag: 'Duplicate',
        gameAccountId: 'VALORANT#1234',
        phoneNumber: '+201009876543',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not create a User account for roster players', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));

    await service.createRosterPlayer('captain-1', {
      gamerTag: 'NoLoginPlayer',
      gameAccountId: 'NOLOGIN#1234',
      phoneNumber: '+201001234567',
    });

    expect(users).toHaveLength(2);
  });

  it('does not expose legacy playerRole on roster-player responses', async () => {
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(createRosterPlayerRecord({ id: 'player-1' }));

    const result = await service.getRosterPlayer('captain-1', 'player-1');

    expect(result).not.toHaveProperty('playerRole');
  });

  it('returns dashboard with team null before team creation', async () => {
    const result = await service.getDashboard('captain-1');

    expect(result).toMatchObject({
      profile: {
        id: 'captain-1',
        displayName: 'Captain One',
        profileComplete: false,
      },
      team: null,
      roster: null,
      activeTournamentRegistrations: null,
      upcomingTournament: null,
      upcomingMatch: null,
      actionRequired: 'CREATE_TEAM',
    });
    expect(result.requiredActions).toEqual(['CREATE_TEAM', 'COMPLETE_PROFILE']);
  });

  it('returns dashboard for exactly the authenticated Captain team with roster counts', async () => {
    users[0].phoneNumber = '+201001234567';
    teams.push(
      createTeamRecord({ id: 'team-1', captainId: 'captain-1' }),
      createTeamRecord({
        id: 'team-2',
        name: 'Other Team',
        captainId: 'captain-2',
      }),
    );
    rosterPlayers.push(
      createRosterPlayerRecord({
        id: 'player-1',
        teamId: 'team-1',
        rosterType: RosterType.STARTER,
      }),
      createRosterPlayerRecord({
        id: 'player-2',
        teamId: 'team-1',
        rosterType: RosterType.STARTER,
      }),
      createRosterPlayerRecord({
        id: 'player-3',
        teamId: 'team-1',
        rosterType: RosterType.SUBSTITUTE,
      }),
      createRosterPlayerRecord({
        id: 'player-4',
        teamId: 'team-2',
        rosterType: RosterType.STARTER,
      }),
    );

    const result = await service.getDashboard('captain-1');

    expect(result.team).toMatchObject({
      id: 'team-1',
      name: 'Cairo Titans',
    });
    expect(result.roster).toEqual({
      totalCount: 3,
      starterCount: 2,
      substituteCount: 1,
    });
    expect(result.requiredActions).toEqual(['NONE']);
  });

  it('asks for roster players when the Captain has a team but no roster', async () => {
    users[0].phoneNumber = '+201001234567';
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));

    const result = await service.getDashboard('captain-1');

    expect(result.roster).toEqual({
      totalCount: 0,
      starterCount: 0,
      substituteCount: 0,
    });
    expect(result.actionRequired).toBe('ADD_ROSTER_PLAYERS');
  });

  it('does not expose Captain or roster-player contacts on dashboard', async () => {
    users[0].phoneNumber = '+201001234567';
    users[0].discordUsername = 'captain-discord';
    teams.push(createTeamRecord({ id: 'team-1', captainId: 'captain-1' }));
    rosterPlayers.push(
      createRosterPlayerRecord({
        id: 'player-1',
        phoneNumber: '+201009999999',
        email: 'player@example.com',
        discordUsername: 'player-discord',
      }),
    );

    const result = await service.getDashboard('captain-1');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('captain@example.com');
    expect(serialized).not.toContain('+201001234567');
    expect(serialized).not.toContain('captain-discord');
    expect(serialized).not.toContain('+201009999999');
    expect(serialized).not.toContain('player@example.com');
    expect(serialized).not.toContain('player-discord');
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

const createRosterPlayerRecord = (
  overrides: Partial<RosterPlayerRecord> = {},
): RosterPlayerRecord => ({
  id: 'player-1',
  gamerTag: 'Fegoo',
  realName: null,
  gameAccountId: 'VALORANT#1234',
  phoneNumber: '+201001234567',
  email: null,
  discordUsername: null,
  rank: null,
  country: null,
  rosterType: RosterType.STARTER,
  verificationStatus: VerificationStatus.UNVERIFIED,
  eligibilityStatus: EligibilityStatus.PENDING_REVIEW,
  teamId: 'team-1',
  captainUserId: null,
  createdAt: new Date('2026-08-04T12:00:00.000Z'),
  updatedAt: new Date('2026-08-04T12:00:00.000Z'),
  ...overrides,
});
