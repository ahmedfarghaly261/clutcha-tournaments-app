import { ConflictException, NotFoundException } from '@nestjs/common';
import { GamingRoomPurpose, TournamentMode } from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { TournamentGamingRoomService } from '../services/tournament-gaming-room.service';

jest.mock('@clutcha/database', () => ({
  GamingRoomPurpose: {
    COMPETITION: 'COMPETITION',
    PRACTICE: 'PRACTICE',
    WARMUP: 'WARMUP',
    STREAMING: 'STREAMING',
    ADMIN: 'ADMIN',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
}));

describe('TournamentGamingRoomService', () => {
  const organizerId = 'organizer-1';
  const tournamentId = 'tournament-onsite';
  const venueId = 'venue-1';

  let service: TournamentGamingRoomService;
  let tournamentFindFirst: jest.Mock;
  let venueFindUnique: jest.Mock;
  let roomFindMany: jest.Mock;
  let roomFindFirst: jest.Mock;
  let roomUpdate: jest.Mock;
  let roomDelete: jest.Mock;

  const createRoom = (overrides: Record<string, unknown> = {}) => ({
    id: 'gaming-room-1',
    venueId,
    name: 'Main Stage Room',
    description: 'Primary competition room.',
    purpose: GamingRoomPurpose.COMPETITION,
    stationCount: 20,
    cpu: 'Intel Core i7',
    gpu: 'RTX 4070',
    ram: '32GB',
    storage: '1TB NVMe',
    operatingSystem: 'Windows 11',
    monitorBrand: 'BenQ',
    monitorModel: 'XL2546K',
    monitorSizeInches: '24.5',
    monitorResolution: '1920x1080',
    monitorRefreshRateHz: 240,
    monitorResponseTimeMs: '1.0',
    mouse: 'Logitech G Pro',
    keyboard: 'Wooting 60HE',
    headset: 'HyperX Cloud II',
    mousePad: 'SteelSeries QcK',
    controller: null,
    internetConnection: 'Wired fiber',
    equipmentNotes: 'Tournament accounts preloaded.',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  const roomCreate = jest.fn<
    ReturnType<typeof createRoom>,
    [{ data: Record<string, unknown> }]
  >();

  const validDto = (): CreateGamingRoomDto => ({
    name: 'Main Stage Room',
    description: 'Primary competition room.',
    purpose: GamingRoomPurpose.COMPETITION,
    stationCount: 20,
    cpu: 'Intel Core i7',
    gpu: 'RTX 4070',
    ram: '32GB',
    storage: '1TB NVMe',
    operatingSystem: 'Windows 11',
    monitorBrand: 'BenQ',
    monitorModel: 'XL2546K',
    monitorSizeInches: 24.5,
    monitorResolution: '1920x1080',
    monitorRefreshRateHz: 240,
    monitorResponseTimeMs: 1,
    mouse: 'Logitech G Pro',
    keyboard: 'Wooting 60HE',
    headset: 'HyperX Cloud II',
    mousePad: 'SteelSeries QcK',
    controller: undefined,
    internetConnection: 'Wired fiber',
    equipmentNotes: 'Tournament accounts preloaded.',
  });

  beforeEach(() => {
    tournamentFindFirst = jest.fn().mockResolvedValue({
      mode: TournamentMode.ONSITE,
    });
    venueFindUnique = jest.fn().mockResolvedValue({ id: venueId });
    roomFindMany = jest.fn().mockResolvedValue([createRoom()]);
    roomCreate.mockReset();
    roomCreate.mockReturnValue(createRoom());
    roomFindFirst = jest.fn().mockResolvedValue(createRoom());
    roomUpdate = jest
      .fn()
      .mockResolvedValue(createRoom({ name: 'Updated Room' }));
    roomDelete = jest.fn().mockResolvedValue({ id: 'gaming-room-1' });

    service = new TournamentGamingRoomService({
      client: {
        tournament: { findFirst: tournamentFindFirst },
        tournamentVenue: { findUnique: venueFindUnique },
        tournamentGamingRoom: {
          findMany: roomFindMany,
          create: roomCreate,
          findFirst: roomFindFirst,
          update: roomUpdate,
          delete: roomDelete,
        },
      },
    } as unknown as DatabaseService);
  });

  it('lists rooms for the owned on-site tournament venue', async () => {
    const result = await service.listGamingRooms(organizerId, tournamentId);

    expect(result.items[0]).toMatchObject({
      id: 'gaming-room-1',
      venueId,
      name: 'Main Stage Room',
      monitor: { sizeInches: '24.5' },
    });
    expect(roomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { venueId } }),
    );
  });

  it('creates a room and converts decimal DTO values to database strings', async () => {
    await service.createGamingRoom(organizerId, tournamentId, validDto());

    const createArgs = roomCreate.mock.calls.at(0)?.[0];

    expect(createArgs?.data).toMatchObject({
      venueId,
      monitorSizeInches: '24.5',
      monitorResponseTimeMs: '1.0',
    });
  });

  it('gets, updates, and deletes a room scoped to the owned venue', async () => {
    await service.getGamingRoom(organizerId, tournamentId, 'gaming-room-1');
    await service.updateGamingRoom(organizerId, tournamentId, 'gaming-room-1', {
      name: 'Updated Room',
    });
    await service.deleteGamingRoom(organizerId, tournamentId, 'gaming-room-1');

    expect(roomFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'gaming-room-1', venueId },
      }),
    );
    expect(roomUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'gaming-room-1' } }),
    );
    expect(roomDelete).toHaveBeenCalledWith({
      where: { id: 'gaming-room-1' },
      select: { id: true },
    });
  });

  it('rejects online tournaments and missing venues', async () => {
    tournamentFindFirst.mockResolvedValueOnce({ mode: TournamentMode.ONLINE });

    await expect(
      service.listGamingRooms(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(ConflictException);

    tournamentFindFirst.mockResolvedValue({ mode: TournamentMode.ONSITE });
    venueFindUnique.mockResolvedValueOnce(null);

    await expect(
      service.listGamingRooms(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not return rooms outside the owned venue or tournament', async () => {
    roomFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.getGamingRoom(organizerId, tournamentId, 'foreign-room'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
