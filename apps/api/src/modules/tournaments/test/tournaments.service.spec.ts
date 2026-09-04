import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EligibilityStatus,
  GamingRoomPurpose,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentFormat,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentMatchDisputeStatus,
  TournamentMatchForfeitStatus,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
  UserRole,
  UserStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { type CreateTournamentDto } from '../dtos/create-tournament.dto';
import {
  CaptainRegistrationSortDirection,
  CaptainRegistrationSortBy,
  CaptainRegistrationTimeFilter,
} from '../dtos/list-captain-registrations-query.dto';
import {
  OrganizerTournamentSortBy,
  SortDirection,
} from '../dtos/list-organizer-tournaments-query.dto';
import { PublicTournamentSortBy } from '../dtos/list-public-tournaments-query.dto';
import {
  TournamentCoverImageStorageService,
  type TournamentCoverImageFile,
} from '../services/tournament-cover-image-storage.service';
import { TournamentPaymentProofStorageService } from '../services/tournament-payment-proof-storage.service';
import { TournamentsService } from '../services/tournaments.service';

jest.mock('@clutcha/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      meta?: unknown;

      constructor(message: string, options: { code: string; meta?: unknown }) {
        super(message);
        this.code = options.code;
        this.meta = options.meta;
      }
    },
  },
  RegistrationApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    AWAITING_PROOF: 'AWAITING_PROOF',
    PROOF_SUBMITTED: 'PROOF_SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
  },
  TournamentRegistrationStatus: {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    WAITLISTED: 'WAITLISTED',
    WITHDRAWN: 'WITHDRAWN',
    CHECKED_IN: 'CHECKED_IN',
    DISQUALIFIED: 'DISQUALIFIED',
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
  },
  TournamentMatchDisputeStatus: {
    NONE: 'NONE',
    OPEN: 'OPEN',
    RESOLVED: 'RESOLVED',
    REJECTED: 'REJECTED',
  },
  TournamentMatchForfeitStatus: {
    NONE: 'NONE',
    TEAM_A: 'TEAM_A',
    TEAM_B: 'TEAM_B',
    BOTH: 'BOTH',
  },
  TournamentMatchOfficialResultStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    OVERTURNED: 'OVERTURNED',
  },
  TournamentMatchStatus: {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    COMPLETED: 'COMPLETED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'CANCELLED',
    FORFEIT: 'FORFEIT',
  },
  EligibilityStatus: {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE: 'INELIGIBLE',
    PENDING_REVIEW: 'PENDING_REVIEW',
  },
  RosterType: {
    STARTER: 'STARTER',
    SUBSTITUTE: 'SUBSTITUTE',
  },
  TeamStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
  },
  GamingRoomPurpose: {
    COMPETITION: 'COMPETITION',
    PRACTICE: 'PRACTICE',
    WARMUP: 'WARMUP',
    STREAMING: 'STREAMING',
    ADMIN: 'ADMIN',
  },
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
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
    CHECK_IN_OPEN: 'CHECK_IN_OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'CANCELLED',
    ARCHIVED: 'ARCHIVED',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
    UNLISTED: 'UNLISTED',
    PRIVATE: 'PRIVATE',
  },
  UserRole: {
    CAPTAIN: 'CAPTAIN',
    ORGANIZER: 'ORGANIZER',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
}));

type TournamentCreateArgs = {
  data: Record<string, unknown>;
};

type TournamentFindUniqueArgs = {
  where: Partial<{
    id: string;
    slug: string;
  }>;
};

type TournamentFindManyArgs = {
  where: Record<string, unknown>;
  orderBy: Record<string, unknown>;
  skip: number;
  take: number;
};

type TournamentFindFirstArgs = {
  where: Record<string, unknown>;
};

type TournamentUpdateArgs = {
  where: { id: string };
  data: Record<string, unknown>;
};

type TournamentDeleteArgs = {
  where: { id: string };
};

type TournamentCountArgs = {
  where: Record<string, unknown>;
};

type TournamentRegistrationCountArgs = {
  where: {
    tournamentId?: string;
    teamId?: string;
    status?: {
      in?: string[];
    };
  };
};

type TournamentRegistrationCreateArgs = {
  data: Record<string, unknown>;
  select: Record<string, unknown>;
};

type TournamentRegistrationFindManyArgs = {
  where: Record<string, unknown>;
  orderBy: Record<string, unknown>;
  skip: number;
  take: number;
};

type TournamentRegistrationFindFirstArgs = {
  where: Partial<{
    id: string;
    captainId: string;
    tournamentId: string;
  }>;
};

type TournamentRegistrationUpdateArgs = {
  where: { id: string };
  data: Record<string, unknown>;
  select: Record<string, unknown>;
};

type TournamentMatchFindManyArgs = {
  where: TournamentMatchWhere;
  orderBy: Record<string, unknown>[];
  select: Record<string, unknown>;
};

type TournamentMatchFindFirstArgs = {
  where: TournamentMatchWhere & {
    id?: string;
  };
  select: Record<string, unknown>;
};

type TournamentMatchWhere = {
  id?: string;
  tournamentId?: string;
  OR?: Array<{
    teamAId?: string;
    teamBId?: string;
  }>;
};

type UserFindFirstArgs = {
  where: {
    id: string;
    role: UserRole;
  };
};

type TeamFindUniqueArgs = {
  where: {
    captainId: string;
  };
};

type OnlineConfigurationFindUniqueArgs = {
  where: { tournamentId: string };
};

