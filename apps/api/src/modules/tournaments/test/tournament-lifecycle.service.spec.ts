import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { TournamentLifecycleService } from '../services/tournament-lifecycle.service';

jest.mock('@clutcha/database', () => ({
  TournamentFormat: { SINGLE_ELIMINATION: 'SINGLE_ELIMINATION' },
  TournamentMode: { ONLINE: 'ONLINE' },
  TournamentSeedingMethod: { MANUAL: 'MANUAL' },
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
  TournamentVisibility: { PUBLIC: 'PUBLIC' },
}));

describe('TournamentLifecycleService', () => {
  const organizerId = 'organizer-1';
  const tournamentId = 'tournament-1';
  let service: TournamentLifecycleService;
  let findFirst: jest.Mock;
  let update: jest.Mock;
  let tournament: Record<string, unknown>;
  let client: Record<string, unknown>;

  beforeEach(() => {
    tournament = {
      id: tournamentId,
      organizerId,
      name: 'Alpha Cup',
      slug: 'alpha-cup',
      shortDescription: null,
      description: null,
      logoUrl: null,
      coverUrl: null,
      gameKey: 'valorant',
      mode: TournamentMode.ONLINE,
      visibility: TournamentVisibility.PUBLIC,
      status: TournamentStatus.PUBLISHED,
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
      rules: 'Rules',
      rulesVersion: '1.0',
      rosterChangeRules: null,
      checkInRules: null,
      matchReportingRules: null,
      evidenceRequirements: null,
      disputeDeadlineMinutes: null,
      forfeitRules: null,
      codeOfConduct: null,
      registrationOpensAt: new Date('2030-01-01T00:00:00.000Z'),
      registrationClosesAt: new Date('2030-02-01T00:00:00.000Z'),
      rosterLocksAt: null,
      checkInOpensAt: new Date('2030-02-01T00:00:00.000Z'),
      checkInClosesAt: new Date('2030-02-02T00:00:00.000Z'),
      startsAt: new Date('2030-02-02T00:00:00.000Z'),
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
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    findFirst = jest.fn().mockResolvedValue(tournament);
    update = jest
      .fn()
      .mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        Object.assign(tournament, data);
        return Promise.resolve(tournament);
      });
    client = {
      tournament: { findFirst, update },
    };
    client.$transaction = jest.fn((callback: (value: unknown) => unknown) =>
      callback(client),
    );
    service = new TournamentLifecycleService({
      client,
    } as unknown as DatabaseService);
  });

  it('opens, closes registration, and opens check-in in order', async () => {
    const opened = await service.openRegistration(organizerId, tournamentId);
    expect(opened.status).toBe(TournamentStatus.REGISTRATION_OPEN);
    expect(tournament.registrationOpenedAt).toBeInstanceOf(Date);

    const closed = await service.closeRegistration(organizerId, tournamentId);
    expect(closed.status).toBe(TournamentStatus.REGISTRATION_CLOSED);
    expect(tournament.registrationClosedAt).toBeInstanceOf(Date);

    const checkIn = await service.openCheckIn(organizerId, tournamentId);
    expect(checkIn.status).toBe(TournamentStatus.CHECK_IN_OPEN);
    expect(tournament.checkInOpensAt).toBeInstanceOf(Date);
    expect(update).toHaveBeenCalledTimes(3);
  });

  it('cancels a cancellable tournament with a reason', async () => {
    const result = await service.cancel(
      organizerId,
      tournamentId,
      'Venue became unavailable.',
    );

    expect(result.status).toBe(TournamentStatus.CANCELLED);
    expect(result.cancellationReason).toBe('Venue became unavailable.');
    expect(result.cancelledAt).toBeInstanceOf(Date);
  });

  it('rejects invalid lifecycle transitions', async () => {
    await expect(
      service.closeRegistration(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(ConflictException);

    tournament.status = TournamentStatus.COMPLETED;
    await expect(
      service.cancel(organizerId, tournamentId, 'Too late.'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('scopes lifecycle changes to the owning organizer', async () => {
    findFirst.mockResolvedValueOnce(null);

    await expect(
      service.openRegistration('other-organizer', tournamentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
