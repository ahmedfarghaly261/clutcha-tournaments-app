import { ConflictException } from '@nestjs/common';
import {
  RegistrationApprovalStatus,
  TournamentFormat,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentSeedingMethod,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { TournamentCoverImageStorageService } from '../services/tournament-cover-image-storage.service';
import { TournamentConfigurationService } from '../services/tournament-configuration.service';
import { TournamentEligibilityService } from '../services/tournament-eligibility.service';
import { TournamentLifecycleService } from '../services/tournament-lifecycle.service';
import { TournamentPaymentService } from '../services/tournament-payment.service';
import { TournamentQueryService } from '../services/tournament-query.service';
import { TournamentsService } from '../services/tournaments.service';

jest.mock('@clutcha/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
  EligibilityStatus: {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE: 'INELIGIBLE',
    PENDING_REVIEW: 'PENDING_REVIEW',
  },
  GamingRoomPurpose: {
    COMPETITION: 'COMPETITION',
    PRACTICE: 'PRACTICE',
    WARMUP: 'WARMUP',
    FINAL_STAGE: 'FINAL_STAGE',
    BACKUP: 'BACKUP',
  },
  RegistrationApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
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
  TournamentFormat: {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
    DOUBLE_ELIMINATION: 'DOUBLE_ELIMINATION',
    ROUND_ROBIN: 'ROUND_ROBIN',
    GROUPS_THEN_PLAYOFFS: 'GROUPS_THEN_PLAYOFFS',
    SWISS: 'SWISS',
    BATTLE_ROYALE: 'BATTLE_ROYALE',
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
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
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
}));

type CreatedMatch = {
  tournamentId: string;
  stage: string;
  round: number;
  bracketPosition: string;
  bestOf: number;
  teamAId: string | null;
  teamBId: string | null;
};

type BracketTeamMock = {
  id: string;
  name: string;
  logoUrl: null;
};

type ScheduledMatchRecord = CreatedMatch & {
  id: string;
  scheduledAt: Date | null;
  status: TournamentMatchStatus;
  teamAScore: number | null;
  teamBScore: number | null;
  winnerTeamId: string | null;
  officialResultStatus: TournamentMatchOfficialResultStatus;
  onlineServerInfo: unknown;
  gamingRoomId: string | null;
  onsiteStationLabel: string | null;
  teamA: BracketTeamMock | null;
  teamB: BracketTeamMock | null;
  gamingRoom: { id: string; name: string } | null;
};

type ScheduleUpdateData = {
  scheduledAt: Date;
  status: TournamentMatchStatus;
  onlineServerInfo: unknown;
  gamingRoomId: string | null;
  onsiteStationLabel: string | null;
};

