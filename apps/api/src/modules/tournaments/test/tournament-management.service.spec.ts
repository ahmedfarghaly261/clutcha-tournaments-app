import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CreateTournamentDto } from '../dtos/create-tournament.dto';
import { TournamentManagementService } from '../services/tournament-management.service';
import { TournamentQueryService } from '../services/tournament-query.service';

jest.mock('@clutcha/database', () => ({
  TournamentFormat: {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentSeedingMethod: {
    MANUAL: 'MANUAL',
  },
  TournamentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
  },
}));

jest.mock('../mappers/tournament.mapper', () => ({
  toTournamentResponse: (tournament: unknown) => tournament,
}));

describe('TournamentManagementService', () => {
  const organizerId = 'organizer-1';
  const tournamentId = 'tournament-1';

  let service: TournamentManagementService;
  let tournamentFindFirst: jest.Mock;
  let tournamentCreate: jest.Mock;
  let tournamentUpdate: jest.Mock;
  let tournamentDelete: jest.Mock;
  let transaction: jest.Mock;
  let saveCoverImage: jest.Mock;
  let getOrganizerDetailsRecord: jest.Mock;

  const money = (value: string) => ({ toString: () => value });

  const tournamentRecord = (overrides: Record<string, unknown> = {}) => ({
    id: tournamentId,
    organizerId,
    name: 'Alpha Cup',
    slug: 'alpha-cup',
    shortDescription: 'A competitive tournament.',
    description: 'Tournament description.',
    logoUrl: null,
    coverUrl: null,
    gameKey: 'valorant',
    mode: TournamentMode.ONLINE,
    visibility: TournamentVisibility.PUBLIC,
    status: TournamentStatus.DRAFT,
    format: TournamentFormat.SINGLE_ELIMINATION,
    minimumTeams: 2,
    maximumTeams: 16,
    minimumStarters: 1,
    maximumStarters: 5,
    maximumSubstitutes: 2,
    defaultBestOf: 1,
    finalBestOf: 3,
    seedingMethod: TournamentSeedingMethod.MANUAL,
    thirdPlaceMatch: false,
    requiredGameAccountId: true,
    allowedRegion: 'MENA',
    allowedCountries: ['EG'],
    allowedPlatforms: ['PC'],
    minimumPlayerAge: null,
    minimumRank: null,
    maximumRank: null,
    registrationFee: money('0.00'),
    currency: 'EGP',
    prizePool: money('0.00'),
    prizeDistribution: null,
    refundPolicy: 'Refunds are available before the event.',
    cancellationPolicy: 'Organizer cancellation policy.',
    rules: 'Tournament rules.',
    rulesVersion: '1.0',
    rosterChangeRules: null,
    checkInRules: 'Check in before your match.',
    matchReportingRules: 'Report results after each match.',
    evidenceRequirements: null,
    disputeDeadlineMinutes: 30,
    forfeitRules: 'Forfeit rules.',
    codeOfConduct: 'Code of conduct.',
    registrationOpensAt: new Date('2030-01-01T12:00:00.000Z'),
    registrationClosesAt: new Date('2030-01-10T12:00:00.000Z'),
    rosterLocksAt: null,
    checkInOpensAt: null,
    checkInClosesAt: null,
    startsAt: new Date('2030-01-12T12:00:00.000Z'),
    endsAt: new Date('2030-01-13T12:00:00.000Z'),
    timezone: 'Africa/Cairo',
    waitlistEnabled: false,
    maximumWaitlistSize: null,
    manualApprovalRequired: true,
    publishedAt: null,
    registrationOpenedAt: null,
    registrationClosedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date('2029-12-01T12:00:00.000Z'),
    updatedAt: new Date('2029-12-01T12:00:00.000Z'),
    onlineConfiguration: {
      id: 'online-configuration-1',
      serverRegion: 'EU West',
      evidenceRequired: false,
      screenshotRequirements: null,
    },
    venue: null,
    paymentMethods: [],
    ...overrides,
  });

  const validCreateDto = (): CreateTournamentDto => ({
    name: 'New Alpha Cup',
    gameKey: 'valorant',
    mode: TournamentMode.ONLINE,
    visibility: TournamentVisibility.PUBLIC,
    format: TournamentFormat.SINGLE_ELIMINATION,
    minimumTeams: 2,
    maximumTeams: 16,
    minimumStarters: 1,
    maximumStarters: 5,
    registrationOpensAt: new Date('2030-01-01T12:00:00.000Z'),
    registrationClosesAt: new Date('2030-01-10T12:00:00.000Z'),
    startsAt: new Date('2030-01-12T12:00:00.000Z'),
    timezone: 'Africa/Cairo',
    rules: 'Tournament rules.',
  });

  beforeEach(() => {
    const record = tournamentRecord();
    tournamentFindFirst = jest.fn().mockResolvedValue(record);
    tournamentCreate = jest.fn().mockResolvedValue(record);
    tournamentUpdate = jest.fn().mockResolvedValue(record);
    tournamentDelete = jest.fn().mockResolvedValue({ id: tournamentId });
    transaction = jest.fn((callback: (client: unknown) => unknown) =>
      callback({
        tournament: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: tournamentCreate,
          update: tournamentUpdate,
          delete: tournamentDelete,
        },
      }),
    );
    saveCoverImage = jest
      .fn()
      .mockResolvedValue('https://cdn.example.com/cover.png');
    getOrganizerDetailsRecord = jest.fn().mockResolvedValue(record);

    service = new TournamentManagementService(
      {
        client: {
          $transaction: transaction,
          tournament: {
            findFirst: tournamentFindFirst,
            update: tournamentUpdate,
            delete: tournamentDelete,
          },
        },
      } as unknown as DatabaseService,
      { saveCoverImage },
      {
        getOrganizerTournamentDetailsRecord: getOrganizerDetailsRecord,
      } as unknown as TournamentQueryService,
    );
  });

  it('creates a validated draft with defaults and a unique slug', async () => {
    const result = await service.createOrganizerDraft(
      organizerId,
      validCreateDto(),
    );

    expect(result).toMatchObject({
      id: tournamentId,
      name: 'Alpha Cup',
    });
    const createArgs = (
      tournamentCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      organizerId,
      name: 'New Alpha Cup',
      slug: 'new-alpha-cup',
      status: TournamentStatus.DRAFT,
      registrationFee: '0.00',
      prizePool: '0.00',
      maximumSubstitutes: 0,
      defaultBestOf: 1,
      finalBestOf: 3,
    });
  });

  it('rejects invalid draft ordering before persistence', async () => {
    const dto = validCreateDto();
    dto.startsAt = new Date('2030-01-05T12:00:00.000Z');

    await expect(
      service.createOrganizerDraft(organizerId, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(transaction).not.toHaveBeenCalled();
    expect(tournamentCreate).not.toHaveBeenCalled();
  });

  it('publishes a ready draft and rejects non-ready drafts', async () => {
    transaction.mockImplementationOnce(
      (callback: (client: unknown) => unknown) =>
        callback({
          tournament: {
            findFirst: jest.fn().mockResolvedValue(tournamentRecord()),
            update: tournamentUpdate,
          },
        }),
    );
    tournamentUpdate.mockResolvedValueOnce(
      tournamentRecord({ status: TournamentStatus.PUBLISHED }),
    );

    const published = await service.publishOrganizerTournament(
      organizerId,
      tournamentId,
    );

    expect(published).toMatchObject({ status: TournamentStatus.PUBLISHED });
    const publishArgs = (
      tournamentUpdate.mock.calls as unknown as Array<
        [{ where: { id: string }; data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(publishArgs).toMatchObject({
      where: { id: tournamentId },
      data: { status: TournamentStatus.PUBLISHED },
    });

    transaction.mockImplementationOnce(
      (callback: (client: unknown) => unknown) =>
        callback({
          tournament: {
            findFirst: jest
              .fn()
              .mockResolvedValue(
                tournamentRecord({ onlineConfiguration: null }),
              ),
          },
        }),
    );

    await expect(
      service.publishOrganizerTournament(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates drafts, uploads covers, and deletes only owned draft tournaments', async () => {
    tournamentFindFirst.mockResolvedValue(tournamentRecord());
    tournamentUpdate.mockResolvedValue(
      tournamentRecord({ name: 'Renamed Cup', slug: 'renamed-cup' }),
    );

    await service.updateOrganizerTournamentDraft(organizerId, tournamentId, {
      name: 'Renamed Cup',
    });
    await service.uploadOrganizerTournamentCover(
      organizerId,
      tournamentId,
      { buffer: Buffer.from('cover'), originalname: 'cover.png' } as never,
      'https://clutcha.example.com',
    );
    await service.deleteOrganizerTournamentDraft(organizerId, tournamentId);

    expect(saveCoverImage).toHaveBeenCalledWith(
      tournamentId,
      expect.anything(),
      'https://clutcha.example.com',
    );
    expect(tournamentDelete).toHaveBeenCalledWith({
      where: { id: tournamentId },
      select: { id: true },
    });
  });

  it('returns organizer details with publication readiness', async () => {
    const result = await service.getOrganizerTournamentDetails(
      organizerId,
      tournamentId,
    );

    expect(result).toMatchObject({
      tournament: { id: tournamentId, name: 'Alpha Cup' },
      publicationReadiness: { ready: true, issues: [] },
    });
    expect(getOrganizerDetailsRecord).toHaveBeenCalledWith(
      organizerId,
      tournamentId,
    );
  });

  it('rejects missing owned tournaments and non-draft updates', async () => {
    tournamentFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.updateOrganizerTournamentDraft(organizerId, tournamentId, {
        name: 'Missing Cup',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    tournamentFindFirst.mockResolvedValueOnce(
      tournamentRecord({ status: TournamentStatus.REGISTRATION_OPEN }),
    );
    await expect(
      service.deleteOrganizerTournamentDraft(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
