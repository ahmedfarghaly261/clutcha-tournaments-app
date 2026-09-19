import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EligibilityStatus,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentRegistrationStatus,
  TournamentStatus,
  TournamentVisibility,
  UserRole,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { TournamentEligibilityService } from '../services/tournament-eligibility.service';

jest.mock('@clutcha/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, options: { code: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
  EligibilityStatus: {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE: 'INELIGIBLE',
    PENDING_REVIEW: 'PENDING_REVIEW',
  },
  RegistrationApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    AWAITING_PROOF: 'AWAITING_PROOF',
  },
  RosterType: { STARTER: 'STARTER', SUBSTITUTE: 'SUBSTITUTE' },
  TeamStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' },
  TournamentRegistrationStatus: {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    CONFIRMED: 'CONFIRMED',
    WAITLISTED: 'WAITLISTED',
    CHECKED_IN: 'CHECKED_IN',
    REFUND_PENDING: 'REFUND_PENDING',
  },
  TournamentStatus: { REGISTRATION_OPEN: 'REGISTRATION_OPEN' },
  TournamentVisibility: { PUBLIC: 'PUBLIC' },
  UserRole: { CAPTAIN: 'CAPTAIN' },
}));

describe('TournamentEligibilityService', () => {
  const captainId = 'captain-1';
  const tournamentId = 'tournament-1';
  let service: TournamentEligibilityService;
  let captainFindFirst: jest.Mock;
  let teamFindUnique: jest.Mock;
  let tournamentFindUnique: jest.Mock;
  let registrationCount: jest.Mock;
  let registrationCreate: jest.Mock;
  let client: Record<string, unknown>;

  const captain = (overrides: Record<string, unknown> = {}) => ({
    id: captainId,
    email: 'captain@example.com',
    displayName: 'Captain One',
    phoneNumber: '+201001234567',
    discordUsername: null,
    role: UserRole.CAPTAIN,
    ...overrides,
  });

  const team = (overrides: Record<string, unknown> = {}) => ({
    id: 'team-1',
    name: 'Cairo Titans',
    gameKey: 'valorant',
    region: 'MENA',
    status: TeamStatus.ACTIVE,
    rosterPlayers: [
      {
        id: 'player-1',
        gamerTag: 'Player One',
        realName: null,
        gameAccountId: 'VALORANT#1234',
        phoneNumber: '+201001234567',
        email: null,
        discordUsername: null,
        country: 'EG',
        rank: 'Gold',
        rosterType: RosterType.STARTER,
        eligibilityStatus: EligibilityStatus.PENDING_REVIEW,
      },
    ],
    ...overrides,
  });

  const tournament = (overrides: Record<string, unknown> = {}) => ({
    id: tournamentId,
    slug: 'alpha-cup',
    name: 'Alpha Cup',
    gameKey: 'valorant',
    visibility: TournamentVisibility.PUBLIC,
    status: TournamentStatus.REGISTRATION_OPEN,
    maximumTeams: 16,
    minimumStarters: 1,
    maximumStarters: 5,
    maximumSubstitutes: 2,
    requiredGameAccountId: true,
    allowedRegion: null,
    allowedCountries: [],
    allowedPlatforms: [],
    minimumRank: null,
    maximumRank: null,
    registrationOpensAt: new Date('2030-01-01T00:00:00.000Z'),
    registrationClosesAt: new Date('2030-02-01T00:00:00.000Z'),
    registrationOpenedAt: new Date('2030-01-01T00:00:00.000Z'),
    startsAt: new Date('2030-02-02T00:00:00.000Z'),
    cancelledAt: null,
    registrationFee: { toString: () => '0' },
    currency: 'EGP',
    rulesVersion: '1.0',
    ...overrides,
  });

  const registration = (overrides: Record<string, unknown> = {}) => ({
    id: 'registration-1',
    status: TournamentRegistrationStatus.PENDING_APPROVAL,
    paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
    approvalStatus: RegistrationApprovalStatus.PENDING,
    rulesVersion: '1.0',
    rulesAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
    submittedAt: new Date('2026-01-01T00:00:00.000Z'),
    tournament: {
      id: tournamentId,
      slug: 'alpha-cup',
      name: 'Alpha Cup',
      gameKey: 'valorant',
      mode: 'ONLINE',
      registrationFee: { toString: () => '0' },
      currency: 'EGP',
      startsAt: new Date('2030-02-02T00:00:00.000Z'),
    },
    team: { id: 'team-1', name: 'Cairo Titans' },
    ...overrides,
  });

  beforeEach(() => {
    captainFindFirst = jest.fn().mockResolvedValue(captain());
    teamFindUnique = jest.fn().mockResolvedValue(team());
    tournamentFindUnique = jest.fn().mockResolvedValue(tournament());
    registrationCount = jest.fn().mockResolvedValue(0);
    registrationCreate = jest.fn().mockResolvedValue(registration());

    client = {
      user: { findFirst: captainFindFirst },
      team: { findUnique: teamFindUnique },
      tournament: { findUnique: tournamentFindUnique },
      tournamentRegistration: {
        count: registrationCount,
        create: registrationCreate,
      },
    };

    client.$transaction = jest.fn((callback: (value: unknown) => unknown) =>
      callback(client),
    );

    service = new TournamentEligibilityService({
      client,
    } as unknown as DatabaseService);
  });

  it('returns an eligible response for an active captain team', async () => {
    const result = await service.getCaptainTournamentEligibility(
      captainId,
      tournamentId,
    );

    expect(result).toEqual({
      eligible: true,
      team: { id: 'team-1', name: 'Cairo Titans' },
      issues: [],
    });
    expect(registrationCount).toHaveBeenCalledTimes(2);
  });

  it('returns structured issues for incomplete captain and team data', async () => {
    captainFindFirst.mockResolvedValueOnce(captain({ phoneNumber: null }));
    teamFindUnique.mockResolvedValueOnce(
      team({ status: TeamStatus.SUSPENDED, gameKey: 'league-of-legends' }),
    );

    const result = await service.getCaptainTournamentEligibility(
      captainId,
      tournamentId,
    );

    expect(result.eligible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'CAPTAIN_PROFILE_INCOMPLETE',
        'TEAM_INACTIVE',
        'GAME_MISMATCH',
      ]),
    );
  });

  it('creates a free registration with rules and private snapshots', async () => {
    const result = await service.createCaptainTournamentRegistration(
      captainId,
      tournamentId,
      { acceptRules: true },
    );

    expect(result.id).toBe('registration-1');
    const createArgs = (
      registrationCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(createArgs.data).toMatchObject({
      captainId,
      teamId: 'team-1',
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
      rulesVersion: '1.0',
    });
    expect(Array.isArray(createArgs.data.rosterSnapshot)).toBe(true);
    expect(createArgs.data.captainContactSnapshot).toMatchObject({
      displayName: 'Captain One',
    });
  });

  it('rejects registration when rules are not accepted or records are missing', async () => {
    await expect(
      service.createCaptainTournamentRegistration(captainId, tournamentId, {
        acceptRules: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    captainFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.getCaptainTournamentEligibility(captainId, tournamentId),
    ).rejects.toBeInstanceOf(NotFoundException);

    teamFindUnique.mockResolvedValueOnce(null);
    await expect(
      service.getCaptainTournamentEligibility(captainId, tournamentId),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
