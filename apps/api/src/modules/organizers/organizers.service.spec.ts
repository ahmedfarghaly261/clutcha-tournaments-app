import { Test } from '@nestjs/testing';
import { UserRole, UserStatus } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { OrganizersService } from './organizers.service';

jest.mock('@clutcha/database', () => ({
  UserRole: {
    ORGANIZER: 'ORGANIZER',
    CAPTAIN: 'CAPTAIN',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
}));

type ProfileRecord = {
  id: string;
  userId: string;
  organizationName: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  supportPhone: string | null;
  country: string | null;
  city: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  discordUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
  };
};

describe('OrganizersService', () => {
  let service: OrganizersService;
  let profile: ProfileRecord | null;
  let upsert: jest.Mock;

  beforeEach(async () => {
    profile = null;
    upsert = jest.fn(
      ({
        create,
        update,
      }: {
        create: { userId: string } & Partial<ProfileRecord>;
        update: Partial<ProfileRecord>;
      }) => {
        if (!profile) {
          profile = createProfile(create.userId, create);
        } else {
          profile = {
            ...profile,
            ...update,
            updatedAt: new Date('2026-07-30T12:30:00.000Z'),
          };
        }

        return Promise.resolve(profile);
      },
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizersService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              organizerProfile: {
                upsert,
              },
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(OrganizersService);
  });

  it('creates an empty organizer profile lazily when reading', async () => {
    const result = await service.getProfile('organizer-user-1');

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'organizer-user-1' },
        create: { userId: 'organizer-user-1' },
        update: {},
      }),
    );
    expect(result.userId).toBe('organizer-user-1');
    expect(result.organizationName).toBeNull();
  });

  it('updates organizer profile fields', async () => {
    await service.getProfile('organizer-user-1');

    const result = await service.updateProfile('organizer-user-1', {
      organizationName: 'CLUTCHA Arena Cairo',
      contactEmail: 'support@example.com',
      websiteUrl: 'https://example.com',
      city: 'Cairo',
    });

    expect(result.organizationName).toBe('CLUTCHA Arena Cairo');
    expect(result.contactEmail).toBe('support@example.com');
    expect(result.websiteUrl).toBe('https://example.com');
    expect(result.city).toBe('Cairo');
  });

  it('returns only safe user fields with the profile', async () => {
    const result = await service.getProfile('organizer-user-1');
    const serialized = JSON.stringify(result);

    expect(result.user).toEqual({
      id: 'organizer-user-1',
      email: 'organizer@example.com',
      displayName: 'Organizer One',
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
    });
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('authSessions');
    expect(serialized).not.toContain('refreshTokenHash');
  });
});

const createProfile = (
  userId: string,
  overrides: Partial<ProfileRecord>,
): ProfileRecord => ({
  id: 'profile-1',
  userId,
  organizationName: null,
  logoUrl: null,
  coverUrl: null,
  description: null,
  contactEmail: null,
  supportPhone: null,
  country: null,
  city: null,
  websiteUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  discordUrl: null,
  createdAt: new Date('2026-07-30T12:00:00.000Z'),
  updatedAt: new Date('2026-07-30T12:00:00.000Z'),
  user: {
    id: userId,
    email: 'organizer@example.com',
    displayName: 'Organizer One',
    role: UserRole.ORGANIZER,
    status: UserStatus.ACTIVE,
  },
  ...overrides,
});
