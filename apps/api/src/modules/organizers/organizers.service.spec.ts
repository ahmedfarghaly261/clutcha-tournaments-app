import { Test } from '@nestjs/testing';
import {
  TournamentMode,
  TournamentStatus,
  UserRole,
  UserStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { OrganizerProfileImageStorageService } from './organizer-profile-image-storage.service';
import { OrganizersService } from './organizers.service';

jest.mock('@clutcha/database', () => ({
  UserRole: {
    ORGANIZER: 'ORGANIZER',
    CAPTAIN: 'CAPTAIN',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
    CHECK_IN_OPEN: 'CHECK_IN_OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'CANCELLED',
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
  let tournamentCount: jest.Mock;
  let findManyTournaments: jest.Mock;

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
    tournamentCount = jest.fn().mockResolvedValue(0);
    findManyTournaments = jest.fn().mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizersService,
        {
          provide: DatabaseService,
          useValue: {
            client: {
              $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
                Promise.all(operations),
              ),
              organizerProfile: {
                upsert,
              },
              tournament: {
                count: tournamentCount,
                findMany: findManyTournaments,
              },
            },
          },
        },
        {
          provide: OrganizerProfileImageStorageService,
          useValue: { saveProfileImage: jest.fn() },
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

  it('returns organizer-owned tournament dashboard statistics', async () => {
    tournamentCount
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    const recentTournament = {
      id: 'tournament-1',
      name: 'Cairo Cup',
      slug: 'cairo-cup',
      gameKey: 'valorant',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.REGISTRATION_OPEN,
      coverUrl: null,
      startsAt: new Date('2026-09-12T16:00:00.000Z'),
      updatedAt: new Date('2026-08-14T10:00:00.000Z'),
    };
    findManyTournaments.mockResolvedValue([recentTournament]);

    await expect(service.getDashboard('organizer-user-1')).resolves.toEqual({
      summary: {
        totalTournaments: 8,
        draftTournaments: 2,
        publishedTournaments: 1,
        registrationOpenTournaments: 2,
        upcomingTournaments: 3,
        liveTournaments: 1,
        completedTournaments: 1,
        cancelledTournaments: 1,
      },
      recentTournaments: [recentTournament],
    });
    expect(tournamentCount).toHaveBeenCalledWith({
      where: { organizerId: 'organizer-user-1' },
    });
    expect(findManyTournaments).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizerId: 'organizer-user-1' },
        take: 5,
      }),
    );
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