describe('TournamentsService organizer bracket', () => {
  const tournamentId = 'b33be298-f30b-45f3-ae27-83bc249d3a7c';
  const organizerId = '006b3a14-f251-458d-a37d-1366b7364725';
  const teams: BracketTeamMock[] = [
    {
      id: '153427cc-52d6-48f8-bc84-548047b079ce',
      name: 'Seed One',
      logoUrl: null,
    },
    {
      id: '6aaf9260-bce1-4292-896d-56fe8fb66fd3',
      name: 'Seed Two',
      logoUrl: null,
    },
    {
      id: '797beae7-4d19-45f9-a6fa-69546fd78ace',
      name: 'Seed Three',
      logoUrl: null,
    },
  ];

  let createdMatches: CreatedMatch[];
  let scheduledMatch: ScheduledMatchRecord;
  let tournamentMode: TournamentMode;
  let createMany: jest.Mock;
  let updateMatch: jest.Mock;
  let service: TournamentsService;

  beforeEach(() => {
    createdMatches = [];
    tournamentMode = TournamentMode.ONLINE;
    scheduledMatch = {
      id: 'f9e59dda-69b3-4d75-80ac-00cc0f8a835e',
      tournamentId,
      stage: 'MAIN_BRACKET',
      round: 1,
      bracketPosition: 'R1-M1',
      bestOf: 1,
      teamAId: teams[0].id,
      teamBId: teams[1].id,
      scheduledAt: null,
      status: TournamentMatchStatus.SCHEDULED,
      teamAScore: null,
      teamBScore: null,
      winnerTeamId: null,
      officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
      onlineServerInfo: null,
      gamingRoomId: null,
      onsiteStationLabel: null,
      teamA: teams[0],
      teamB: teams[1],
      gamingRoom: null,
    };
    createMany = jest.fn(
      ({ data }: { data: CreatedMatch[] }): Promise<{ count: number }> => {
        createdMatches = data;
        return Promise.resolve({ count: data.length });
      },
    );
    updateMatch = jest.fn(
      ({
        data,
      }: {
        data: ScheduleUpdateData;
      }): Promise<ScheduledMatchRecord> => {
        scheduledMatch = {
          ...scheduledMatch,
          ...data,
          gamingRoom: data.gamingRoomId
            ? { id: data.gamingRoomId, name: 'Main Stage' }
            : null,
        };
        return Promise.resolve(scheduledMatch);
      },
    );

    const tournament = {
      id: tournamentId,
      organizerId,
      name: 'Organizer Cup',
      status: TournamentStatus.REGISTRATION_CLOSED,
      format: TournamentFormat.SINGLE_ELIMINATION,
      seedingMethod: TournamentSeedingMethod.MANUAL,
      defaultBestOf: 1,
      finalBestOf: 3,
      thirdPlaceMatch: false,
      mode: TournamentMode.ONLINE,
      timezone: 'Africa/Cairo',
      startsAt: new Date('2026-09-12T16:00:00.000Z'),
      endsAt: new Date('2026-09-13T22:00:00.000Z'),
    };
    const transactionClient = {
      tournament: {
        findFirst: jest.fn(() =>
          Promise.resolve({ ...tournament, mode: tournamentMode }),
        ),
      },
      tournamentRegistration: {
        findMany: jest.fn(() =>
          Promise.resolve(
            teams.map((team) => ({
              approvalStatus: RegistrationApprovalStatus.APPROVED,
              status: TournamentRegistrationStatus.CONFIRMED,
              team,
            })),
          ),
        ),
      },
      tournamentMatch: {
        count: jest.fn(() => Promise.resolve(createdMatches.length)),
        createMany,
        findMany: jest.fn(() =>
          Promise.resolve(
            createdMatches.map((match, index) => ({
              id: `match-${index + 1}`,
              ...match,
              scheduledAt: null,
              status: TournamentMatchStatus.SCHEDULED,
              teamAScore: null,
              teamBScore: null,
              winnerTeamId: null,
              officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
              teamA: teams.find((team) => team.id === match.teamAId) ?? null,
              teamB: teams.find((team) => team.id === match.teamBId) ?? null,
              onlineServerInfo: null,
              gamingRoomId: null,
              onsiteStationLabel: null,
              gamingRoom: null,
            })),
          ),
        ),
        findFirst: jest.fn(() => Promise.resolve(scheduledMatch)),
        update: updateMatch,
      },
      tournamentGamingRoom: {
        findFirst: jest.fn(() =>
          Promise.resolve({
            id: 'a1960cc1-c43d-4fba-989c-264312376366',
          }),
        ),
      },
    };
    const client = {
      ...transactionClient,
      $transaction: jest.fn(
        (
          callback: (transaction: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
      ),
    };

    service = new TournamentsService(
      { client } as unknown as DatabaseService,
      {} as TournamentCoverImageStorageService,
      new TournamentQueryService({ client } as unknown as DatabaseService),
      new TournamentConfigurationService({
        client,
      } as unknown as DatabaseService),
      new TournamentEligibilityService({
        client,
      } as unknown as DatabaseService),
      new TournamentLifecycleService({
        client,
      } as unknown as DatabaseService),
      new TournamentPaymentService({
        client,
      } as unknown as DatabaseService),
    );
  });

  it('generates and returns a seeded single-elimination bracket', async () => {
    const result = await service.generateOrganizerTournamentBracket(
      organizerId,
      tournamentId,
      { orderedTeamIds: teams.map((team) => team.id) },
    );

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createdMatches).toHaveLength(3);
    expect(result.generated).toBe(true);
    expect(result.bracketSize).toBe(4);
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0]?.matches[0]?.teamA?.id).toBe(teams[0]?.id);
    expect(result.rounds[0]?.matches[0]?.teamB).toBeNull();
  });

  it('rejects a seed order that does not exactly match approved teams', async () => {
    await expect(
      service.generateOrganizerTournamentBracket(organizerId, tournamentId, {
        orderedTeamIds: [teams[0].id, teams[1].id],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(createMany).not.toHaveBeenCalled();
  });

  it('schedules an online match with private lobby information', async () => {
    const result = await service.scheduleOrganizerTournamentMatch(
      organizerId,
      tournamentId,
      scheduledMatch.id,
      {
        scheduledAt: '2026-09-12T18:00:00.000Z',
        onlineServerInfo: {
          serverRegion: 'MENA',
          lobbyName: 'CLUTCHA-R1-M1',
          lobbyPassword: 'private-password',
        },
      },
    );

    expect(updateMatch).toHaveBeenCalledTimes(1);
    expect(result.scheduledAt).toEqual(new Date('2026-09-12T18:00:00.000Z'));
    expect(result.onlineServerInfo).toEqual({
      serverRegion: 'MENA',
      lobbyName: 'CLUTCHA-R1-M1',
      lobbyPassword: 'private-password',
    });
  });

  it('assigns a tournament gaming room when scheduling an on-site match', async () => {
    tournamentMode = TournamentMode.ONSITE;
    const gamingRoomId = 'a1960cc1-c43d-4fba-989c-264312376366';

    const result = await service.scheduleOrganizerTournamentMatch(
      organizerId,
      tournamentId,
      scheduledMatch.id,
      {
        scheduledAt: '2026-09-12T20:00:00.000Z',
        gamingRoomId,
        onsiteStationLabel: 'Station A-04',
      },
    );

    expect(result.gamingRoomId).toBe(gamingRoomId);
    expect(result.gamingRoomName).toBe('Main Stage');
    expect(result.onsiteStationLabel).toBe('Station A-04');
  });
});
