import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole, UserStatus } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { CaptainsService } from './captains.service';
import { UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';

jest.mock('@clutcha/database', () => ({
  Prisma: {},
  UserRole: {
    CAPTAIN: 'CAPTAIN',
    ORGANIZER: 'ORGANIZER',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
}));

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

describe('CaptainsService', () => {
  let service: CaptainsService;
  let users: CaptainUserRecord[];
  let findFirst: jest.Mock<
    Promise<CaptainUserRecord | null>,
    [UserFindFirstArgs]
  >;
  let update: jest.Mock<Promise<CaptainUserRecord>, [UserUpdateArgs]>;

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

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaptainsService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              user: {
                findFirst,
                update,
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