type OnlineConfigurationUpsertArgs = {
  where: { tournamentId: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

type VenueFindUniqueArgs = {
  where: { tournamentId: string };
};

type VenueUpsertArgs = {
  where: { tournamentId: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

type GamingRoomCreateArgs = {
  data: Record<string, unknown>;
};

type GamingRoomFindManyArgs = {
  where: { venueId: string };
  orderBy: Record<string, unknown>;
};

type GamingRoomFindFirstArgs = {
  where: { id: string; venueId: string };
};

type GamingRoomUpdateArgs = {
  where: { id: string };
  data: Record<string, unknown>;
};

type GamingRoomDeleteArgs = {
  where: { id: string };
};

type TournamentValidationErrorResponse = {
  message: string;
  issues: Array<{ field: string; message: string }>;
};

let createdTournaments: Record<string, unknown>[];
let users: Record<string, unknown>[];
let teams: Record<string, unknown>[];
let onlineConfigurations: Record<string, unknown>[];
let venues: Record<string, unknown>[];
let gamingRooms: Record<string, unknown>[];
let tournamentRegistrations: Record<string, unknown>[];
let tournamentMatches: Record<string, unknown>[];

describe('TournamentsService', () => {
  let service: TournamentsService;
  let saveCoverImage: jest.Mock<
    Promise<string>,
    [string, TournamentCoverImageFile | undefined, string]
  >;
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
  let findFirst: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TournamentFindFirstArgs]
  >;
  let update: jest.Mock<
    Promise<Record<string, unknown>>,
    [TournamentUpdateArgs]
  >;
  let deleteTournament: jest.Mock<
    Promise<{ id: string }>,
    [TournamentDeleteArgs]
  >;
  let count: jest.Mock<Promise<number>, [TournamentCountArgs]>;
  let countTournamentRegistrations: jest.Mock<
    Promise<number>,
    [TournamentRegistrationCountArgs]
  >;
  let createTournamentRegistration: jest.Mock<
    Promise<Record<string, unknown>>,
    [TournamentRegistrationCreateArgs]
  >;
  let findManyTournamentRegistrations: jest.Mock<
    Promise<Record<string, unknown>[]>,
    [TournamentRegistrationFindManyArgs]
  >;
  let findFirstTournamentRegistration: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TournamentRegistrationFindFirstArgs]
  >;
  let updateTournamentRegistration: jest.Mock<
    Promise<Record<string, unknown>>,
    [TournamentRegistrationUpdateArgs]
  >;
  let findManyTournamentMatches: jest.Mock<
    Promise<Record<string, unknown>[]>,
    [TournamentMatchFindManyArgs]
  >;
  let findFirstTournamentMatch: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TournamentMatchFindFirstArgs]
  >;
  let findFirstUser: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [UserFindFirstArgs]
  >;
  let findUniqueTeam: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [TeamFindUniqueArgs]
  >;
  let findUniqueOnlineConfiguration: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [OnlineConfigurationFindUniqueArgs]
  >;
  let upsertOnlineConfiguration: jest.Mock<
    Promise<Record<string, unknown>>,
    [OnlineConfigurationUpsertArgs]
  >;
  let findUniqueVenue: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [VenueFindUniqueArgs]
  >;
  let upsertVenue: jest.Mock<
    Promise<Record<string, unknown>>,
    [VenueUpsertArgs]
  >;
  let createGamingRoom: jest.Mock<
    Promise<Record<string, unknown>>,
    [GamingRoomCreateArgs]
  >;
  let findManyGamingRooms: jest.Mock<
    Promise<Record<string, unknown>[]>,
    [GamingRoomFindManyArgs]
  >;
  let findFirstGamingRoom: jest.Mock<
    Promise<Record<string, unknown> | null>,
    [GamingRoomFindFirstArgs]
  >;
  let updateGamingRoom: jest.Mock<
    Promise<Record<string, unknown>>,
    [GamingRoomUpdateArgs]
  >;
  let deleteGamingRoom: jest.Mock<
    Promise<{ id: string }>,
    [GamingRoomDeleteArgs]
  >;

  beforeEach(async () => {
    saveCoverImage = jest
      .fn<
        Promise<string>,
        [string, TournamentCoverImageFile | undefined, string]
      >()
      .mockResolvedValue(
        'http://localhost:3000/uploads/tournaments/tournament-id/cover.png',
      );
    createdTournaments = [
      createTournamentRecord({
        id: 'tournament-1',
        organizerId: 'organizer-1',
        name: 'Alpha Valorant Cup',
        slug: 'alpha-valorant-cup',
        onlineConfiguration: createOnlineConfigurationRecord({
          id: 'online-config-1',
        }),
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
      createTournamentRecord({
        id: 'tournament-4',
        organizerId: 'organizer-1',
        name: 'On-site Cup',
        slug: 'on-site-cup',
        mode: TournamentMode.ONSITE,
        venue: createVenueRecord({
          id: 'venue-1',
          tournamentId: 'tournament-4',
          gamingRooms: [
            createGamingRoomRecord({
              venueId: 'venue-1',
            }),
          ],
        }),
      }),
    ];
    users = [
      createUserRecord({
        id: 'captain-1',
        role: UserRole.CAPTAIN,
        phoneNumber: '+201001234567',
      }),
      createUserRecord({
        id: 'captain-without-phone',
        role: UserRole.CAPTAIN,
        phoneNumber: null,
      }),
      createUserRecord({
        id: 'organizer-1',
        role: UserRole.ORGANIZER,
      }),
    ];
    teams = [
      createTeamRecord({
        id: 'team-1',
        captainId: 'captain-1',
        rosterPlayers: [
          createRosterPlayerRecord({
            id: 'starter-1',
            rosterType: RosterType.STARTER,
          }),
          createRosterPlayerRecord({
            id: 'starter-2',
            rosterType: RosterType.STARTER,
          }),
          createRosterPlayerRecord({
            id: 'starter-3',
            rosterType: RosterType.STARTER,
          }),
          createRosterPlayerRecord({
            id: 'starter-4',
            rosterType: RosterType.STARTER,
          }),
          createRosterPlayerRecord({
            id: 'starter-5',
            rosterType: RosterType.STARTER,
          }),
        ],
      }),
      createTeamRecord({
        id: 'team-without-phone-captain',
        captainId: 'captain-without-phone',
      }),
    ];
    onlineConfigurations = [
      createOnlineConfigurationRecord({
        tournamentId: 'tournament-1',
      }),
    ];
    venues = [
      createVenueRecord({
        tournamentId: 'tournament-4',
      }),
    ];
    gamingRooms = [
      createGamingRoomRecord({
        venueId: 'venue-1',
      }),
    ];
    tournamentRegistrations = [];
    tournamentMatches = [];
    findUnique = jest.fn((args: TournamentFindUniqueArgs) =>
      Promise.resolve(
        createdTournaments.find(
          (item) =>
            (args.where.slug && item.slug === args.where.slug) ||
            (args.where.id && item.id === args.where.id),
        ) ?? null,
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
    findFirst = jest.fn((args: TournamentFindFirstArgs) =>
      Promise.resolve(applyWhere(args.where).at(0) ?? null),
    );
    update = jest.fn((args: TournamentUpdateArgs) => {
      const tournament = createdTournaments.find(
        (item) => item.id === args.where.id,
      );

      if (!tournament) {
        throw new Error('Tournament not found in fake database.');
      }

      Object.entries(args.data).forEach(([key, value]) => {
        if (value !== undefined) {
          tournament[key] = value;
        }
      });
      tournament.updatedAt = new Date('2026-08-02T13:00:00.000Z');

      return Promise.resolve(tournament);
    });
    deleteTournament = jest.fn((args: TournamentDeleteArgs) => {
      createdTournaments = createdTournaments.filter(
        (item) => item.id !== args.where.id,
      );

      return Promise.resolve({ id: args.where.id });
    });
    count = jest.fn((args: TournamentCountArgs) =>
      Promise.resolve(applyWhere(args.where).length),
    );
    findFirstUser = jest.fn((args: UserFindFirstArgs) =>
      Promise.resolve(
        users.find(
          (user) => user.id === args.where.id && user.role === args.where.role,
        ) ?? null,
      ),
    );
    findUniqueTeam = jest.fn((args: TeamFindUniqueArgs) =>
      Promise.resolve(
        teams.find((team) => team.captainId === args.where.captainId) ?? null,
      ),
    );
    findUniqueOnlineConfiguration = jest.fn(
      (args: OnlineConfigurationFindUniqueArgs) =>
        Promise.resolve(
          onlineConfigurations.find(
            (item) => item.tournamentId === args.where.tournamentId,
          ) ?? null,
        ),
    );
    upsertOnlineConfiguration = jest.fn(
      (args: OnlineConfigurationUpsertArgs) => {
        const existing = onlineConfigurations.find(
          (item) => item.tournamentId === args.where.tournamentId,
        );
        const now = new Date('2026-08-02T13:30:00.000Z');

        if (existing) {
          Object.assign(existing, args.update, { updatedAt: now });
          return Promise.resolve(existing);
        }

        const created = createOnlineConfigurationRecord({
          ...args.create,
          id: `online-config-${onlineConfigurations.length + 1}`,
          createdAt: now,
          updatedAt: now,
        });
        onlineConfigurations.push(created);
        return Promise.resolve(created);
      },
    );
    findUniqueVenue = jest.fn((args: VenueFindUniqueArgs) =>
      Promise.resolve(
        venues.find((item) => item.tournamentId === args.where.tournamentId) ??
          null,
      ),
    );
    upsertVenue = jest.fn((args: VenueUpsertArgs) => {
      const existing = venues.find(
        (item) => item.tournamentId === args.where.tournamentId,
      );
      const now = new Date('2026-08-02T14:00:00.000Z');

      if (existing) {
        Object.assign(existing, args.update, { updatedAt: now });
        return Promise.resolve(existing);
      }

      const created = createVenueRecord({
        ...args.create,
        id: `venue-${venues.length + 1}`,
        createdAt: now,
        updatedAt: now,
      });
      venues.push(created);
      return Promise.resolve(created);
    });
    findManyGamingRooms = jest.fn((args: GamingRoomFindManyArgs) =>
      Promise.resolve(
        gamingRooms
          .filter((item) => item.venueId === args.where.venueId)
          .sort((left, right) => {
            const leftDate = left.createdAt;
            const rightDate = right.createdAt;

            if (leftDate instanceof Date && rightDate instanceof Date) {
              return leftDate.getTime() - rightDate.getTime();
            }

            return 0;
          }),
      ),
    );
    createGamingRoom = jest.fn((args: GamingRoomCreateArgs) => {
      const now = new Date('2026-08-02T14:30:00.000Z');
      const room = createGamingRoomRecord({
        ...args.data,
        id: `gaming-room-${gamingRooms.length + 1}`,
        createdAt: now,
        updatedAt: now,
      });
      gamingRooms.push(room);
      return Promise.resolve(room);
    });
    findFirstGamingRoom = jest.fn((args: GamingRoomFindFirstArgs) =>
      Promise.resolve(
        gamingRooms.find(
          (item) =>
            item.id === args.where.id && item.venueId === args.where.venueId,
        ) ?? null,
      ),
    );
    updateGamingRoom = jest.fn((args: GamingRoomUpdateArgs) => {
      const room = gamingRooms.find((item) => item.id === args.where.id);

      if (!room) {
        throw new Error('Gaming room not found in fake database.');
      }

      Object.entries(args.data).forEach(([key, value]) => {
        if (value !== undefined) {
          room[key] = value;
        }
      });
      room.updatedAt = new Date('2026-08-02T15:00:00.000Z');

      return Promise.resolve(room);
    });
    deleteGamingRoom = jest.fn((args: GamingRoomDeleteArgs) => {
      gamingRooms = gamingRooms.filter((item) => item.id !== args.where.id);

      return Promise.resolve({ id: args.where.id });
    });
    countTournamentRegistrations = jest.fn(
      (args: TournamentRegistrationCountArgs) =>
        Promise.resolve(filterTournamentRegistrations(args.where).length),
    );
    createTournamentRegistration = jest.fn(
      (args: TournamentRegistrationCreateArgs) => {
        const duplicate = tournamentRegistrations.find(
          (registration) =>
            registration.tournamentId === args.data.tournamentId &&
            registration.teamId === args.data.teamId,
        );

        if (duplicate) {
          throw new ConflictException(
            'Team is already registered for this tournament.',
          );
        }

        const tournament = createdTournaments.find(
          (item) => item.id === args.data.tournamentId,
        );
        const team = teams.find((item) => item.id === args.data.teamId);

        if (!tournament || !team) {
          throw new Error('Registration relation not found in fake database.');
        }

        const registration = {
          id: `registration-${tournamentRegistrations.length + 1}`,
          ...args.data,
          tournament,
          team,
          createdAt: new Date('2026-08-04T16:00:00.000Z'),
          updatedAt: new Date('2026-08-04T16:00:00.000Z'),
        };
        tournamentRegistrations.push(registration);
        return Promise.resolve(registration);
      },
    );
    findManyTournamentRegistrations = jest.fn(
      (args: TournamentRegistrationFindManyArgs) =>
        Promise.resolve(
          sortTournamentRegistrations(
            filterTournamentRegistrations(args.where),
            args.orderBy,
          ).slice(args.skip, args.skip + args.take),
        ),
    );
    findFirstTournamentRegistration = jest.fn(
      (args: TournamentRegistrationFindFirstArgs) =>
        Promise.resolve(
          tournamentRegistrations.find(
            (registration) =>
              (!args.where.id || registration.id === args.where.id) &&
              (!args.where.captainId ||
                registration.captainId === args.where.captainId) &&
              (!args.where.tournamentId ||
                registration.tournamentId === args.where.tournamentId),
          ) ?? null,
        ),
    );
    updateTournamentRegistration = jest.fn(
      (args: TournamentRegistrationUpdateArgs) => {
        const registration = tournamentRegistrations.find(
          (item) => item.id === args.where.id,
        );

        if (!registration) {
          throw new Error('Registration not found in fake database.');
        }

        Object.entries(args.data).forEach(([key, value]) => {
          if (value !== undefined) {
            registration[key] = value;
          }
        });
        registration.updatedAt = new Date('2026-08-05T12:00:00.000Z');

        return Promise.resolve(registration);
      },
    );
    findManyTournamentMatches = jest.fn((args: TournamentMatchFindManyArgs) =>
      Promise.resolve(
        filterTournamentMatches(args.where).sort(compareTournamentMatches),
      ),
    );
    findFirstTournamentMatch = jest.fn((args: TournamentMatchFindFirstArgs) =>
      Promise.resolve(
        filterTournamentMatches(args.where).find(
          (match) => !args.where.id || match.id === args.where.id,
        ) ?? null,
      ),
    );

    const tournamentClient = {
      findUnique,
      create,
      findMany,
      findFirst,
      update,
      delete: deleteTournament,
      count,
    };
    const tournamentRegistrationClient = {
      count: countTournamentRegistrations,
      create: createTournamentRegistration,
      findMany: findManyTournamentRegistrations,
      findFirst: findFirstTournamentRegistration,
      update: updateTournamentRegistration,
    };
    const tournamentMatchClient = {
      findMany: findManyTournamentMatches,
      findFirst: findFirstTournamentMatch,
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
                return callback({
                  tournament: tournamentClient,
                  tournamentRegistration: tournamentRegistrationClient,
                  tournamentMatch: tournamentMatchClient,
                  user: {
                    findFirst: findFirstUser,
                  },
                  team: {
                    findUnique: findUniqueTeam,
                  },
                });
              }),
              tournament: tournamentClient,
              tournamentRegistration: tournamentRegistrationClient,
              tournamentMatch: tournamentMatchClient,
              user: {
                findFirst: findFirstUser,
              },
              team: {
                findUnique: findUniqueTeam,
              },
              tournamentOnlineConfiguration: {
                findUnique: findUniqueOnlineConfiguration,
                upsert: upsertOnlineConfiguration,
              },
              tournamentVenue: {
                findUnique: findUniqueVenue,
                upsert: upsertVenue,
              },
              tournamentGamingRoom: {
                findMany: findManyGamingRooms,
                create: createGamingRoom,
                findFirst: findFirstGamingRoom,
                update: updateGamingRoom,
                delete: deleteGamingRoom,
              },
            },
          },
        },
        {
          provide: TournamentCoverImageStorageService,
          useValue: { saveCoverImage },
        },
        {
          provide: TournamentPaymentProofStorageService,
          useValue: {},
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

  const firstFindFirstArgs = (): TournamentFindFirstArgs => {
    const firstCall = findFirst.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournament.findFirst to be called.');
    }

    return firstCall[0];
  };

  const firstUpdateData = (): Record<string, unknown> => {
    const firstCall = update.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournament.update to be called.');
    }

    return firstCall[0].data;
  };

  const firstOnlineConfigurationUpsertArgs =
    (): OnlineConfigurationUpsertArgs => {
      const firstCall = upsertOnlineConfiguration.mock.calls.at(0);

      if (!firstCall) {
        throw new Error(
          'Expected tournamentOnlineConfiguration.upsert to be called.',
        );
      }

      return firstCall[0];
    };

  const firstVenueUpsertArgs = (): VenueUpsertArgs => {
    const firstCall = upsertVenue.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournamentVenue.upsert to be called.');
    }

    return firstCall[0];
  };

  const firstGamingRoomCreateData = (): Record<string, unknown> => {
    const firstCall = createGamingRoom.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournamentGamingRoom.create to be called.');
    }

    return firstCall[0].data;
  };

  const firstGamingRoomFindManyArgs = (): GamingRoomFindManyArgs => {
    const firstCall = findManyGamingRooms.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournamentGamingRoom.findMany to be called.');
    }

    return firstCall[0];
  };

  const firstGamingRoomUpdateData = (): Record<string, unknown> => {
    const firstCall = updateGamingRoom.mock.calls.at(0);

    if (!firstCall) {
      throw new Error('Expected tournamentGamingRoom.update to be called.');
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

  it('uploads and persists a cover image for an owned draft tournament', async () => {
    const file = {
      originalname: 'cover.png',
      mimetype: 'image/png',
      buffer: Buffer.from('cover'),
      size: 5,
    };

    const result = await service.uploadOrganizerTournamentCover(
      'organizer-1',
      'tournament-1',
      file,
      'http://localhost:3000',
    );

    expect(saveCoverImage).toHaveBeenCalledWith(
      'tournament-1',
      file,
      'http://localhost:3000',
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tournament-1' },
        data: {
          coverUrl:
            'http://localhost:3000/uploads/tournaments/tournament-id/cover.png',
        },
      }),
    );
    expect(result.coverUrl).toBe(
      'http://localhost:3000/uploads/tournaments/tournament-id/cover.png',
    );
  });

  it('lists only tournaments owned by the authenticated organizer', async () => {
    const result = await service.listOrganizerTournaments('organizer-1', {});

    expect(result.items).toHaveLength(3);
    expect(
      result.items.every((item) => item.organizerId === 'organizer-1'),
    ).toBe(true);
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 3,
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

  it('lists only discoverable public tournaments with safe summary fields', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        name: 'Private Published Cup',
        slug: 'private-published-cup',
        status: TournamentStatus.PUBLISHED,
        visibility: TournamentVisibility.PRIVATE,
      }),
      createTournamentRecord({
        id: 'tournament-6',
        organizerId: 'organizer-1',
        name: 'Open Registration Cup',
        slug: 'open-registration-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationOpenedAt: new Date('2026-08-03T12:00:00.000Z'),
      }),
      createTournamentRecord({
        id: 'tournament-7',
        organizerId: 'organizer-1',
        name: 'Cancelled Public Cup',
        slug: 'cancelled-public-cup',
        status: TournamentStatus.CANCELLED,
      }),
    );

    const result = await service.listPublicTournaments({});

    expect(result.items.map((item) => item.id)).toEqual([
      'tournament-2',
      'tournament-6',
    ]);
    expect(result.items[0]).not.toHaveProperty('organizerId');
    expect(result.items[0]).not.toHaveProperty('rules');
    expect(result.items[0]).not.toHaveProperty('visibility');
    expect(result.items[0]).not.toHaveProperty('cancellationReason');
    expect(result.items[0]).toMatchObject({
      slug: 'beta-valorant-cup',
      status: TournamentStatus.PUBLISHED,
    });
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('supports public tournament pagination, filters, search, and sorting', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        name: 'Apex Public Cup',
        slug: 'apex-public-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        gameKey: 'apex-legends',
        mode: TournamentMode.ONLINE,
        startsAt: new Date('2026-09-20T18:00:00.000Z'),
      }),
      createTournamentRecord({
        id: 'tournament-6',
        name: 'Apex On-site Cup',
        slug: 'apex-onsite-cup',
        status: TournamentStatus.PUBLISHED,
        gameKey: 'apex-legends',
        mode: TournamentMode.ONSITE,
        startsAt: new Date('2026-09-19T18:00:00.000Z'),
      }),
    );

    const result = await service.listPublicTournaments({
      page: 1,
      limit: 1,
      search: 'apex',
      status: TournamentStatus.REGISTRATION_OPEN,
      mode: TournamentMode.ONLINE,
      gameKey: 'apex-legends',
      sortBy: PublicTournamentSortBy.STARTS_AT,
      sortDirection: SortDirection.ASC,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('tournament-5');
    expect(result.meta).toEqual({
      page: 1,
      limit: 1,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(firstFindManyArgs()).toMatchObject({
      where: {
        visibility: TournamentVisibility.PUBLIC,
        status: TournamentStatus.REGISTRATION_OPEN,
        mode: TournamentMode.ONLINE,
        gameKey: 'apex-legends',
      },
      orderBy: { startsAt: 'asc' },
      skip: 0,
      take: 1,
    });
    expect(firstFindManyArgs().where).toHaveProperty('OR');
  });

  it('does not return draft tournaments when a non-public status is requested', async () => {
    const result = await service.listPublicTournaments({
      status: TournamentStatus.DRAFT,
    });

    expect(result.items).toHaveLength(0);
    expect(firstFindManyArgs().where).toMatchObject({
      visibility: TournamentVisibility.PUBLIC,
      status: { in: [] },
    });
  });

  it('returns public online tournament details without private online fields', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        name: 'Public Online Detail Cup',
        slug: 'public-online-detail-cup',
        status: TournamentStatus.PUBLISHED,
        onlineConfiguration: createOnlineConfigurationRecord({
          tournamentId: 'tournament-5',
          discordServerUrl: 'https://discord.gg/private',
          lobbyInstructions: 'Private lobby credentials.',
          privateSupportContact: 'private support',
        }),
      }),
    );

    const result = await service.getPublicTournamentDetails(
      'public-online-detail-cup',
    );

    expect(firstFindFirstArgs()).toMatchObject({
      where: {
        slug: 'public-online-detail-cup',
        visibility: TournamentVisibility.PUBLIC,
      },
    });
    expect(result.slug).toBe('public-online-detail-cup');
    expect(result.onlineConfiguration).toEqual({
      serverRegion: 'EU West',
      publicInstructions: 'Join the lobby 15 minutes before match time.',
      connectionRules: 'Use the assigned lobby.',
      evidenceRequired: true,
      screenshotRequirements: 'Upload final scoreboard screenshots.',
      resultSubmissionDeadlineMinutes: 30,
    });
    expect(result.venue).toBeNull();
    expect(result).not.toHaveProperty('organizerId');
    expect(result.onlineConfiguration).not.toHaveProperty('discordServerUrl');
    expect(result.onlineConfiguration).not.toHaveProperty('lobbyInstructions');
    expect(result.onlineConfiguration).not.toHaveProperty(
      'privateSupportContact',
    );
  });

  it('returns eligible when the Captain team satisfies available tournament checks', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'eligibility-open-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationOpensAt: new Date('2026-08-20T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-09-10T20:00:00.000Z'),
        allowedRegion: 'MENA',
        allowedCountries: ['EG'],
      }),
    );

    const result = await service.getCaptainTournamentEligibility(
      'captain-1',
      'eligibility-open-cup',
    );

    expect(result).toEqual({
      eligible: true,
      team: {
        id: 'team-1',
        name: 'Cairo Titans',
      },
      issues: [],
    });
  });

  it('returns structured eligibility issues for profile, tournament, team, and roster problems', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'eligibility-problem-cup',
        status: TournamentStatus.PUBLISHED,
        visibility: TournamentVisibility.PUBLIC,
        gameKey: 'apex-legends',
        minimumStarters: 5,
        maximumStarters: 5,
        maximumSubstitutes: 0,
        requiredGameAccountId: true,
        allowedRegion: 'EU',
        allowedCountries: ['DE'],
        minimumRank: 'Gold',
        registrationOpensAt: new Date('2026-08-01T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-08-02T20:00:00.000Z'),
      }),
    );
    teams = [
      createTeamRecord({
        id: 'team-with-issues',
        captainId: 'captain-without-phone',
        status: TeamStatus.SUSPENDED,
        gameKey: 'valorant',
        region: 'MENA',
        rosterPlayers: [
          createRosterPlayerRecord({
            id: 'starter-with-issues',
            gamerTag: 'Starter With Issues',
            gameAccountId: '',
            phoneNumber: '',
            country: 'EG',
            rank: null,
            rosterType: RosterType.STARTER,
            eligibilityStatus: EligibilityStatus.INELIGIBLE,
          }),
        ],
      }),
    ];

    const result = await service.getCaptainTournamentEligibility(
      'captain-without-phone',
      'eligibility-problem-cup',
    );

    expect(result.eligible).toBe(false);
    expect(result.team).toEqual({
      id: 'team-with-issues',
      name: 'Cairo Titans',
    });
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'CAPTAIN_PROFILE_INCOMPLETE',
        'TEAM_INACTIVE',
        'REGISTRATION_NOT_OPEN',
        'REGISTRATION_DEADLINE_PASSED',
        'GAME_MISMATCH',
        'INSUFFICIENT_STARTERS',
        'REGION_NOT_ALLOWED',
        'MISSING_GAME_ACCOUNT_ID',
        'MISSING_PLAYER_PHONE',
        'COUNTRY_NOT_ALLOWED',
        'RANK_NOT_ALLOWED',
        'PLAYER_INELIGIBLE',
      ]),
    );
  });

  it('returns 422 when the Captain has no team', async () => {
    users.push(
      createUserRecord({
        id: 'captain-without-team',
        role: UserRole.CAPTAIN,
      }),
    );

    await expect(
      service.getCaptainTournamentEligibility(
        'captain-without-team',
        'tournament-1',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('returns 404 when checking eligibility for a missing tournament', async () => {
    await expect(
      service.getCaptainTournamentEligibility('captain-1', 'missing-cup'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a free tournament registration with private snapshots', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'free-registration-cup',
        slug: 'free-registration-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationOpensAt: new Date('2026-08-20T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-09-10T20:00:00.000Z'),
        allowedRegion: 'MENA',
        allowedCountries: ['EG'],
        rulesVersion: '2.1',
      }),
    );

    const result = await service.createCaptainTournamentRegistration(
      'captain-1',
      'free-registration-cup',
      { acceptRules: true },
    );
    const createArgs = createTournamentRegistration.mock.calls[0][0];

    expect(result).toMatchObject({
      id: 'registration-1',
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      approvalStatus: RegistrationApprovalStatus.PENDING,
      rulesVersion: '2.1',
      tournament: {
        id: 'free-registration-cup',
        slug: 'free-registration-cup',
        name: 'CLUTCHA Valorant Cairo Cup',
        gameKey: 'valorant',
        mode: TournamentMode.ONLINE,
        registrationFee: '0',
        currency: 'EGP',
      },
      team: {
        id: 'team-1',
        name: 'Cairo Titans',
      },
    });
    expect(createArgs.data).toMatchObject({
      tournamentId: 'free-registration-cup',
      teamId: 'team-1',
      captainId: 'captain-1',
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      approvalStatus: RegistrationApprovalStatus.PENDING,
      rulesVersion: '2.1',
    });
    expect(createArgs.data).not.toHaveProperty('teamIdFromClient');
    expect(createArgs.data).not.toHaveProperty('captainIdFromClient');
    expect(createArgs.data.rosterSnapshot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rosterPlayerId: 'starter-1',
          gamerTag: 'Starter One',
          gameAccountId: 'VALORANT#1234',
          phoneNumber: '+201001234567',
          rosterType: RosterType.STARTER,
        }),
      ]),
    );
    expect(createArgs.data.captainContactSnapshot).toEqual({
      displayName: 'Captain One',
      email: 'captain@example.com',
      phoneNumber: '+201001234567',
      discordUsername: null,
    });
    expect(result).not.toHaveProperty('rosterSnapshot');
    expect(result).not.toHaveProperty('captainContactSnapshot');
  });

  it('creates a paid tournament registration in pending-payment status', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'paid-registration-cup',
        slug: 'paid-registration-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationFee: { toString: () => '150.00' },
        registrationOpensAt: new Date('2026-08-20T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-09-10T20:00:00.000Z'),
        allowedRegion: 'MENA',
        allowedCountries: ['EG'],
      }),
    );

    const result = await service.createCaptainTournamentRegistration(
      'captain-1',
      'paid-registration-cup',
      { acceptRules: true },
    );

    expect(result.status).toBe(TournamentRegistrationStatus.PENDING_PAYMENT);
    expect(result.paymentStatus).toBe(RegistrationPaymentStatus.AWAITING_PROOF);
    expect(result.approvalStatus).toBe(RegistrationApprovalStatus.PENDING);
    expect(result.tournament.registrationFee).toBe('150.00');
  });

  it('requires accepting tournament rules before registration', async () => {
    await expect(
      service.createCaptainTournamentRegistration('captain-1', 'tournament-1', {
        acceptRules: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns conflict when the team is already registered', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'duplicate-registration-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationOpensAt: new Date('2026-08-01T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-08-10T20:00:00.000Z'),
        allowedRegion: 'MENA',
        allowedCountries: ['EG'],
      }),
    );
    tournamentRegistrations.push(
      createTournamentRegistrationRecord({
        tournamentId: 'duplicate-registration-cup',
        teamId: 'team-1',
        captainId: 'captain-1',
      }),
    );

    await expect(
      service.createCaptainTournamentRegistration(
        'captain-1',
        'duplicate-registration-cup',
        { acceptRules: true },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns structured eligibility issues for duplicate and full tournaments', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'full-registration-cup',
        status: TournamentStatus.REGISTRATION_OPEN,
        maximumTeams: 1,
        registrationOpensAt: new Date('2026-08-01T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-08-10T20:00:00.000Z'),
        allowedRegion: 'MENA',
        allowedCountries: ['EG'],
      }),
    );
    tournamentRegistrations.push(
      createTournamentRegistrationRecord({
        tournamentId: 'full-registration-cup',
        teamId: 'team-1',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
      }),
    );

    const result = await service.getCaptainTournamentEligibility(
      'captain-1',
      'full-registration-cup',
    );

    expect(result.eligible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['TOURNAMENT_FULL', 'ALREADY_REGISTERED']),
    );
  });

  it('rejects registration when eligibility checks fail', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'ineligible-registration-cup',
        status: TournamentStatus.PUBLISHED,
        registrationOpensAt: new Date('2026-08-01T10:00:00.000Z'),
        registrationClosesAt: new Date('2026-08-10T20:00:00.000Z'),
      }),
    );

    await expect(
      service.createCaptainTournamentRegistration(
        'captain-1',
        'ineligible-registration-cup',
        { acceptRules: true },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('lists only the authenticated Captain registrations with pagination and filters', async () => {
    const upcomingTournament = createTournamentRecord({
      id: 'captain-registration-upcoming-cup',
      slug: 'captain-registration-upcoming-cup',
      name: 'Upcoming Captain Cup',
      gameKey: 'valorant',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.REGISTRATION_OPEN,
      startsAt: new Date('2026-09-12T18:00:00.000Z'),
    });
    const otherGameTournament = createTournamentRecord({
      id: 'captain-registration-other-game-cup',
      slug: 'captain-registration-other-game-cup',
      name: 'Other Game Cup',
      gameKey: 'apex',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.REGISTRATION_OPEN,
      startsAt: new Date('2026-09-13T18:00:00.000Z'),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-upcoming',
        captainId: 'captain-1',
        tournamentId: upcomingTournament.id,
        tournament: upcomingTournament,
        submittedAt: new Date('2026-08-04T12:00:00.000Z'),
      }),
      createTournamentRegistrationRecord({
        id: 'registration-other-game',
        captainId: 'captain-1',
        tournamentId: otherGameTournament.id,
        tournament: otherGameTournament,
        submittedAt: new Date('2026-08-04T13:00:00.000Z'),
      }),
      createTournamentRegistrationRecord({
        id: 'registration-other-captain',
        captainId: 'other-captain',
        tournamentId: upcomingTournament.id,
        tournament: upcomingTournament,
      }),
    ];

    const result = await service.listCaptainRegistrations('captain-1', {
      page: 1,
      limit: 10,
      gameKey: 'VALORANT',
      mode: TournamentMode.ONLINE,
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      time: CaptainRegistrationTimeFilter.UPCOMING,
      sortBy: CaptainRegistrationSortBy.TOURNAMENT_STARTS_AT,
      sortDirection: CaptainRegistrationSortDirection.ASC,
    });

    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      registrationId: 'registration-upcoming',
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      approvalStatus: RegistrationApprovalStatus.PENDING,
      nextAction: 'WAIT_FOR_APPROVAL',
      tournament: {
        id: 'captain-registration-upcoming-cup',
        slug: 'captain-registration-upcoming-cup',
        name: 'Upcoming Captain Cup',
        gameKey: 'valorant',
        mode: TournamentMode.ONLINE,
      },
    });
    expect(result.items[0]).not.toHaveProperty('rosterSnapshot');
    expect(result.items[0]).not.toHaveProperty('captainContactSnapshot');
    expect(findManyTournamentRegistrations.mock.calls[0][0]).toMatchObject({
      where: {
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
      },
      orderBy: {
        tournament: {
          startsAt: CaptainRegistrationSortDirection.ASC,
        },
      },
    });
  });

  it('returns Captain registration details with private owned snapshots', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-registration-detail-cup',
      slug: 'captain-registration-detail-cup',
      name: 'Detail Captain Cup',
      status: TournamentStatus.CHECK_IN_OPEN,
      startsAt: new Date('2026-09-12T18:00:00.000Z'),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-detail',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        rosterSnapshot: [
          {
            rosterPlayerId: 'starter-1',
            gamerTag: 'Starter One',
            phoneNumber: '+201001234567',
          },
        ],
        captainContactSnapshot: {
          displayName: 'Captain One',
          email: 'captain@example.com',
          phoneNumber: '+201001234567',
        },
        approvedAt: new Date('2026-08-04T17:00:00.000Z'),
      }),
    ];

    const result = await service.getCaptainRegistrationDetails(
      'captain-1',
      'registration-detail',
    );

    expect(result).toMatchObject({
      registrationId: 'registration-detail',
      nextAction: 'CHECK_IN',
      lifecycle: {
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        approvedAt: new Date('2026-08-04T17:00:00.000Z'),
      },
      tournament: {
        id: 'captain-registration-detail-cup',
        slug: 'captain-registration-detail-cup',
        name: 'Detail Captain Cup',
      },
    });
    expect(result.rosterSnapshot).toEqual([
      {
        rosterPlayerId: 'starter-1',
        gamerTag: 'Starter One',
        phoneNumber: '+201001234567',
      },
    ]);
    expect(result.captainContactSnapshot).toEqual({
      displayName: 'Captain One',
      email: 'captain@example.com',
      phoneNumber: '+201001234567',
    });
  });

  it('returns 404 when another Captain requests registration details', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-private',
        captainId: 'captain-1',
        tournament: createTournamentRecord({
          id: 'private-registration-cup',
        }),
      }),
    ];

    await expect(
      service.getCaptainRegistrationDetails(
        'other-captain',
        'registration-private',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets an approved free registration access the Captain tournament hub with private info', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-hub-free-cup',
      slug: 'captain-hub-free-cup',
      name: 'Captain Hub Free Cup',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.CHECK_IN_OPEN,
      onlineConfiguration: {
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby only.',
        discordServerUrl: 'https://discord.gg/clutcha',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Lobby opens 15 minutes before start.',
        privateSupportContact: 'support@example.com',
      },
    });
    const rosterSnapshot = [
      {
        rosterPlayerId: 'starter-1',
        gamerTag: 'Starter One',
        phoneNumber: '+201001234567',
      },
    ];
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-hub-free-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        approvedAt: new Date('2026-08-04T17:00:00.000Z'),
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1', name: 'Cairo Titans' }),
        rosterSnapshot,
      }),
    ];

    const result = await service.getCaptainRegistrationHub(
      'captain-1',
      'captain-hub-free-registration',
    );

    expect(result).toMatchObject({
      registration: {
        id: 'captain-hub-free-registration',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
      },
      tournament: {
        id: 'captain-hub-free-cup',
        slug: 'captain-hub-free-cup',
        name: 'Captain Hub Free Cup',
      },
      team: {
        id: 'team-1',
        name: 'Cairo Titans',
        seed: null,
      },
      privateInformationAvailable: true,
      onlinePrivateInfo: {
        discordServerUrl: 'https://discord.gg/clutcha',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Lobby opens 15 minutes before start.',
      },
      checkedIn: false,
      requiredActions: ['CHECK_IN'],
    });
    expect(result.rosterSnapshot).toEqual(rosterSnapshot);
    expect(result.progress).toEqual({
      currentStage: null,
      currentRound: null,
      nextMatch: null,
      upcomingMatches: [],
      officialScoreSummary: null,
      wins: null,
      losses: null,
      placement: null,
      qualificationState: null,
    });
  });

  it('prevents unpaid paid registrations from accessing the Captain tournament hub', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-hub-unpaid-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.PENDING,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournament: createTournamentRecord({
          id: 'captain-hub-unpaid-cup',
        }),
        team: createTeamRecord(),
      }),
    ];

    await expect(
      service.getCaptainRegistrationHub(
        'captain-1',
        'captain-hub-unpaid-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents rejected registrations from accessing the Captain tournament hub', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-hub-rejected-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.REJECTED,
        approvalStatus: RegistrationApprovalStatus.REJECTED,
        tournament: createTournamentRecord({
          id: 'captain-hub-rejected-cup',
        }),
        team: createTeamRecord(),
      }),
    ];

    await expect(
      service.getCaptainRegistrationHub(
        'captain-1',
        'captain-hub-rejected-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 when another Captain requests the tournament hub', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-hub-private-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournament: createTournamentRecord({
          id: 'captain-hub-private-cup',
        }),
        team: createTeamRecord(),
      }),
    ];

    await expect(
      service.getCaptainRegistrationHub(
        'other-captain',
        'captain-hub-private-registration',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not expose private hub information before approval', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-hub-pending-cup',
      onlineConfiguration: {
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby only.',
        discordServerUrl: 'https://discord.gg/private',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Private lobby.',
        privateSupportContact: 'private@example.com',
      },
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-hub-pending-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournament,
        team: createTeamRecord(),
      }),
    ];

    await expect(
      service.getCaptainRegistrationHub(
        'captain-1',
        'captain-hub-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists only matches involving the approved Captain team', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-match-cup',
      name: 'Captain Match Cup',
      mode: TournamentMode.ONLINE,
      timezone: 'Africa/Cairo',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-match-registration',
        captainId: 'captain-1',
        teamId: 'team-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1', name: 'Cairo Titans' }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'match-visible',
        tournamentId: tournament.id,
        tournament,
        teamAId: 'team-1',
        teamA: createTeamRecord({ id: 'team-1', name: 'Cairo Titans' }),
        teamBId: 'team-opponent',
        teamB: createTeamRecord({
          id: 'team-opponent',
          captainId: 'opponent-captain',
          name: 'Falcons',
        }),
        status: TournamentMatchStatus.COMPLETED,
        teamAScore: 2,
        teamBScore: 1,
        winnerTeamId: 'team-1',
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        evidenceUrl: 'https://cdn.example.com/evidence.png',
        onlineServerInfo: {
          lobbyCode: 'CLUTCHA-123',
          serverRegion: 'EU West',
        },
        games: [
          createTournamentMatchGameRecord({
            id: 'match-visible-game-1',
            matchId: 'match-visible',
            gameNumber: 1,
            mapName: 'Bind',
            teamAScore: 13,
            teamBScore: 9,
            winnerTeamId: 'team-1',
          }),
        ],
      }),
      createTournamentMatchRecord({
        id: 'match-hidden',
        tournamentId: tournament.id,
        teamAId: 'other-team-a',
        teamBId: 'other-team-b',
      }),
    ];

    const result = await service.listCaptainRegistrationMatches(
      'captain-1',
      'captain-match-registration',
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'match-visible',
      tournament: {
        id: 'captain-match-cup',
        name: 'Captain Match Cup',
        mode: TournamentMode.ONLINE,
      },
      stage: 'GROUP_STAGE',
      round: 1,
      bracketPosition: 'A1',
      opponent: {
        teamId: 'team-opponent',
        teamName: 'Falcons',
      },
      timezone: 'Africa/Cairo',
      status: TournamentMatchStatus.COMPLETED,
      captainTeamScore: 2,
      opponentScore: 1,
      winnerTeamId: 'team-1',
      officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
      evidenceAvailable: true,
      disputeStatus: TournamentMatchDisputeStatus.NONE,
      onlineServer: {
        onlineServerInfo: {
          lobbyCode: 'CLUTCHA-123',
          serverRegion: 'EU West',
        },
      },
      onsiteAssignment: null,
    });
    expect(result.items[0].mapResults).toEqual([
      {
        id: 'match-visible-game-1',
        gameNumber: 1,
        mapName: 'Bind',
        captainTeamScore: 13,
        opponentScore: 9,
        winnerTeamId: 'team-1',
        evidenceAvailable: false,
      },
    ]);
  });

  it('normalizes scores and room assignments when the Captain team is team B', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-onsite-match-cup',
      name: 'Captain Onsite Match Cup',
      mode: TournamentMode.ONSITE,
      timezone: 'Africa/Cairo',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-onsite-match-registration',
        captainId: 'captain-1',
        teamId: 'team-1',
        status: TournamentRegistrationStatus.CHECKED_IN,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1', name: 'Cairo Titans' }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'match-onsite',
        tournamentId: tournament.id,
        tournament,
        teamAId: 'team-opponent',
        teamA: createTeamRecord({
          id: 'team-opponent',
          captainId: 'opponent-captain',
          name: 'Falcons',
        }),
        teamBId: 'team-1',
        teamB: createTeamRecord({ id: 'team-1', name: 'Cairo Titans' }),
        teamAScore: 0,
        teamBScore: 2,
        gamingRoomId: 'gaming-room-1',
        gamingRoom: createGamingRoomRecord({
          id: 'gaming-room-1',
          name: 'Main Stage Room',
        }),
        onsiteStationLabel: 'Station A-04',
      }),
    ];

    const result = await service.getCaptainRegistrationMatch(
      'captain-1',
      'captain-onsite-match-registration',
      'match-onsite',
    );

    expect(result).toMatchObject({
      id: 'match-onsite',
      opponent: {
        teamId: 'team-opponent',
        teamName: 'Falcons',
      },
      captainTeamScore: 2,
      opponentScore: 0,
      onlineServer: null,
      onsiteAssignment: {
        gamingRoomId: 'gaming-room-1',
        roomName: 'Main Stage Room',
        stationLabel: 'Station A-04',
      },
    });
  });

  it('blocks unapproved registrations and foreign matches from Captain match views', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-match-private-cup',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-match-pending-registration',
        captainId: 'captain-1',
        teamId: 'team-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1' }),
      }),
      createTournamentRegistrationRecord({
        id: 'captain-match-approved-registration',
        captainId: 'captain-1',
        teamId: 'team-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'foreign-match',
        tournamentId: tournament.id,
        teamAId: 'other-team-a',
        teamBId: 'other-team-b',
      }),
    ];

    await expect(
      service.listCaptainRegistrationMatches(
        'captain-1',
        'captain-match-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.getCaptainRegistrationMatch(
        'captain-1',
        'captain-match-approved-registration',
        'foreign-match',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns Captain tournament progress from official match data', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-progress-cup',
      name: 'Captain Progress Cup',
      mode: TournamentMode.ONLINE,
      timezone: 'Africa/Cairo',
    });
    const captainTeam = createTeamRecord({
      id: 'team-1',
      name: 'Cairo Titans',
    });
    const opponent = createTeamRecord({
      id: 'team-opponent',
      captainId: 'opponent-captain',
      name: 'Falcons',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-progress-registration',
        captainId: 'captain-1',
        teamId: captainTeam.id,
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: captainTeam,
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'progress-win',
        tournamentId: tournament.id,
        tournament,
        teamAId: captainTeam.id,
        teamA: captainTeam,
        teamBId: opponent.id,
        teamB: opponent,
        scheduledAt: new Date('2026-08-01T18:00:00.000Z'),
        status: TournamentMatchStatus.COMPLETED,
        teamAScore: 2,
        teamBScore: 1,
        winnerTeamId: captainTeam.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        games: [
          createTournamentMatchGameRecord({
            id: 'progress-win-game-1',
            matchId: 'progress-win',
            gameNumber: 1,
            winnerTeamId: captainTeam.id,
          }),
          createTournamentMatchGameRecord({
            id: 'progress-win-game-2',
            matchId: 'progress-win',
            gameNumber: 2,
            winnerTeamId: opponent.id,
          }),
          createTournamentMatchGameRecord({
            id: 'progress-win-game-3',
            matchId: 'progress-win',
            gameNumber: 3,
            winnerTeamId: captainTeam.id,
          }),
        ],
      }),
      createTournamentMatchRecord({
        id: 'progress-loss',
        tournamentId: tournament.id,
        tournament,
        teamAId: opponent.id,
        teamA: opponent,
        teamBId: captainTeam.id,
        teamB: captainTeam,
        scheduledAt: new Date('2026-08-02T18:00:00.000Z'),
        status: TournamentMatchStatus.COMPLETED,
        teamAScore: 2,
        teamBScore: 0,
        winnerTeamId: opponent.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        games: [
          createTournamentMatchGameRecord({
            id: 'progress-loss-game-1',
            matchId: 'progress-loss',
            gameNumber: 1,
            winnerTeamId: opponent.id,
          }),
          createTournamentMatchGameRecord({
            id: 'progress-loss-game-2',
            matchId: 'progress-loss',
            gameNumber: 2,
            winnerTeamId: opponent.id,
          }),
        ],
      }),
      createTournamentMatchRecord({
        id: 'progress-next',
        tournamentId: tournament.id,
        tournament,
        stage: 'PLAYOFFS',
        round: 2,
        bracketPosition: 'SF1',
        teamAId: captainTeam.id,
        teamA: captainTeam,
        teamBId: opponent.id,
        teamB: opponent,
        scheduledAt: new Date('2026-09-13T18:00:00.000Z'),
        status: TournamentMatchStatus.SCHEDULED,
      }),
    ];

    const result = await service.getCaptainRegistrationProgress(
      'captain-1',
      'captain-progress-registration',
    );

    expect(result).toEqual({
      registrationId: 'captain-progress-registration',
      tournament: {
        id: 'captain-progress-cup',
        name: 'Captain Progress Cup',
      },
      team: {
        id: 'team-1',
        name: 'Cairo Titans',
      },
      currentStage: 'PLAYOFFS',
      currentRound: 2,
      nextMatch: {
        id: 'progress-next',
        stage: 'PLAYOFFS',
        round: 2,
        bracketPosition: 'SF1',
        opponent: {
          teamId: 'team-opponent',
          teamName: 'Falcons',
        },
        scheduledAt: new Date('2026-09-13T18:00:00.000Z'),
        status: TournamentMatchStatus.SCHEDULED,
      },
      upcomingMatches: [
        {
          id: 'progress-next',
          stage: 'PLAYOFFS',
          round: 2,
          bracketPosition: 'SF1',
          opponent: {
            teamId: 'team-opponent',
            teamName: 'Falcons',
          },
          scheduledAt: new Date('2026-09-13T18:00:00.000Z'),
          status: TournamentMatchStatus.SCHEDULED,
        },
      ],
      wins: 1,
      losses: 1,
      matchesPlayed: 2,
      matchesRemaining: 1,
      officialScoreSummary: {
        matchesWithOfficialResults: 2,
        mapsWon: 2,
        mapsLost: 3,
      },
      placement: null,
      qualificationState: null,
    });
  });

  it('blocks unapproved registrations from Captain progress views', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-progress-pending-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournament: createTournamentRecord({
          id: 'captain-progress-pending-cup',
        }),
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];

    await expect(
      service.getCaptainRegistrationProgress(
        'captain-1',
        'captain-progress-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns Captain-visible bracket stages without private match data', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-bracket-cup',
      name: 'Captain Bracket Cup',
    });
    const captainTeam = createTeamRecord({
      id: 'team-1',
      name: 'Cairo Titans',
    });
    const opponent = createTeamRecord({
      id: 'team-opponent',
      captainId: 'opponent-captain',
      name: 'Falcons',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-bracket-registration',
        captainId: 'captain-1',
        teamId: captainTeam.id,
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: captainTeam,
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'bracket-match-1',
        tournamentId: tournament.id,
        tournament,
        stage: 'GROUP_STAGE',
        round: 1,
        bracketPosition: 'A1',
        teamAId: captainTeam.id,
        teamA: captainTeam,
        teamBId: opponent.id,
        teamB: opponent,
        status: TournamentMatchStatus.COMPLETED,
        teamAScore: 2,
        teamBScore: 1,
        winnerTeamId: captainTeam.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        onlineServerInfo: {
          privateLobbyCode: 'DO-NOT-EXPOSE',
        },
      }),
      createTournamentMatchRecord({
        id: 'bracket-match-2',
        tournamentId: tournament.id,
        tournament,
        stage: 'PLAYOFFS',
        round: 2,
        bracketPosition: 'SF1',
        teamAId: opponent.id,
        teamA: opponent,
        teamBId: null,
        teamB: null,
        status: TournamentMatchStatus.SCHEDULED,
      }),
    ];

    const result = await service.getCaptainRegistrationBracket(
      'captain-1',
      'captain-bracket-registration',
    );

    expect(result).toEqual({
      registrationId: 'captain-bracket-registration',
      tournament: {
        id: 'captain-bracket-cup',
        name: 'Captain Bracket Cup',
      },
      captainTeamId: 'team-1',
      stages: [
        {
          stage: 'GROUP_STAGE',
          matches: [
            {
              id: 'bracket-match-1',
              stage: 'GROUP_STAGE',
              round: 1,
              bracketPosition: 'A1',
              scheduledAt: new Date('2026-09-12T18:00:00.000Z'),
              status: TournamentMatchStatus.COMPLETED,
              teamA: {
                id: 'team-1',
                name: 'Cairo Titans',
                isCaptainTeam: true,
              },
              teamB: {
                id: 'team-opponent',
                name: 'Falcons',
                isCaptainTeam: false,
              },
              teamAScore: 2,
              teamBScore: 1,
              winnerTeamId: 'team-1',
              officialResultStatus:
                TournamentMatchOfficialResultStatus.CONFIRMED,
            },
          ],
        },
        {
          stage: 'PLAYOFFS',
          matches: [
            {
              id: 'bracket-match-2',
              stage: 'PLAYOFFS',
              round: 2,
              bracketPosition: 'SF1',
              scheduledAt: new Date('2026-09-12T18:00:00.000Z'),
              status: TournamentMatchStatus.SCHEDULED,
              teamA: {
                id: 'team-opponent',
                name: 'Falcons',
                isCaptainTeam: false,
              },
              teamB: null,
              teamAScore: null,
              teamBScore: null,
              winnerTeamId: null,
              officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('DO-NOT-EXPOSE');
  });

  it('returns Captain-visible standings from official confirmed results', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-standings-cup',
      name: 'Captain Standings Cup',
    });
    const captainTeam = createTeamRecord({
      id: 'team-1',
      name: 'Cairo Titans',
    });
    const falcons = createTeamRecord({
      id: 'team-falcons',
      captainId: 'falcons-captain',
      name: 'Falcons',
    });
    const wolves = createTeamRecord({
      id: 'team-wolves',
      captainId: 'wolves-captain',
      name: 'Wolves',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-standings-registration',
        captainId: 'captain-1',
        teamId: captainTeam.id,
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: captainTeam,
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'standings-match-win',
        tournamentId: tournament.id,
        tournament,
        teamAId: captainTeam.id,
        teamA: captainTeam,
        teamBId: falcons.id,
        teamB: falcons,
        status: TournamentMatchStatus.COMPLETED,
        winnerTeamId: captainTeam.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        games: [
          createTournamentMatchGameRecord({
            id: 'standings-match-win-game-1',
            matchId: 'standings-match-win',
            gameNumber: 1,
            winnerTeamId: captainTeam.id,
          }),
          createTournamentMatchGameRecord({
            id: 'standings-match-win-game-2',
            matchId: 'standings-match-win',
            gameNumber: 2,
            winnerTeamId: falcons.id,
          }),
          createTournamentMatchGameRecord({
            id: 'standings-match-win-game-3',
            matchId: 'standings-match-win',
            gameNumber: 3,
            winnerTeamId: captainTeam.id,
          }),
        ],
      }),
      createTournamentMatchRecord({
        id: 'standings-match-loss',
        tournamentId: tournament.id,
        tournament,
        teamAId: wolves.id,
        teamA: wolves,
        teamBId: captainTeam.id,
        teamB: captainTeam,
        status: TournamentMatchStatus.FORFEIT,
        winnerTeamId: wolves.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        games: [
          createTournamentMatchGameRecord({
            id: 'standings-match-loss-game-1',
            matchId: 'standings-match-loss',
            gameNumber: 1,
            winnerTeamId: wolves.id,
          }),
        ],
      }),
      createTournamentMatchRecord({
        id: 'standings-match-pending',
        tournamentId: tournament.id,
        tournament,
        teamAId: falcons.id,
        teamA: falcons,
        teamBId: wolves.id,
        teamB: wolves,
        status: TournamentMatchStatus.COMPLETED,
        winnerTeamId: falcons.id,
        officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
      }),
    ];

    const result = await service.getCaptainRegistrationStandings(
      'captain-1',
      'captain-standings-registration',
    );

    expect(result).toEqual({
      registrationId: 'captain-standings-registration',
      tournamentId: 'captain-standings-cup',
      tournamentName: 'Captain Standings Cup',
      captainTeamId: 'team-1',
      officialResultsOnly: true,
      items: [
        {
          rank: 1,
          team: {
            id: 'team-wolves',
            name: 'Wolves',
            isCaptainTeam: false,
          },
          wins: 1,
          losses: 0,
          matchesPlayed: 1,
          mapsWon: 1,
          mapsLost: 0,
          mapDifferential: 1,
        },
        {
          rank: 2,
          team: {
            id: 'team-1',
            name: 'Cairo Titans',
            isCaptainTeam: true,
          },
          wins: 1,
          losses: 1,
          matchesPlayed: 2,
          mapsWon: 2,
          mapsLost: 2,
          mapDifferential: 0,
        },
        {
          rank: 3,
          team: {
            id: 'team-falcons',
            name: 'Falcons',
            isCaptainTeam: false,
          },
          wins: 0,
          losses: 1,
          matchesPlayed: 1,
          mapsWon: 1,
          mapsLost: 2,
          mapDifferential: -1,
        },
      ],
    });
  });

  it('blocks unapproved registrations from bracket and standings views', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-visibility-pending-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournament: createTournamentRecord({
          id: 'captain-visibility-pending-cup',
        }),
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];

    await expect(
      service.getCaptainRegistrationBracket(
        'captain-1',
        'captain-visibility-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.getCaptainRegistrationStandings(
        'captain-1',
        'captain-visibility-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns approved Captain private tournament information with released lobby data', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-information-cup',
      name: 'Captain Information Cup',
      status: TournamentStatus.CHECK_IN_OPEN,
      checkInRules: 'Captains must check in 30 minutes before start.',
      startsAt: new Date('2026-08-06T18:00:00.000Z'),
      onlineConfiguration: createOnlineConfigurationRecord({
        tournamentId: 'captain-information-cup',
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby only.',
        screenshotRequirements: 'Open a support ticket for technical issues.',
        discordServerUrl: 'https://discord.gg/clutcha-private',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Lobby code releases inside Discord.',
        privateSupportContact: 'support@example.com',
      }),
    });
    const captainTeam = createTeamRecord({
      id: 'team-1',
      name: 'Cairo Titans',
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-information-registration',
        captainId: 'captain-1',
        teamId: captainTeam.id,
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: captainTeam,
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'captain-information-match',
        tournamentId: tournament.id,
        tournament,
        teamAId: captainTeam.id,
        teamA: captainTeam,
        teamBId: 'team-opponent',
        teamB: createTeamRecord({
          id: 'team-opponent',
          captainId: 'opponent-captain',
          name: 'Falcons',
        }),
        onlineServerInfo: {
          lobbyCode: 'CLUTCHA-123',
          password: 'team-scoped-password',
        },
      }),
    ];

    const result = await service.getCaptainRegistrationInformation(
      'captain-1',
      'captain-information-registration',
    );

    expect(result).toEqual({
      registrationId: 'captain-information-registration',
      tournament: {
        id: 'captain-information-cup',
        name: 'Captain Information Cup',
        mode: TournamentMode.ONLINE,
        timezone: 'Africa/Cairo',
      },
      releaseGate: {
        lobbyInformationReleased: true,
        lobbyInformationReleasesAt: new Date('2026-08-05T18:00:00.000Z'),
      },
      checkInInstructions: 'Captains must check in 30 minutes before start.',
      onlineInformation: {
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby only.',
        tournamentDiscordInvitation: 'https://discord.gg/clutcha-private',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        technicalSupportInstructions:
          'Open a support ticket for technical issues.',
        organizerSupportContact: 'support@example.com',
        lobbyInformation: 'Lobby code releases inside Discord.',
        nextMatchServerInformation: {
          lobbyCode: 'CLUTCHA-123',
          password: 'team-scoped-password',
        },
      },
      venueInformation: null,
    });
  });

  it('time-gates lobby and match server information before release', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-information-gated-cup',
      name: 'Captain Information Gated Cup',
      status: TournamentStatus.REGISTRATION_CLOSED,
      startsAt: new Date('2026-09-12T18:00:00.000Z'),
      onlineConfiguration: createOnlineConfigurationRecord({
        tournamentId: 'captain-information-gated-cup',
        lobbyInstructions: 'Hidden until release.',
      }),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-information-gated-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'captain-information-gated-match',
        tournamentId: tournament.id,
        teamAId: 'team-1',
        onlineServerInfo: {
          lobbyCode: 'SHOULD-NOT-SHOW',
        },
      }),
    ];

    const result = await service.getCaptainRegistrationInformation(
      'captain-1',
      'captain-information-gated-registration',
    );

    expect(result.releaseGate).toEqual({
      lobbyInformationReleased: false,
      lobbyInformationReleasesAt: new Date('2026-09-11T18:00:00.000Z'),
    });
    expect(result.onlineInformation?.lobbyInformation).toBeNull();
    expect(result.onlineInformation?.nextMatchServerInformation).toBeNull();
    expect(JSON.stringify(result)).not.toContain('SHOULD-NOT-SHOW');
  });

  it('returns on-site private venue and assigned station information', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-information-onsite-cup',
      name: 'Captain Information Onsite Cup',
      mode: TournamentMode.ONSITE,
      status: TournamentStatus.CHECK_IN_OPEN,
      startsAt: new Date('2026-08-06T18:00:00.000Z'),
      checkInOpensAt: new Date('2026-08-06T16:30:00.000Z'),
      checkInRules: 'Bring national ID to the main desk.',
      venue: createVenueRecord({
        tournamentId: 'captain-information-onsite-cup',
        name: 'CLUTCHA Arena Cairo',
        venueRules: 'No food near gaming stations.',
        parkingInfo: 'Use gate B parking.',
      }),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-information-onsite-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CHECKED_IN,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'captain-information-onsite-match',
        tournamentId: tournament.id,
        tournament,
        teamAId: 'team-1',
        gamingRoomId: 'gaming-room-1',
        gamingRoom: createGamingRoomRecord({
          id: 'gaming-room-1',
          name: 'Main Stage Room',
        }),
        onsiteStationLabel: 'Station A-04',
      }),
    ];

    const result = await service.getCaptainRegistrationInformation(
      'captain-1',
      'captain-information-onsite-registration',
    );

    expect(result.onlineInformation).toBeNull();
    expect(result.venueInformation).toMatchObject({
      name: 'CLUTCHA Arena Cairo',
      country: 'EG',
      city: 'Cairo',
      address: '90 Street, New Cairo',
      checkInLocation: 'Main reception',
      venueInstructions: 'No food near gaming stations.',
      parkingInfo: 'Use gate B parking.',
      arrivalTime: new Date('2026-08-06T16:30:00.000Z'),
      assignedRoomId: 'gaming-room-1',
      assignedRoomName: 'Main Stage Room',
      assignedStation: 'Station A-04',
    });
  });

  it('blocks unapproved registrations from private tournament information', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-information-pending-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournament: createTournamentRecord({
          id: 'captain-information-pending-cup',
        }),
        team: createTeamRecord({ id: 'team-1' }),
      }),
    ];

    await expect(
      service.getCaptainRegistrationInformation(
        'captain-1',
        'captain-information-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns Captain check-in readiness using organizer approval instead of payment status', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-check-in-ready-cup',
      name: 'Captain Check-In Ready Cup',
      status: TournamentStatus.CHECK_IN_OPEN,
      mode: TournamentMode.ONSITE,
      checkInRules: 'Bring national ID to the main desk.',
      checkInOpensAt: new Date('2026-08-06T16:30:00.000Z'),
      venue: createVenueRecord({
        tournamentId: 'captain-check-in-ready-cup',
        name: 'CLUTCHA Arena Cairo',
      }),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-check-in-ready-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.PENDING,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        captain: createUserRecord({
          id: 'captain-1',
          phoneNumber: '+201001234567',
        }),
        team: createTeamRecord({
          id: 'team-1',
          rosterPlayers: [
            createRosterPlayerRecord({ id: 'starter-1' }),
            createRosterPlayerRecord({ id: 'starter-2' }),
            createRosterPlayerRecord({ id: 'starter-3' }),
            createRosterPlayerRecord({ id: 'starter-4' }),
            createRosterPlayerRecord({ id: 'starter-5' }),
          ],
        }),
      }),
    ];
    tournamentMatches = [
      createTournamentMatchRecord({
        id: 'captain-check-in-ready-match',
        tournamentId: tournament.id,
        tournament,
        teamAId: 'team-1',
        gamingRoom: createGamingRoomRecord({
          id: 'gaming-room-1',
          name: 'Main Stage Room',
        }),
        onsiteStationLabel: 'Station A-04',
      }),
    ];

    const result = await service.getCaptainRegistrationCheckIn(
      'captain-1',
      'captain-check-in-ready-registration',
    );

    expect(result).toMatchObject({
      registrationId: 'captain-check-in-ready-registration',
      canCheckIn: true,
      checkedIn: false,
      outstandingIssues: [],
      registration: {
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        paymentStatus: RegistrationPaymentStatus.PENDING,
        checkedInAt: null,
      },
      instructions: {
        checkInInstructions: 'Bring national ID to the main desk.',
        arrivalTime: new Date('2026-08-06T16:30:00.000Z'),
        venueName: 'CLUTCHA Arena Cairo',
        checkInLocation: 'Main reception',
        assignedRoomName: 'Main Stage Room',
        assignedStation: 'Station A-04',
      },
    });
  });

  it('checks in an organizer-approved confirmed registration', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-check-in-success-cup',
      name: 'Captain Check-In Success Cup',
      status: TournamentStatus.CHECK_IN_OPEN,
      checkInRules: 'Join the Captain support channel.',
      onlineConfiguration: createOnlineConfigurationRecord({
        tournamentId: 'captain-check-in-success-cup',
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby only.',
      }),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-check-in-success-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        paymentStatus: RegistrationPaymentStatus.PENDING,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        captain: createUserRecord({ phoneNumber: '+201001234567' }),
        team: createTeamRecord({
          id: 'team-1',
          rosterPlayers: [
            createRosterPlayerRecord({ id: 'starter-1' }),
            createRosterPlayerRecord({ id: 'starter-2' }),
            createRosterPlayerRecord({ id: 'starter-3' }),
            createRosterPlayerRecord({ id: 'starter-4' }),
            createRosterPlayerRecord({ id: 'starter-5' }),
          ],
        }),
      }),
    ];

    const result = await service.checkInCaptainRegistration(
      'captain-1',
      'captain-check-in-success-registration',
    );

    expect(updateTournamentRegistration).toHaveBeenCalledWith({
      where: { id: 'captain-check-in-success-registration' },
      data: {
        status: TournamentRegistrationStatus.CHECKED_IN,
        checkedInAt: expect.any(Date) as Date,
      },
      select: expect.any(Object) as object,
    });
    expect(result.checkedIn).toBe(true);
    expect(result.canCheckIn).toBe(false);
    expect(result.registration.status).toBe(
      TournamentRegistrationStatus.CHECKED_IN,
    );
    expect(result.instructions).toMatchObject({
      checkInInstructions: 'Join the Captain support channel.',
      serverRegion: 'EU West',
      onlineInstructions: 'Use assigned lobby only.',
    });
  });

  it('requires organizer approval before Captain check-in for free or paid tournaments', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-check-in-unapproved-cup',
      status: TournamentStatus.CHECK_IN_OPEN,
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-check-in-unapproved-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
        approvalStatus: RegistrationApprovalStatus.PENDING,
        tournamentId: tournament.id,
        tournament,
        captain: createUserRecord({ phoneNumber: '+201001234567' }),
        team: createTeamRecord({
          id: 'team-1',
          rosterPlayers: [
            createRosterPlayerRecord({ id: 'starter-1' }),
            createRosterPlayerRecord({ id: 'starter-2' }),
            createRosterPlayerRecord({ id: 'starter-3' }),
            createRosterPlayerRecord({ id: 'starter-4' }),
            createRosterPlayerRecord({ id: 'starter-5' }),
          ],
        }),
      }),
    ];

    const readiness = await service.getCaptainRegistrationCheckIn(
      'captain-1',
      'captain-check-in-unapproved-registration',
    );

    expect(readiness.canCheckIn).toBe(false);
    expect(readiness.outstandingIssues).toEqual(
      expect.arrayContaining([
        {
          field: 'registration.approvalStatus',
          message: 'Organizer must approve the team before check-in.',
        },
        {
          field: 'registration.status',
          message:
            'Registration must be confirmed by the organizer before check-in.',
        },
      ]),
    );
    await expect(
      service.checkInCaptainRegistration(
        'captain-1',
        'captain-check-in-unapproved-registration',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateTournamentRegistration).not.toHaveBeenCalled();
  });

  it('reports check-in issues for closed windows and incomplete rosters', async () => {
    const tournament = createTournamentRecord({
      id: 'captain-check-in-issues-cup',
      status: TournamentStatus.REGISTRATION_CLOSED,
      checkInOpensAt: new Date('2026-09-12T16:00:00.000Z'),
      checkInClosesAt: new Date('2026-09-12T17:00:00.000Z'),
    });
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'captain-check-in-issues-registration',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournamentId: tournament.id,
        tournament,
        captain: createUserRecord({ phoneNumber: null }),
        team: createTeamRecord({
          id: 'team-1',
          rosterPlayers: [
            createRosterPlayerRecord({
              id: 'starter-1',
              phoneNumber: '',
              gameAccountId: '',
            }),
          ],
        }),
      }),
    ];

    const result = await service.getCaptainRegistrationCheckIn(
      'captain-1',
      'captain-check-in-issues-registration',
    );

    expect(result.canCheckIn).toBe(false);
    expect(result.outstandingIssues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        'tournament.checkInWindow',
        'captain.phoneNumber',
        'team.rosterPlayers',
        'team.rosterPlayers.starter-1.gameAccountId',
        'team.rosterPlayers.starter-1.phoneNumber',
      ]),
    );
  });

  it('withdraws the authenticated Captain registration without deleting snapshots', async () => {
    const rosterSnapshot = [
      {
        rosterPlayerId: 'starter-1',
        gamerTag: 'Starter One',
        phoneNumber: '+201001234567',
      },
    ];
    const captainContactSnapshot = {
      displayName: 'Captain One',
      email: 'captain@example.com',
      phoneNumber: '+201001234567',
    };
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-withdrawable',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        tournament: createTournamentRecord({
          id: 'withdrawable-cup',
          status: TournamentStatus.REGISTRATION_OPEN,
        }),
        rosterSnapshot,
        captainContactSnapshot,
      }),
    ];

    const result = await service.withdrawCaptainRegistration(
      'captain-1',
      'registration-withdrawable',
      { reason: 'The team is no longer available.' },
    );

    const updateArgs = updateTournamentRegistration.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 'registration-withdrawable' });
    expect(updateArgs.data.status).toBe(TournamentRegistrationStatus.WITHDRAWN);
    expect(updateArgs.data.withdrawnAt).toBeInstanceOf(Date);
    expect(result.lifecycle.status).toBe(
      TournamentRegistrationStatus.WITHDRAWN,
    );
    expect(result.lifecycle.withdrawnAt).toBeInstanceOf(Date);
    expect(result.rosterSnapshot).toEqual(rosterSnapshot);
    expect(result.captainContactSnapshot).toEqual(captainContactSnapshot);
    expect(tournamentRegistrations).toHaveLength(1);
  });

  it('returns 404 when another Captain attempts to withdraw a registration', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-other-owner',
        captainId: 'captain-1',
        tournament: createTournamentRecord({
          id: 'other-owner-cup',
        }),
      }),
    ];

    await expect(
      service.withdrawCaptainRegistration(
        'other-captain',
        'registration-other-owner',
        {},
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(updateTournamentRegistration).not.toHaveBeenCalled();
  });

  it('rejects withdrawal for blocked registration and tournament lifecycles', async () => {
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-disqualified',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.DISQUALIFIED,
        tournament: createTournamentRecord({
          id: 'blocked-registration-cup',
          status: TournamentStatus.REGISTRATION_OPEN,
        }),
      }),
    ];

    await expect(
      service.withdrawCaptainRegistration(
        'captain-1',
        'registration-disqualified',
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'registration-started-tournament',
        captainId: 'captain-1',
        status: TournamentRegistrationStatus.CONFIRMED,
        tournament: createTournamentRecord({
          id: 'started-tournament-cup',
          status: TournamentStatus.IN_PROGRESS,
        }),
      }),
    ];

    await expect(
      service.withdrawCaptainRegistration(
        'captain-1',
        'registration-started-tournament',
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lets the tournament owner list registrations with submitted contacts scoped to their tournament', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-registration-cup',
      organizerId: 'organizer-1',
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-registration-1',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({
          id: 'organizer-registration-team',
          slug: 'organizer-registration-team',
        }),
        captainContactSnapshot: {
          displayName: 'Captain One',
          email: 'captain@example.com',
          phoneNumber: '+201001234567',
        },
        rosterSnapshot: [
          {
            gamerTag: 'Starter One',
            phoneNumber: '+201001234567',
            email: 'starter@example.com',
            discordUsername: 'starter',
          },
        ],
      }),
    ];

    const result = await service.listOrganizerTournamentRegistrations(
      'organizer-1',
      'organizer-registration-cup',
    );

    expect(result.meta.totalItems).toBe(1);
    expect(result.items[0]).toMatchObject({
      registrationId: 'organizer-registration-1',
      team: {
        id: 'organizer-registration-team',
        name: 'Cairo Titans',
        slug: 'organizer-registration-team',
      },
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      approvalStatus: RegistrationApprovalStatus.PENDING,
      eligibility: {
        eligible: true,
        issues: [],
      },
    });
    expect(result.items[0]).not.toHaveProperty('captainContactSnapshot');
    expect(result.items[0]).not.toHaveProperty('rosterSnapshot');
  });

  it('lets the tournament owner view registration contacts and snapshots', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-registration-detail-cup',
      organizerId: 'organizer-1',
    });
    createdTournaments.push(tournament);
    const captainContactSnapshot = {
      displayName: 'Captain One',
      email: 'captain@example.com',
      phoneNumber: '+201001234567',
      discordUsername: 'captain',
    };
    const rosterSnapshot = [
      {
        gamerTag: 'Starter One',
        phoneNumber: '+201001234567',
        email: 'starter@example.com',
        discordUsername: 'starter',
      },
    ];
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-registration-detail',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord(),
        captainContactSnapshot,
        rosterSnapshot,
      }),
    ];

    const result = await service.getOrganizerTournamentRegistration(
      'organizer-1',
      'organizer-registration-detail-cup',
      'organizer-registration-detail',
    );

    expect(result.captainContactSnapshot).toEqual(captainContactSnapshot);
    expect(result.rosterSnapshot).toEqual(rosterSnapshot);
  });

  it('returns 404 for another organizer listing or viewing registrations', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-private-cup',
      organizerId: 'organizer-1',
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-private-registration',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord(),
      }),
    ];

    await expect(
      service.listOrganizerTournamentRegistrations(
        'other-organizer',
        'organizer-private-cup',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.getOrganizerTournamentRegistration(
        'other-organizer',
        'organizer-private-cup',
        'organizer-private-registration',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves a free pending registration', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-approve-free-cup',
      organizerId: 'organizer-1',
      maximumTeams: 8,
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-approve-free-registration',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord(),
        paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      }),
    ];

    const result = await service.approveOrganizerTournamentRegistration(
      'organizer-1',
      'organizer-approve-free-cup',
      'organizer-approve-free-registration',
    );

    expect(result.status).toBe(TournamentRegistrationStatus.CONFIRMED);
    expect(result.approvalStatus).toBe(RegistrationApprovalStatus.APPROVED);
    expect(result.approvedAt).toBeInstanceOf(Date);
    expect(updateTournamentRegistration.mock.calls[0][0].data).toMatchObject({
      status: TournamentRegistrationStatus.CONFIRMED,
      approvalStatus: RegistrationApprovalStatus.APPROVED,
      rejectedAt: null,
      rejectionReason: null,
    });
  });

  it('approves a paid registration after captain submits payment proof', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-approve-proof-submitted-cup',
      organizerId: 'organizer-1',
      maximumTeams: 8,
      registrationFee: { toString: () => '150.00' },
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-approve-proof-submitted-registration',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord(),
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        paymentStatus: RegistrationPaymentStatus.PROOF_SUBMITTED,
      }),
    ];

    const result = await service.approveOrganizerTournamentRegistration(
      'organizer-1',
      'organizer-approve-proof-submitted-cup',
      'organizer-approve-proof-submitted-registration',
    );

    expect(result.status).toBe(TournamentRegistrationStatus.CONFIRMED);
    expect(result.paymentStatus).toBe(
      RegistrationPaymentStatus.PROOF_SUBMITTED,
    );
    expect(result.approvalStatus).toBe(RegistrationApprovalStatus.APPROVED);
  });

  it('rejects approving unpaid registrations or over capacity', async () => {
    const unpaidTournament = createTournamentRecord({
      id: 'organizer-approve-unpaid-cup',
      organizerId: 'organizer-1',
      maximumTeams: 8,
    });
    createdTournaments.push(unpaidTournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-approve-unpaid-registration',
        tournamentId: unpaidTournament.id,
        tournament: unpaidTournament,
        team: createTeamRecord(),
        paymentStatus: RegistrationPaymentStatus.PENDING,
      }),
    ];

    await expect(
      service.approveOrganizerTournamentRegistration(
        'organizer-1',
        'organizer-approve-unpaid-cup',
        'organizer-approve-unpaid-registration',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    const fullTournament = createTournamentRecord({
      id: 'organizer-approve-full-cup',
      organizerId: 'organizer-1',
      maximumTeams: 1,
    });
    createdTournaments.push(fullTournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-approve-pending-registration',
        tournamentId: fullTournament.id,
        tournament: fullTournament,
        team: createTeamRecord({ id: 'pending-team' }),
      }),
      createTournamentRegistrationRecord({
        id: 'organizer-approve-confirmed-registration',
        tournamentId: fullTournament.id,
        tournament: fullTournament,
        teamId: 'confirmed-team',
        team: createTeamRecord({ id: 'confirmed-team' }),
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
      }),
    ];

    await expect(
      service.approveOrganizerTournamentRegistration(
        'organizer-1',
        'organizer-approve-full-cup',
        'organizer-approve-pending-registration',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects approval when team is no longer eligible', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-approve-ineligible-cup',
      organizerId: 'organizer-1',
      maximumTeams: 8,
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-approve-ineligible-registration',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord({ status: TeamStatus.SUSPENDED }),
      }),
    ];

    await expect(
      service.approveOrganizerTournamentRegistration(
        'organizer-1',
        'organizer-approve-ineligible-cup',
        'organizer-approve-ineligible-registration',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a pending registration with a required reason', async () => {
    const tournament = createTournamentRecord({
      id: 'organizer-reject-cup',
      organizerId: 'organizer-1',
    });
    createdTournaments.push(tournament);
    tournamentRegistrations = [
      createTournamentRegistrationRecord({
        id: 'organizer-reject-registration',
        tournamentId: tournament.id,
        tournament,
        team: createTeamRecord(),
      }),
    ];

    const result = await service.rejectOrganizerTournamentRegistration(
      'organizer-1',
      'organizer-reject-cup',
      'organizer-reject-registration',
      { reason: 'Roster does not meet tournament requirements.' },
    );

    expect(result.status).toBe(TournamentRegistrationStatus.REJECTED);
    expect(result.approvalStatus).toBe(RegistrationApprovalStatus.REJECTED);
    expect(result.rejectionReason).toBe(
      'Roster does not meet tournament requirements.',
    );
    expect(result.rejectedAt).toBeInstanceOf(Date);
  });

  it('returns public on-site tournament details with venue and gaming-room hardware only', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        name: 'Public On-site Detail Cup',
        slug: 'public-onsite-detail-cup',
        status: TournamentStatus.PUBLISHED,
        mode: TournamentMode.ONSITE,
        venue: createVenueRecord({
          id: 'venue-public-detail',
          tournamentId: 'tournament-5',
          emergencyContact: 'private emergency phone',
          gamingRooms: [
            createGamingRoomRecord({
              id: 'gaming-room-public-detail',
              venueId: 'venue-public-detail',
              equipmentNotes: 'Internal station account password.',
            }),
          ],
        }),
      }),
    );

    const result = await service.getPublicTournamentDetails(
      'public-onsite-detail-cup',
    );

    expect(result.mode).toBe(TournamentMode.ONSITE);
    expect(result.onlineConfiguration).toBeNull();
    expect(result.venue?.location).toEqual({
      name: 'CLUTCHA Arena Cairo',
      country: 'EG',
      city: 'Cairo',
      address: '90 Street, New Cairo',
      mapUrl: 'https://maps.example.com/clutcha-arena',
      checkInLocation: 'Main reception',
    });
    expect(result.venue?.policy).toEqual({
      parkingInfo: 'Underground parking is available.',
      spectatorPolicy: 'Spectators must register at reception.',
      venueRules: 'No food near gaming stations.',
    });
    expect(result.venue).not.toHaveProperty('emergencyContact');
    expect(result.venue?.gamingRooms).toHaveLength(1);
    expect(result.venue?.gamingRooms[0]).toMatchObject({
      id: 'gaming-room-public-detail',
      stationCount: 20,
      pcSpecs: {
        cpu: 'Intel Core i7-14700K',
        gpu: 'NVIDIA RTX 4070 Super',
        ram: '32GB DDR5',
        storage: '1TB NVMe SSD',
        operatingSystem: 'Windows 11 Pro',
      },
      monitor: {
        model: 'XL2546K',
        refreshRateHz: 240,
      },
      peripherals: {
        mouse: 'Logitech G Pro X Superlight',
        keyboard: 'Wooting 60HE',
        headset: 'HyperX Cloud II',
      },
    });
    expect(result.venue?.gamingRooms[0]).not.toHaveProperty('equipmentNotes');
    expect(result.venue?.gamingRooms[0]).not.toHaveProperty(
      'internetConnection',
    );
  });

  it('does not return non-public public tournament details', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        slug: 'private-detail-cup',
        status: TournamentStatus.PUBLISHED,
        visibility: TournamentVisibility.PRIVATE,
      }),
      createTournamentRecord({
        id: 'tournament-6',
        slug: 'cancelled-detail-cup',
        status: TournamentStatus.CANCELLED,
      }),
    );

    await expect(
      service.getPublicTournamentDetails('alpha-valorant-cup'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.getPublicTournamentDetails('private-detail-cup'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.getPublicTournamentDetails('cancelled-detail-cup'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns private organizer tournament details with publication readiness', async () => {
    const result = await service.getOrganizerTournamentDetails(
      'organizer-1',
      'tournament-1',
    );

    expect(firstFindFirstArgs()).toMatchObject({
      where: {
        id: 'tournament-1',
        organizerId: 'organizer-1',
      },
    });
    expect(result.tournament.id).toBe('tournament-1');
    expect(result.tournament.organizerId).toBe('organizer-1');
    expect(result.publicationReadiness).toEqual({
      ready: true,
      issues: [],
    });
  });

  it('returns online configuration with public and private details separated', async () => {
    const result = await service.getOnlineConfiguration(
      'organizer-1',
      'tournament-1',
    );

    expect(result.tournamentId).toBe('tournament-1');
    expect(result.publicDetails).toEqual({
      serverRegion: 'EU West',
      publicInstructions: 'Join the lobby 15 minutes before match time.',
      connectionRules: 'Use the assigned lobby.',
      evidenceRequired: true,
      screenshotRequirements: 'Upload final scoreboard screenshots.',
      resultSubmissionDeadlineMinutes: 30,
    });
    expect(result.privateDetails).toEqual({
      discordServerUrl: 'https://discord.gg/clutcha',
      captainSupportChannel: '#captain-support',
      matchReportingChannel: '#match-reporting',
      lobbyInstructions: 'Private lobby instructions.',
      privateSupportContact: '+20 100 000 0000',
    });
  });

  it('returns venue configuration with location, policy, and equipment policy separated', async () => {
    const result = await service.getVenue('organizer-1', 'tournament-4');

    expect(result.tournamentId).toBe('tournament-4');
    expect(result.location).toEqual({
      name: 'CLUTCHA Arena Cairo',
      country: 'EG',
      city: 'Cairo',
      address: '90 Street, New Cairo',
      mapUrl: 'https://maps.example.com/clutcha-arena',
      checkInLocation: 'Main reception',
    });
    expect(result.policy).toEqual({
      parkingInfo: 'Underground parking is available.',
      spectatorPolicy: 'Spectators must register at reception.',
      venueRules: 'No food near gaming stations.',
      emergencyContact: '+20 100 000 0000',
    });
    expect(result.equipmentPolicy).toMatchObject({
      equipmentProvided: { pc: true, monitor: true },
      playersMayBring: { mouse: true, keyboard: true },
      playersMustBring: { nationalId: true },
      personalPeripheralsAllowed: true,
      controllersAllowed: false,
      usbDevicesAllowed: false,
      driverInstallationAllowed: false,
    });
  });

  it('upserts venue configuration for organizer-owned on-site tournaments', async () => {
    const result = await service.upsertVenue('organizer-1', 'tournament-4', {
      name: 'Updated Venue',
      country: 'EG',
      city: 'Giza',
      address: 'Smart Village',
      checkInLocation: 'Gate 2',
      equipmentProvided: { pc: true },
      playersMayBring: { headset: true },
      playersMustBring: { nationalId: true },
      personalPeripheralsAllowed: true,
    });

    const upsertArgs = firstVenueUpsertArgs();
    expect(upsertArgs.where).toEqual({ tournamentId: 'tournament-4' });
    expect(upsertArgs.create).toMatchObject({
      tournamentId: 'tournament-4',
      name: 'Updated Venue',
    });
    expect(upsertArgs.update).toMatchObject({
      name: 'Updated Venue',
      city: 'Giza',
    });
    expect(result.location.name).toBe('Updated Venue');
    expect(result.equipmentPolicy.personalPeripheralsAllowed).toBe(true);
  });

  it('rejects venue configuration for online or foreign tournaments', async () => {
    await expect(
      service.upsertVenue('organizer-1', 'tournament-1', {
        name: 'Invalid Venue',
        country: 'EG',
        city: 'Cairo',
        address: '90 Street',
        checkInLocation: 'Reception',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.getVenue('organizer-1', 'tournament-3'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists gaming rooms with hardware and device specifications', async () => {
    const result = await service.listGamingRooms('organizer-1', 'tournament-4');
    const findManyArgs = firstGamingRoomFindManyArgs();

    expect(findManyArgs.where).toEqual({ venueId: 'venue-1' });
    expect(findManyArgs.orderBy).toEqual({ createdAt: 'asc' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.pcSpecs).toEqual({
      cpu: 'Intel Core i7-14700K',
      gpu: 'NVIDIA RTX 4070 Super',
      ram: '32GB DDR5',
      storage: '1TB NVMe SSD',
      operatingSystem: 'Windows 11 Pro',
    });
    expect(result.items[0]?.monitor).toEqual({
      brand: 'BenQ Zowie',
      model: 'XL2546K',
      sizeInches: '24.5',
      resolution: '1920x1080',
      refreshRateHz: 240,
      responseTimeMs: '1',
    });
    expect(result.items[0]?.peripherals).toEqual({
      mouse: 'Logitech G Pro X Superlight',
      keyboard: 'Wooting 60HE',
      headset: 'HyperX Cloud II',
      mousePad: 'SteelSeries QcK Heavy',
      controller: null,
    });
  });

  it('creates gaming rooms for organizer-owned on-site venues', async () => {
    const result = await service.createGamingRoom(
      'organizer-1',
      'tournament-4',
      validGamingRoomDto(),
    );

    expect(firstGamingRoomCreateData()).toMatchObject({
      venueId: 'venue-1',
      purpose: GamingRoomPurpose.COMPETITION,
      stationCount: 20,
      cpu: 'Intel Core i7-14700K',
      gpu: 'NVIDIA RTX 4070 Super',
      monitorModel: 'XL2546K',
      monitorSizeInches: '24.5',
      monitorRefreshRateHz: 240,
      monitorResponseTimeMs: '1.0',
      mouse: 'Logitech G Pro X Superlight',
      keyboard: 'Wooting 60HE',
      headset: 'HyperX Cloud II',
    });
    expect(result.venueId).toBe('venue-1');
    expect(result.stationCount).toBe(20);
    expect(result.pcSpecs.gpu).toBe('NVIDIA RTX 4070 Super');
  });

  it('gets, updates, and deletes an owned gaming room', async () => {
    const detail = await service.getGamingRoom(
      'organizer-1',
      'tournament-4',
      'gaming-room-1',
    );

    expect(detail.id).toBe('gaming-room-1');

    const updated = await service.updateGamingRoom(
      'organizer-1',
      'tournament-4',
      'gaming-room-1',
      {
        stationCount: 24,
        gpu: 'NVIDIA RTX 4080',
      },
    );

    expect(firstGamingRoomUpdateData()).toMatchObject({
      stationCount: 24,
      gpu: 'NVIDIA RTX 4080',
    });
    expect(updated.stationCount).toBe(24);
    expect(updated.pcSpecs.gpu).toBe('NVIDIA RTX 4080');

    await service.deleteGamingRoom(
      'organizer-1',
      'tournament-4',
      'gaming-room-1',
    );

    expect(deleteGamingRoom).toHaveBeenCalledWith({
      where: { id: 'gaming-room-1' },
      select: { id: true },
    });
    expect(gamingRooms.some((item) => item.id === 'gaming-room-1')).toBe(false);
  });

  it('rejects gaming rooms for online, foreign, or venue-less tournaments', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        mode: TournamentMode.ONSITE,
        slug: 'venue-less-cup',
      }),
    );

    await expect(
      service.createGamingRoom(
        'organizer-1',
        'tournament-1',
        validGamingRoomDto(),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.listGamingRooms('organizer-1', 'tournament-3'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.createGamingRoom(
        'organizer-1',
        'tournament-5',
        validGamingRoomDto(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not return gaming rooms outside the owned venue', async () => {
    gamingRooms.push(
      createGamingRoomRecord({
        id: 'gaming-room-2',
        venueId: 'other-venue',
      }),
    );

    await expect(
      service.getGamingRoom('organizer-1', 'tournament-4', 'gaming-room-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('upserts online configuration for organizer-owned online tournaments', async () => {
    const result = await service.upsertOnlineConfiguration(
      'organizer-1',
      'tournament-2',
      {
        serverRegion: 'MENA',
        publicInstructions: 'Public instructions',
        evidenceRequired: false,
        discordServerUrl: 'https://discord.gg/new-config',
        privateSupportContact: 'private support',
      },
    );

    const upsertArgs = firstOnlineConfigurationUpsertArgs();
    expect(upsertArgs.where).toEqual({ tournamentId: 'tournament-2' });
    expect(upsertArgs.create).toMatchObject({
      tournamentId: 'tournament-2',
      serverRegion: 'MENA',
    });
    expect(upsertArgs.update).toMatchObject({
      serverRegion: 'MENA',
    });
    expect(result.publicDetails.serverRegion).toBe('MENA');
    expect(result.privateDetails.discordServerUrl).toBe(
      'https://discord.gg/new-config',
    );
  });

  it('rejects online configuration for on-site or foreign tournaments', async () => {
    await expect(
      service.upsertOnlineConfiguration('organizer-1', 'tournament-4', {
        serverRegion: 'MENA',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.getOnlineConfiguration('organizer-1', 'tournament-3'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns not found when online configuration has not been created', async () => {
    await expect(
      service.getOnlineConfiguration('organizer-1', 'tournament-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates organizer-owned draft tournaments and regenerates slug when the name changes', async () => {
    const result = await service.updateOrganizerTournamentDraft(
      'organizer-1',
      'tournament-1',
      {
        name: 'Updated Alpha Cup',
        maximumTeams: 24,
      },
    );

    expect(result.name).toBe('Updated Alpha Cup');
    expect(result.slug).toBe('updated-alpha-cup');
    expect(result.maximumTeams).toBe(24);
    expect(firstUpdateData()).toMatchObject({
      name: 'Updated Alpha Cup',
      slug: 'updated-alpha-cup',
      maximumTeams: 24,
    });
  });

  it('rejects draft updates that would violate lifecycle or validation rules', async () => {
    await expect(
      service.updateOrganizerTournamentDraft('organizer-1', 'tournament-2', {
        name: 'Nope',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expectValidationIssues(
      service.updateOrganizerTournamentDraft('organizer-1', 'tournament-1', {
        maximumTeams: 4,
      }),
      ['maximumTeams'],
    );
  });

  it('deletes organizer-owned draft tournaments', async () => {
    await service.deleteOrganizerTournamentDraft('organizer-1', 'tournament-1');

    expect(deleteTournament).toHaveBeenCalledWith({
      where: { id: 'tournament-1' },
      select: { id: true },
    });
    expect(createdTournaments.some((item) => item.id === 'tournament-1')).toBe(
      false,
    );
  });

  it('rejects deleting non-draft or foreign tournaments', async () => {
    await expect(
      service.deleteOrganizerTournamentDraft('organizer-1', 'tournament-2'),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.deleteOrganizerTournamentDraft('organizer-1', 'tournament-3'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns readiness issues for missing mode-specific publication data', async () => {
    const result = await service.getOrganizerTournamentDetails(
      'organizer-1',
      'tournament-2',
    );

    expect(result.publicationReadiness.ready).toBe(false);
    expect(
      result.publicationReadiness.issues.some(
        (issue) => issue.field === 'onlineConfiguration',
      ),
    ).toBe(true);
  });

  it('returns structured readiness issues for invalid general publication data', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        name: ' ',
        slug: 'invalid-general-cup',
        gameKey: ' ',
        rules: ' ',
        maximumTeams: 4,
        minimumTeams: 8,
        maximumStarters: 4,
        minimumStarters: 5,
        defaultBestOf: 2,
        finalBestOf: 4,
        registrationClosesAt: new Date('2026-09-01T09:00:00.000Z'),
        rosterLocksAt: new Date('2026-09-15T10:00:00.000Z'),
        checkInOpensAt: new Date('2026-09-12T18:00:00.000Z'),
        checkInClosesAt: new Date('2026-09-12T17:00:00.000Z'),
        endsAt: new Date('2026-09-12T17:00:00.000Z'),
        maximumWaitlistSize: 8,
        timezone: 'Mars/OlympusMons',
        onlineConfiguration: createOnlineConfigurationRecord({
          id: 'online-config-invalid-general',
        }),
      }),
    );

    const result = await service.getOrganizerTournamentDetails(
      'organizer-1',
      'tournament-5',
    );

    expect(result.publicationReadiness.ready).toBe(false);
    expectPublicationIssueFields(result.publicationReadiness.issues, [
      'name',
      'gameKey',
      'rules',
      'registrationClosesAt',
      'rosterLocksAt',
      'checkInClosesAt',
      'endsAt',
      'maximumTeams',
      'maximumStarters',
      'defaultBestOf',
      'finalBestOf',
      'maximumWaitlistSize',
      'timezone',
    ]);
  });

  it('returns readiness issues for incomplete online configuration', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        slug: 'incomplete-online-cup',
        onlineConfiguration: createOnlineConfigurationRecord({
          id: 'online-config-incomplete',
          serverRegion: ' ',
          evidenceRequired: true,
          screenshotRequirements: ' ',
        }),
      }),
    );

    const result = await service.getOrganizerTournamentDetails(
      'organizer-1',
      'tournament-5',
    );

    expect(result.publicationReadiness.ready).toBe(false);
    expectPublicationIssueFields(result.publicationReadiness.issues, [
      'onlineConfiguration.serverRegion',
      'onlineConfiguration.screenshotRequirements',
    ]);
  });

  it('returns readiness issues for incomplete on-site venue and gaming-room hardware', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        mode: TournamentMode.ONSITE,
        slug: 'incomplete-onsite-cup',
        venue: createVenueRecord({
          id: 'venue-incomplete',
          tournamentId: 'tournament-5',
          name: ' ',
          country: ' ',
          city: ' ',
          address: ' ',
          checkInLocation: ' ',
          equipmentProvided: null,
          gamingRooms: [
            createGamingRoomRecord({
              id: 'gaming-room-incomplete',
              venueId: 'venue-incomplete',
              name: ' ',
              stationCount: 0,
              cpu: ' ',
              gpu: ' ',
              ram: null,
              storage: null,
              operatingSystem: null,
              monitorModel: ' ',
              monitorRefreshRateHz: 1,
              mouse: ' ',
              keyboard: ' ',
              headset: ' ',
            }),
          ],
        }),
      }),
    );

    const result = await service.getOrganizerTournamentDetails(
      'organizer-1',
      'tournament-5',
    );

    expect(result.publicationReadiness.ready).toBe(false);
    expectPublicationIssueFields(result.publicationReadiness.issues, [
      'venue.name',
      'venue.country',
      'venue.city',
      'venue.address',
      'venue.checkInLocation',
      'venue.equipmentProvided',
      'gamingRooms.0.name',
      'gamingRooms.0.stationCount',
      'gamingRooms.0.cpu',
      'gamingRooms.0.gpu',
      'gamingRooms.0.ram',
      'gamingRooms.0.storage',
      'gamingRooms.0.operatingSystem',
      'gamingRooms.0.monitorModel',
      'gamingRooms.0.monitorRefreshRateHz',
      'gamingRooms.0.mouse',
      'gamingRooms.0.keyboard',
      'gamingRooms.0.headset',
    ]);
  });

  it('publishes ready draft tournaments atomically', async () => {
    const result = await service.publishOrganizerTournament(
      'organizer-1',
      'tournament-4',
    );

    expect(firstFindFirstArgs()).toMatchObject({
      where: {
        id: 'tournament-4',
        organizerId: 'organizer-1',
      },
    });
    expect(firstUpdateData()).toMatchObject({
      status: TournamentStatus.PUBLISHED,
    });
    expect(result.status).toBe(TournamentStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('rejects publishing non-draft or not-ready tournaments', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        slug: 'not-ready-online-cup',
        onlineConfiguration: null,
      }),
    );

    await expect(
      service.publishOrganizerTournament('organizer-1', 'tournament-2'),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.publishOrganizerTournament('organizer-1', 'tournament-5'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('opens and closes tournament registration atomically', async () => {
    const publishedTournament = createdTournaments.find(
      (item) => item.id === 'tournament-2',
    );

    if (!publishedTournament) {
      throw new Error('Expected tournament-2 to exist.');
    }

    publishedTournament.registrationOpensAt = new Date(
      '2026-09-20T10:00:00.000Z',
    );
    publishedTournament.checkInOpensAt = new Date('2026-09-12T16:00:00.000Z');
    publishedTournament.checkInClosesAt = new Date('2026-09-12T17:00:00.000Z');

    const opened = await service.openOrganizerTournamentRegistration(
      'organizer-1',
      'tournament-2',
    );

    expect(opened.status).toBe(TournamentStatus.REGISTRATION_OPEN);
    expect(opened.registrationOpenedAt).toBeInstanceOf(Date);
    expect(opened.registrationOpensAt).toEqual(opened.registrationOpenedAt);

    publishedTournament.status = TournamentStatus.REGISTRATION_OPEN;
    expect(publishedTournament.registrationOpensAt).toEqual(
      publishedTournament.registrationOpenedAt,
    );

    const closed = await service.closeOrganizerTournamentRegistration(
      'organizer-1',
      'tournament-2',
    );

    expect(closed.status).toBe(TournamentStatus.REGISTRATION_CLOSED);
    expect(closed.registrationClosedAt).toBeInstanceOf(Date);

    const checkInOpened = await service.openOrganizerTournamentCheckIn(
      'organizer-1',
      'tournament-2',
    );

    expect(checkInOpened.status).toBe(TournamentStatus.CHECK_IN_OPEN);
    expect(checkInOpened.checkInOpensAt).toBeInstanceOf(Date);
    expect(checkInOpened.checkInOpensAt).not.toEqual(
      new Date('2026-09-12T16:00:00.000Z'),
    );
  });

  it('rejects invalid registration lifecycle transitions', async () => {
    await expect(
      service.openOrganizerTournamentRegistration(
        'organizer-1',
        'tournament-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.closeOrganizerTournamentRegistration(
        'organizer-1',
        'tournament-2',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.openOrganizerTournamentCheckIn('organizer-1', 'tournament-2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels cancellable tournaments with a reason', async () => {
    const result = await service.cancelOrganizerTournament(
      'organizer-1',
      'tournament-2',
      {
        reason: 'Venue became unavailable.',
      },
    );

    expect(result.status).toBe(TournamentStatus.CANCELLED);
    expect(result.cancelledAt).toBeInstanceOf(Date);
    expect(result.cancellationReason).toBe('Venue became unavailable.');
  });

  it('rejects cancelling terminal or foreign tournaments', async () => {
    createdTournaments.push(
      createTournamentRecord({
        id: 'tournament-5',
        organizerId: 'organizer-1',
        slug: 'completed-cup',
        status: TournamentStatus.COMPLETED,
      }),
    );

    await expect(
      service.cancelOrganizerTournament('organizer-1', 'tournament-5', {
        reason: 'Cannot cancel completed tournament.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.cancelOrganizerTournament('organizer-1', 'tournament-3', {
        reason: 'Foreign tournament.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not return details for tournaments owned by another organizer', async () => {
    await expect(
      service.getOrganizerTournamentDetails('organizer-1', 'tournament-3'),
    ).rejects.toBeInstanceOf(NotFoundException);
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

const validGamingRoomDto = (
  overrides: Partial<CreateGamingRoomDto> = {},
): CreateGamingRoomDto => ({
  name: 'Main Stage Room',
  description: 'Primary competition room.',
  purpose: GamingRoomPurpose.COMPETITION,
  stationCount: 20,
  cpu: 'Intel Core i7-14700K',
  gpu: 'NVIDIA RTX 4070 Super',
  ram: '32GB DDR5',
  storage: '1TB NVMe SSD',
  operatingSystem: 'Windows 11 Pro',
  monitorBrand: 'BenQ Zowie',
  monitorModel: 'XL2546K',
  monitorSizeInches: 24.5,
  monitorResolution: '1920x1080',
  monitorRefreshRateHz: 240,
  monitorResponseTimeMs: 1,
  mouse: 'Logitech G Pro X Superlight',
  keyboard: 'Wooting 60HE',
  headset: 'HyperX Cloud II',
  mousePad: 'SteelSeries QcK Heavy',
  internetConnection: 'Dedicated wired fiber connection.',
  equipmentNotes: 'All PCs have tournament accounts preloaded.',
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
  onlineConfiguration: null,
  venue: null,
  createdAt: new Date('2026-08-02T12:00:00.000Z'),
  updatedAt: new Date('2026-08-02T12:00:00.000Z'),
  ...overrides,
});

const createUserRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'captain-1',
  email: 'captain@example.com',
  displayName: 'Captain One',
  phoneNumber: '+201001234567',
  discordUsername: null,
  role: UserRole.CAPTAIN,
  status: UserStatus.ACTIVE,
  ...overrides,
});

const createTeamRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'team-1',
  name: 'Cairo Titans',
  slug: 'cairo-titans',
  gameKey: 'valorant',
  region: 'MENA',
  status: TeamStatus.ACTIVE,
  captainId: 'captain-1',
  rosterPlayers: [],
  ...overrides,
});

const createRosterPlayerRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'starter-1',
  gamerTag: 'Starter One',
  gameAccountId: 'VALORANT#1234',
  phoneNumber: '+201001234567',
  country: 'EG',
  rank: 'Gold',
  rosterType: RosterType.STARTER,
  eligibilityStatus: EligibilityStatus.PENDING_REVIEW,
  ...overrides,
});

const createTournamentRegistrationRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'registration-1',
  tournamentId: 'tournament-1',
  teamId: 'team-1',
  captainId: 'captain-1',
  status: TournamentRegistrationStatus.PENDING_APPROVAL,
  paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
  approvalStatus: RegistrationApprovalStatus.PENDING,
  rosterSnapshot: [],
  captainContactSnapshot: {},
  rulesVersion: '1.0',
  rulesAcceptedAt: new Date('2026-08-04T16:00:00.000Z'),
  submittedAt: new Date('2026-08-04T16:00:00.000Z'),
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  withdrawnAt: null,
  checkedInAt: null,
  disqualifiedAt: null,
  createdAt: new Date('2026-08-04T16:00:00.000Z'),
  updatedAt: new Date('2026-08-04T16:00:00.000Z'),
  ...overrides,
});

const createTournamentMatchGameRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'match-game-1',
  matchId: 'match-1',
  gameNumber: 1,
  mapName: 'Bind',
  teamAScore: null,
  teamBScore: null,
  winnerTeamId: null,
  evidenceUrl: null,
  createdAt: new Date('2026-08-06T12:00:00.000Z'),
  updatedAt: new Date('2026-08-06T12:00:00.000Z'),
  ...overrides,
});

const createTournamentMatchRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => {
  const tournamentId =
    typeof overrides.tournamentId === 'string'
      ? overrides.tournamentId
      : 'tournament-1';
  const teamAId =
    typeof overrides.teamAId === 'string' ? overrides.teamAId : 'team-1';
  const teamBId =
    typeof overrides.teamBId === 'string' ? overrides.teamBId : 'opponent-team';
  const tournament =
    createdTournaments.find((item) => item.id === tournamentId) ??
    createTournamentRecord({ id: tournamentId });
  const teamA =
    teams.find((item) => item.id === teamAId) ??
    createTeamRecord({ id: teamAId, name: 'Captain Team' });
  const teamB =
    teams.find((item) => item.id === teamBId) ??
    createTeamRecord({
      id: teamBId,
      captainId: 'opponent-captain',
      name: 'Opponent Team',
    });
  const gamingRoom =
    typeof overrides.gamingRoomId === 'string'
      ? gamingRooms.find((item) => item.id === overrides.gamingRoomId)
      : null;

  return {
    id: 'match-1',
    tournamentId,
    stage: 'GROUP_STAGE',
    round: 1,
    bracketPosition: 'A1',
    bestOf: 3,
    scheduledAt: new Date('2026-09-12T18:00:00.000Z'),
    teamAId,
    teamBId,
    winnerTeamId: null,
    status: TournamentMatchStatus.SCHEDULED,
    teamAScore: null,
    teamBScore: null,
    forfeitStatus: TournamentMatchForfeitStatus.NONE,
    officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
    disputeStatus: TournamentMatchDisputeStatus.NONE,
    evidenceUrl: null,
    onlineServerInfo: null,
    gamingRoomId: null,
    onsiteStationLabel: null,
    tournament,
    teamA,
    teamB,
    gamingRoom: gamingRoom ?? null,
    games: [],
    createdAt: new Date('2026-08-06T12:00:00.000Z'),
    updatedAt: new Date('2026-08-06T12:00:00.000Z'),
    ...overrides,
  };
};

function filterTournamentRegistrations(
  where: Record<string, unknown>,
): Record<string, unknown>[] {
  return tournamentRegistrations.filter((registration) => {
    if (
      typeof where.tournamentId === 'string' &&
      registration.tournamentId !== where.tournamentId
    ) {
      return false;
    }

    if (
      typeof where.teamId === 'string' &&
      registration.teamId !== where.teamId
    ) {
      return false;
    }

    if (
      typeof where.captainId === 'string' &&
      registration.captainId !== where.captainId
    ) {
      return false;
    }

    if (
      typeof where.status === 'string' &&
      registration.status !== where.status
    ) {
      return false;
    }

    const statusFilter = where.status as { in?: string[] } | undefined;
    if (
      statusFilter?.in &&
      !statusFilter.in.includes(String(registration.status))
    ) {
      return false;
    }

    const tournamentFilter = where.tournament as
      | {
          gameKey?: { equals: string };
          mode?: TournamentMode;
          startsAt?: { gte?: Date; lt?: Date };
        }
      | undefined;
    const tournament = registration.tournament as
      Record<string, unknown> | undefined;

    if (tournamentFilter && !tournament) {
      return false;
    }

    if (
      tournamentFilter?.gameKey &&
      String(tournament?.gameKey).toLowerCase() !==
        tournamentFilter.gameKey.equals.toLowerCase()
    ) {
      return false;
    }

    if (tournamentFilter?.mode && tournament?.mode !== tournamentFilter.mode) {
      return false;
    }

    const startsAt = tournament?.startsAt;
    if (
      tournamentFilter?.startsAt?.gte &&
      startsAt instanceof Date &&
      startsAt < tournamentFilter.startsAt.gte
    ) {
      return false;
    }

    if (
      tournamentFilter?.startsAt?.lt &&
      startsAt instanceof Date &&
      startsAt >= tournamentFilter.startsAt.lt
    ) {
      return false;
    }

    return true;
  });
}

function filterTournamentMatches(
  where: TournamentMatchWhere,
): Record<string, unknown>[] {
  return tournamentMatches.filter((match) => {
    if (where.id && match.id !== where.id) {
      return false;
    }

    if (where.tournamentId && match.tournamentId !== where.tournamentId) {
      return false;
    }

    if (
      where.OR &&
      !where.OR.some((condition) => matchMatchesTeam(match, condition))
    ) {
      return false;
    }

    return true;
  });
}

function matchMatchesTeam(
  match: Record<string, unknown>,
  condition: { teamAId?: string; teamBId?: string },
): boolean {
  return (
    (condition.teamAId !== undefined && match.teamAId === condition.teamAId) ||
    (condition.teamBId !== undefined && match.teamBId === condition.teamBId)
  );
}

function compareTournamentMatches(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): number {
  const leftDate = left.scheduledAt;
  const rightDate = right.scheduledAt;

  if (leftDate instanceof Date && rightDate instanceof Date) {
    return leftDate.getTime() - rightDate.getTime();
  }

  return Number(left.round ?? 0) - Number(right.round ?? 0);
}

function sortTournamentRegistrations(
  registrations: Record<string, unknown>[],
  orderBy: Record<string, unknown>,
): Record<string, unknown>[] {
  const direction =
    orderBy.submittedAt === SortDirection.ASC ||
    (orderBy.tournament as { startsAt?: string } | undefined)?.startsAt ===
      SortDirection.ASC
      ? 1
      : -1;

  return [...registrations].sort((left, right) => {
    const leftValue = getRegistrationSortValue(left, orderBy);
    const rightValue = getRegistrationSortValue(right, orderBy);

    return (leftValue - rightValue) * direction;
  });
}

function getRegistrationSortValue(
  registration: Record<string, unknown>,
  orderBy: Record<string, unknown>,
): number {
  if (orderBy.tournament) {
    const tournament = registration.tournament as Record<string, unknown>;
    const startsAt = tournament.startsAt;
    return startsAt instanceof Date ? startsAt.getTime() : 0;
  }

  const submittedAt = registration.submittedAt;
  return submittedAt instanceof Date ? submittedAt.getTime() : 0;
}

const createGamingRoomRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'gaming-room-1',
  venueId: 'venue-1',
  name: 'Main Stage Room',
  description: 'Primary competition room.',
  purpose: GamingRoomPurpose.COMPETITION,
  stationCount: 20,
  cpu: 'Intel Core i7-14700K',
  gpu: 'NVIDIA RTX 4070 Super',
  ram: '32GB DDR5',
  storage: '1TB NVMe SSD',
  operatingSystem: 'Windows 11 Pro',
  monitorBrand: 'BenQ Zowie',
  monitorModel: 'XL2546K',
  monitorSizeInches: { toString: () => '24.5' },
  monitorResolution: '1920x1080',
  monitorRefreshRateHz: 240,
  monitorResponseTimeMs: { toString: () => '1' },
  mouse: 'Logitech G Pro X Superlight',
  keyboard: 'Wooting 60HE',
  headset: 'HyperX Cloud II',
  mousePad: 'SteelSeries QcK Heavy',
  controller: null,
  internetConnection: 'Dedicated wired fiber connection.',
  equipmentNotes: 'All PCs have tournament accounts preloaded.',
  createdAt: new Date('2026-08-02T12:00:00.000Z'),
  updatedAt: new Date('2026-08-02T12:00:00.000Z'),
  ...overrides,
});

const createOnlineConfigurationRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'online-config-1',
  tournamentId: 'tournament-1',
  serverRegion: 'EU West',
  publicInstructions: 'Join the lobby 15 minutes before match time.',
  connectionRules: 'Use the assigned lobby.',
  evidenceRequired: true,
  screenshotRequirements: 'Upload final scoreboard screenshots.',
  resultSubmissionDeadlineMinutes: 30,
  discordServerUrl: 'https://discord.gg/clutcha',
  captainSupportChannel: '#captain-support',
  matchReportingChannel: '#match-reporting',
  lobbyInstructions: 'Private lobby instructions.',
  privateSupportContact: '+20 100 000 0000',
  createdAt: new Date('2026-08-02T12:00:00.000Z'),
  updatedAt: new Date('2026-08-02T12:00:00.000Z'),
  ...overrides,
});

const createVenueRecord = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 'venue-1',
  tournamentId: 'tournament-4',
  name: 'CLUTCHA Arena Cairo',
  country: 'EG',
  city: 'Cairo',
  address: '90 Street, New Cairo',
  mapUrl: 'https://maps.example.com/clutcha-arena',
  checkInLocation: 'Main reception',
  parkingInfo: 'Underground parking is available.',
  spectatorPolicy: 'Spectators must register at reception.',
  venueRules: 'No food near gaming stations.',
  emergencyContact: '+20 100 000 0000',
  equipmentProvided: { pc: true, monitor: true },
  playersMayBring: { mouse: true, keyboard: true },
  playersMustBring: { nationalId: true },
  personalPeripheralsAllowed: true,
  controllersAllowed: false,
  usbDevicesAllowed: false,
  driverInstallationAllowed: false,
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
    if (where.id && tournament.id !== where.id) {
      return false;
    }
    if (where.slug && tournament.slug !== where.slug) {
      return false;
    }
    if (isNotIdFilter(where.NOT) && tournament.id === where.NOT.id) {
      return false;
    }
    if (isEnumInFilter(where.status)) {
      if (!where.status.in.includes(tournament.status)) {
        return false;
      }
    } else if (where.status && tournament.status !== where.status) {
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

const isNotIdFilter = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string';

const isEnumInFilter = (value: unknown): value is { in: unknown[] } =>
  typeof value === 'object' &&
  value !== null &&
  'in' in value &&
  Array.isArray(value.in);

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

const expectPublicationIssueFields = (
  issues: Array<{ field: string; message: string }>,
  expectedFields: string[],
): void => {
  expect(issues.map((issue) => issue.field)).toEqual(
    expect.arrayContaining(expectedFields),
  );
  expect(
    issues.every((issue) => issue.field.length > 0 && issue.message.length > 0),
  ).toBe(true);
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
