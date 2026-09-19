import { ConflictException, NotFoundException } from '@nestjs/common';
import { TournamentMode } from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type UpsertVenueDto } from '../dtos/upsert-venue.dto';
import { TournamentConfigurationService } from '../services/tournament-configuration.service';

jest.mock('@clutcha/database', () => ({
  TournamentMode: { ONLINE: 'ONLINE', ONSITE: 'ONSITE' },
}));

describe('TournamentConfigurationService', () => {
  let service: TournamentConfigurationService;
  let tournamentFindFirst: jest.Mock;
  let venueFindUnique: jest.Mock;
  let venueUpsert: jest.Mock;
  let onlineFindUnique: jest.Mock;
  let onlineUpsert: jest.Mock;

  const venue = () => ({
    id: 'venue-1',
    tournamentId: 'tournament-onsite',
    name: 'CLUTCHA Arena',
    country: 'EG',
    city: 'Cairo',
    address: '90 Street',
    mapUrl: null,
    checkInLocation: 'Reception',
    parkingInfo: null,
    spectatorPolicy: null,
    venueRules: null,
    emergencyContact: null,
    equipmentProvided: { pc: true },
    playersMayBring: { headset: true },
    playersMustBring: { nationalId: true },
    personalPeripheralsAllowed: true,
    controllersAllowed: false,
    usbDevicesAllowed: false,
    driverInstallationAllowed: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  const onlineConfiguration = () => ({
    id: 'online-configuration-1',
    tournamentId: 'tournament-online',
    serverRegion: 'EU West',
    publicInstructions: 'Join the lobby.',
    connectionRules: 'Use the assigned lobby.',
    evidenceRequired: true,
    screenshotRequirements: 'Upload screenshots.',
    resultSubmissionDeadlineMinutes: 30,
    discordServerUrl: 'https://discord.gg/clutcha',
    captainSupportChannel: '#captain-support',
    matchReportingChannel: '#match-reporting',
    lobbyInstructions: 'Private lobby instructions.',
    privateSupportContact: '+20 100 000 0000',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    tournamentFindFirst = jest
      .fn()
      .mockImplementation((args: { where: { id: string } }) =>
        Promise.resolve({
          mode:
            args.where.id === 'tournament-online'
              ? TournamentMode.ONLINE
              : TournamentMode.ONSITE,
        }),
      );
    venueFindUnique = jest.fn().mockResolvedValue(venue());
    venueUpsert = jest.fn().mockResolvedValue(venue());
    onlineFindUnique = jest.fn().mockResolvedValue(onlineConfiguration());
    onlineUpsert = jest.fn().mockResolvedValue(onlineConfiguration());

    service = new TournamentConfigurationService({
      client: {
        tournament: { findFirst: tournamentFindFirst },
        tournamentVenue: {
          findUnique: venueFindUnique,
          upsert: venueUpsert,
        },
        tournamentOnlineConfiguration: {
          findUnique: onlineFindUnique,
          upsert: onlineUpsert,
        },
      },
    } as unknown as DatabaseService);
  });

  it('returns a venue with separated location, policy, and equipment data', async () => {
    const result = await service.getVenue('organizer-1', 'tournament-onsite');

    expect(result.tournamentId).toBe('tournament-onsite');
    expect(result.location.name).toBe('CLUTCHA Arena');
    expect(result.equipmentPolicy).toMatchObject({
      equipmentProvided: { pc: true },
      personalPeripheralsAllowed: true,
    });
  });

  it('upserts venue data only for an owned on-site tournament', async () => {
    const dto = {
      name: 'Updated Arena',
      country: 'EG',
      city: 'Giza',
      address: 'Smart Village',
      checkInLocation: 'Gate 2',
      personalPeripheralsAllowed: true,
    } as UpsertVenueDto;

    await service.upsertVenue('organizer-1', 'tournament-onsite', dto);

    expect(venueUpsert).toHaveBeenCalledTimes(1);
  });

  it('returns and upserts online configuration with public/private sections', async () => {
    const result = await service.getOnlineConfiguration(
      'organizer-1',
      'tournament-online',
    );

    expect(result.publicDetails.serverRegion).toBe('EU West');
    expect(result.privateDetails.discordServerUrl).toBe(
      'https://discord.gg/clutcha',
    );

    await service.upsertOnlineConfiguration(
      'organizer-1',
      'tournament-online',
      {
        serverRegion: 'MENA',
        publicInstructions: 'Public instructions',
        evidenceRequired: false,
        discordServerUrl: 'https://discord.gg/new-config',
        privateSupportContact: 'private support',
      },
    );

    expect(onlineUpsert).toHaveBeenCalledTimes(1);
  });

  it('rejects configuration for the wrong tournament mode', async () => {
    await expect(
      service.getVenue('organizer-1', 'tournament-online'),
    ).rejects.toBeInstanceOf(ConflictException);

    tournamentFindFirst.mockResolvedValue({ mode: TournamentMode.ONSITE });
    await expect(
      service.getOnlineConfiguration('organizer-1', 'tournament-onsite'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found for missing ownership, records, or venue', async () => {
    tournamentFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.getVenue('organizer-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);

    tournamentFindFirst.mockResolvedValue({ mode: TournamentMode.ONSITE });
    venueFindUnique.mockResolvedValueOnce(null);
    await expect(
      service.getVenue('organizer-1', 'tournament-onsite'),
    ).rejects.toBeInstanceOf(NotFoundException);

    tournamentFindFirst.mockResolvedValue({ mode: TournamentMode.ONLINE });
    onlineFindUnique.mockResolvedValueOnce(null);
    await expect(
      service.getOnlineConfiguration('organizer-1', 'tournament-online'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
