import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type WithdrawCaptainRegistrationDto } from '../dtos/withdraw-captain-registration.dto';
import { TournamentPaymentService } from '../services/tournament-payment.service';
import { TournamentRegistrationService } from '../services/tournament-registration.service';

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
    REFUNDED: 'REFUNDED',
  },
  RosterType: { STARTER: 'STARTER', SUBSTITUTE: 'SUBSTITUTE' },
  TeamStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' },
  TournamentMode: { ONLINE: 'ONLINE', ONSITE: 'ONSITE' },
  TournamentRegistrationStatus: {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    CHECKED_IN: 'CHECKED_IN',
    DISQUALIFIED: 'DISQUALIFIED',
    REFUNDED: 'REFUNDED',
  },
  TournamentStatus: {
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    CHECK_IN_OPEN: 'CHECK_IN_OPEN',
    COMPLETED: 'COMPLETED',
  },
  TournamentVisibility: { PUBLIC: 'PUBLIC' },
}));

describe('TournamentRegistrationService', () => {
  const captainId = 'captain-1';
  const organizerId = 'organizer-1';
  const tournamentId = 'tournament-1';
  const registrationId = 'registration-1';
  let service: TournamentRegistrationService;
  let registrationFindMany: jest.Mock;
  let registrationFindFirst: jest.Mock;
  let registrationCount: jest.Mock;
  let registrationUpdate: jest.Mock;
  let tournamentFindFirst: jest.Mock;
  let matchFindFirst: jest.Mock;
  let client: Record<string, unknown>;
  let currentRegistration: Record<string, unknown>;

  const money = (value: string) => ({ toString: () => value });

  const summaryTournament = (overrides: Record<string, unknown> = {}) => ({
    id: tournamentId,
    slug: 'alpha-cup',
    name: 'Alpha Cup',
    logoUrl: null,
    coverUrl: null,
    gameKey: 'valorant',
    mode: TournamentMode.ONLINE,
    visibility: TournamentVisibility.PUBLIC,
    status: TournamentStatus.REGISTRATION_OPEN,
    startsAt: new Date('2030-02-01T18:00:00.000Z'),
    endsAt: null,
    timezone: 'Africa/Cairo',
    registrationFee: money('0'),
    currency: 'EGP',
    ...overrides,
  });

  const team = (overrides: Record<string, unknown> = {}) => ({
    id: 'team-1',
    name: 'Cairo Titans',
    slug: 'cairo-titans',
    gameKey: 'valorant',
    region: 'MENA',
    status: TeamStatus.ACTIVE,
    rosterPlayers: [
      {
        id: 'player-1',
        gamerTag: 'Player One',
        gameAccountId: 'VALORANT#1234',
        phoneNumber: '+201001234567',
        rosterType: RosterType.STARTER,
      },
    ],
    ...overrides,
  });

  const detailRegistration = (overrides: Record<string, unknown> = {}) => ({
    id: registrationId,
    status: TournamentRegistrationStatus.CONFIRMED,
    paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
    approvalStatus: RegistrationApprovalStatus.APPROVED,
    submittedAt: new Date('2026-01-01T12:00:00.000Z'),
    approvedAt: new Date('2026-01-02T12:00:00.000Z'),
    rejectedAt: null,
    rejectionReason: null,
    withdrawnAt: null,
    checkedInAt: null,
    disqualifiedAt: null,
    rulesVersion: '1.0',
    rulesAcceptedAt: new Date('2026-01-01T12:00:00.000Z'),
    rosterSnapshot: [{ gamerTag: 'Player One' }],
    captainContactSnapshot: {
      displayName: 'Captain One',
      email: 'captain@example.com',
    },
    tournament: summaryTournament(),
    team: team(),
    paymentProofs: [],
    ...overrides,
  });

  const hubRegistration = (overrides: Record<string, unknown> = {}) => ({
    ...detailRegistration(),
    tournament: summaryTournament({
      status: TournamentStatus.CHECK_IN_OPEN,
      onlineConfiguration: {
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby.',
        discordServerUrl: 'https://discord.gg/clutcha',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Lobby code is private.',
        privateSupportContact: 'support@example.com',
      },
      venue: null,
    }),
    ...overrides,
  });

  const checkInRegistration = (overrides: Record<string, unknown> = {}) => ({
    id: registrationId,
    status: TournamentRegistrationStatus.CONFIRMED,
    paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
    approvalStatus: RegistrationApprovalStatus.APPROVED,
    checkedInAt: null,
    captain: { id: captainId, phoneNumber: '+201001234567' },
    team: team(),
    tournament: {
      id: tournamentId,
      name: 'Alpha Cup',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.CHECK_IN_OPEN,
      startsAt: new Date('2030-02-01T18:00:00.000Z'),
      checkInOpensAt: new Date('2026-01-01T00:00:00.000Z'),
      checkInClosesAt: new Date('2030-01-01T00:00:00.000Z'),
      checkInRules: 'Check in before your match.',
      timezone: 'Africa/Cairo',
      minimumStarters: 1,
      maximumStarters: 5,
      maximumSubstitutes: 2,
      requiredGameAccountId: true,
      onlineConfiguration: {
        serverRegion: 'EU West',
        connectionRules: 'Use assigned lobby.',
      },
      venue: null,
    },
    ...overrides,
  });

  const organizerRegistration = (overrides: Record<string, unknown> = {}) => ({
    ...detailRegistration({
      status: TournamentRegistrationStatus.PENDING_APPROVAL,
      approvalStatus: RegistrationApprovalStatus.PENDING,
    }),
    team: team(),
    ...overrides,
  });

  beforeEach(() => {
    currentRegistration = detailRegistration();
    registrationFindMany = jest.fn().mockResolvedValue([currentRegistration]);
    registrationFindFirst = jest.fn().mockResolvedValue(currentRegistration);
    registrationCount = jest.fn().mockResolvedValue(1);
    registrationUpdate = jest
      .fn()
      .mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        currentRegistration = { ...currentRegistration, ...data };
        return Promise.resolve(currentRegistration);
      });
    tournamentFindFirst = jest.fn().mockResolvedValue({
      id: tournamentId,
      organizerId,
      maximumTeams: 16,
    });
    matchFindFirst = jest.fn().mockResolvedValue(null);

    client = {
      tournament: { findFirst: tournamentFindFirst },
      tournamentRegistration: {
        findMany: registrationFindMany,
        findFirst: registrationFindFirst,
        count: registrationCount,
        update: registrationUpdate,
      },
      tournamentMatch: { findFirst: matchFindFirst },
    };
    client.$transaction = jest.fn((operation: unknown) => {
      if (Array.isArray(operation)) {
        return Promise.all(operation as Array<Promise<unknown>>);
      }

      return (operation as (value: unknown) => unknown)(client);
    });

    service = new TournamentRegistrationService(
      { client } as unknown as DatabaseService,
      {} as unknown as TournamentPaymentService,
    );
  });

  it('lists Captain registrations and returns private registration details', async () => {
    const list = await service.listCaptainRegistrations(captainId, {
      page: 1,
      limit: 10,
    });
    expect(list.items[0]).toMatchObject({
      registrationId,
      tournament: { id: tournamentId, name: 'Alpha Cup' },
      nextAction: 'OPEN_TOURNAMENT_HUB',
    });
    expect(list.meta).toMatchObject({ page: 1, limit: 10, totalItems: 1 });

    const details = await service.getCaptainRegistrationDetails(
      captainId,
      registrationId,
    );
    expect(details).toMatchObject({
      registrationId,
      rosterSnapshot: [{ gamerTag: 'Player One' }],
      captainContactSnapshot: { email: 'captain@example.com' },
    });
  });

  it('allows approved registrations into the hub and blocks pending registrations', async () => {
    registrationFindFirst.mockResolvedValueOnce(hubRegistration());
    const result = await service.getCaptainRegistrationHub(
      captainId,
      registrationId,
    );
    expect(result.privateInformationAvailable).toBe(true);
    expect(result.onlinePrivateInfo).toMatchObject({
      serverRegion: 'EU West',
      discordServerUrl: 'https://discord.gg/clutcha',
    });

    registrationFindFirst.mockResolvedValueOnce(
      hubRegistration({
        approvalStatus: RegistrationApprovalStatus.PENDING,
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
      }),
    );
    await expect(
      service.getCaptainRegistrationHub(captainId, registrationId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reports check-in readiness and checks in an approved registration', async () => {
    registrationFindFirst.mockResolvedValue(checkInRegistration());
    const readiness = await service.getCaptainRegistrationCheckIn(
      captainId,
      registrationId,
    );
    expect(readiness.canCheckIn).toBe(true);
    expect(readiness.outstandingIssues).toEqual([]);

    const checkedIn = checkInRegistration({
      status: TournamentRegistrationStatus.CHECKED_IN,
      checkedInAt: new Date('2026-01-03T12:00:00.000Z'),
    });
    registrationUpdate.mockResolvedValueOnce(checkedIn);
    const result = await service.checkInCaptainRegistration(
      captainId,
      registrationId,
    );
    expect(result.checkedIn).toBe(true);
    const checkInUpdate = (
      registrationUpdate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(checkInUpdate.data.status).toBe(
      TournamentRegistrationStatus.CHECKED_IN,
    );
  });

  it('withdraws a Captain registration and blocks terminal registrations', async () => {
    const dto: WithdrawCaptainRegistrationDto = { reason: 'Team withdrew.' };
    const withdrawn = detailRegistration({
      status: TournamentRegistrationStatus.WITHDRAWN,
      withdrawnAt: new Date('2026-01-03T12:00:00.000Z'),
    });
    registrationUpdate.mockResolvedValueOnce(withdrawn);

    const result = await service.withdrawCaptainRegistration(
      captainId,
      registrationId,
      dto,
    );
    expect(result.lifecycle.status).toBe(
      TournamentRegistrationStatus.WITHDRAWN,
    );

    registrationFindFirst.mockResolvedValueOnce(
      detailRegistration({ status: TournamentRegistrationStatus.CHECKED_IN }),
    );
    await expect(
      service.withdrawCaptainRegistration(captainId, registrationId, dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists and reviews organizer registrations within the owned tournament', async () => {
    currentRegistration = organizerRegistration();
    registrationFindMany.mockResolvedValueOnce([currentRegistration]);
    const list = await service.listOrganizerTournamentRegistrations(
      organizerId,
      tournamentId,
    );
    expect(list.items[0]).toMatchObject({
      registrationId,
      team: { id: 'team-1', name: 'Cairo Titans' },
      eligibility: { eligible: true, issues: [] },
    });

    registrationFindFirst.mockResolvedValue(organizerRegistration());
    registrationUpdate.mockResolvedValueOnce(
      organizerRegistration({
        status: TournamentRegistrationStatus.CONFIRMED,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        approvedAt: new Date('2026-01-03T12:00:00.000Z'),
      }),
    );
    const approved = await service.approveOrganizerTournamentRegistration(
      organizerId,
      tournamentId,
      registrationId,
    );
    expect(approved.status).toBe(TournamentRegistrationStatus.CONFIRMED);
    expect(approved.approvalStatus).toBe(RegistrationApprovalStatus.APPROVED);

    registrationFindFirst.mockResolvedValue(organizerRegistration());
    registrationUpdate.mockResolvedValueOnce(
      organizerRegistration({
        status: TournamentRegistrationStatus.REJECTED,
        approvalStatus: RegistrationApprovalStatus.REJECTED,
      }),
    );
    const rejected = await service.rejectOrganizerTournamentRegistration(
      organizerId,
      tournamentId,
      registrationId,
      { reason: 'Roster requires review.' },
    );
    expect(rejected.status).toBe(TournamentRegistrationStatus.REJECTED);
  });

  it('rejects foreign or missing registration access', async () => {
    registrationFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.getCaptainRegistrationDetails(captainId, registrationId),
    ).rejects.toBeInstanceOf(NotFoundException);

    tournamentFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.listOrganizerTournamentRegistrations(
        'other-organizer',
        tournamentId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
