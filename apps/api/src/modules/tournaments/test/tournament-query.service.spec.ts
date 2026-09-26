import { NotFoundException } from '@nestjs/common';
import {
  OrganizerTournamentSortBy,
  SortDirection,
} from '../dtos/list-organizer-tournaments-query.dto';
import { PublicTournamentSortBy } from '../dtos/list-public-tournaments-query.dto';
import { DatabaseService } from '../../../database/database.service';
import { TournamentQueryService } from '../services/tournament-query.service';

jest.mock('@clutcha/database', () => ({
  TournamentMode: { ONLINE: 'ONLINE', ONSITE: 'ONSITE' },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
    UNLISTED: 'UNLISTED',
    PRIVATE: 'PRIVATE',
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
}));

describe('TournamentQueryService', () => {
  const organizerId = 'organizer-1';
  let service: TournamentQueryService;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let count: jest.Mock;

  const tournament = (overrides: Record<string, unknown> = {}) => ({
    id: 'tournament-1',
    organizerId,
    name: 'Alpha Cup',
    slug: 'alpha-cup',
    gameKey: 'valorant',
    mode: 'ONLINE',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    registrationFee: { toString: () => '0' },
    prizePool: { toString: () => '0' },
    onlineConfiguration: null,
    venue: null,
    ...overrides,
  });

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([tournament()]);
    findFirst = jest.fn().mockResolvedValue(tournament());
    count = jest.fn().mockResolvedValue(1);

    service = new TournamentQueryService({
      client: {
        $transaction: jest.fn((operations: Promise<unknown>[]) =>
          Promise.all(operations),
        ),
        tournament: {
          findMany,
          findFirst,
          count,
        },
      },
    } as unknown as DatabaseService);
  });

  it('lists organizer tournaments with ownership, filters, pagination, and sorting', async () => {
    const result = await service.listOrganizerTournaments(organizerId, {
      page: 2,
      limit: 5,
      search: 'alpha',
      status: 'PUBLISHED',
      mode: 'ONLINE',
      visibility: 'PUBLIC',
      gameKey: 'valorant',
      sortBy: OrganizerTournamentSortBy.NAME,
      sortDirection: SortDirection.ASC,
    });

    expect(result.items[0]?.id).toBe('tournament-1');
    expect(result.meta).toEqual({
      page: 2,
      limit: 5,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(findMany).toHaveBeenCalled();
  });

  it('lists public tournaments with safe summary data and public status rules', async () => {
    const result = await service.listPublicTournaments({
      page: 1,
      limit: 10,
      sortBy: PublicTournamentSortBy.STARTS_AT,
      sortDirection: SortDirection.ASC,
    });

    expect(result.items[0]).not.toHaveProperty('organizerId');
    expect(result.items[0]?.registrationFee).toBe('0');
    expect(findMany).toHaveBeenCalled();
  });

  it('returns public tournament details only for discoverable slugs', async () => {
    const result = await service.getPublicTournamentDetails('alpha-cup');

    expect(result.id).toBe('tournament-1');
    expect(findFirst).toHaveBeenCalled();

    findFirst.mockResolvedValueOnce(null);
    await expect(
      service.getPublicTournamentDetails('private-cup'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns organizer detail records scoped to the authenticated organizer', async () => {
    const result = await service.getOrganizerTournamentDetailsRecord(
      organizerId,
      'tournament-1',
    );

    expect(result.id).toBe('tournament-1');
    expect(findFirst).toHaveBeenCalled();

    findFirst.mockResolvedValueOnce(null);
    await expect(
      service.getOrganizerTournamentDetailsRecord(organizerId, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
