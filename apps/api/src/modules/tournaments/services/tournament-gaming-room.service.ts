import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TournamentMode } from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { type GamingRoomListResponseDto } from '../dtos/gaming-room-list-response.dto';
import { type GamingRoomResponseDto } from '../dtos/gaming-room-response.dto';
import { type UpdateGamingRoomDto } from '../dtos/update-gaming-room.dto';
import { toGamingRoomResponse } from '../mappers/gaming-room.mapper';

type GamingRoomData = Omit<
  Prisma.TournamentGamingRoomUncheckedCreateInput,
  'id' | 'venueId' | 'createdAt' | 'updatedAt'
>;

const gamingRoomSelect = {
  id: true,
  venueId: true,
  name: true,
  description: true,
  purpose: true,
  stationCount: true,
  cpu: true,
  gpu: true,
  ram: true,
  storage: true,
  operatingSystem: true,
  monitorBrand: true,
  monitorModel: true,
  monitorSizeInches: true,
  monitorResolution: true,
  monitorRefreshRateHz: true,
  monitorResponseTimeMs: true,
  mouse: true,
  keyboard: true,
  headset: true,
  mousePad: true,
  controller: true,
  internetConnection: true,
  equipmentNotes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentGamingRoomSelect;

@Injectable()
export class TournamentGamingRoomService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listGamingRooms(
    organizerId: string,
    tournamentId: string,
  ): Promise<GamingRoomListResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );

    const rooms =
      await this.databaseService.client.tournamentGamingRoom.findMany({
        where: { venueId: venue.id },
        orderBy: { createdAt: 'asc' },
        select: gamingRoomSelect,
      });

    return {
      items: rooms.map((room) => toGamingRoomResponse(room)),
    };
  }

  async createGamingRoom(
    organizerId: string,
    tournamentId: string,
    dto: CreateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );

    const room = await this.databaseService.client.tournamentGamingRoom.create({
      data: {
        venueId: venue.id,
        ...this.toGamingRoomData(dto),
      },
      select: gamingRoomSelect,
    });

    return toGamingRoomResponse(room);
  }

  async getGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    const room = await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    return toGamingRoomResponse(room);
  }

  async updateGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
    dto: UpdateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    const room = await this.databaseService.client.tournamentGamingRoom.update({
      where: { id: gamingRoomId },
      data: this.toGamingRoomUpdateData(dto),
      select: gamingRoomSelect,
    });

    return toGamingRoomResponse(room);
  }

  async deleteGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ): Promise<void> {
    const venue = await this.findOwnedOnsiteVenueOrThrow(
      organizerId,
      tournamentId,
    );
    await this.findGamingRoomOrThrow(venue.id, gamingRoomId);

    await this.databaseService.client.tournamentGamingRoom.delete({
      where: { id: gamingRoomId },
      select: { id: true },
    });
  }

  private async findOwnedOnsiteVenueOrThrow(
    organizerId: string,
    tournamentId: string,
  ): Promise<{ id: string }> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: { mode: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    if (tournament.mode !== TournamentMode.ONSITE) {
      throw new ConflictException(
        'Venue configuration is only available for on-site tournaments',
      );
    }

    const venue = await this.databaseService.client.tournamentVenue.findUnique({
      where: { tournamentId },
      select: { id: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue was not found');
    }

    return venue;
  }

  private async findGamingRoomOrThrow(
    venueId: string,
    gamingRoomId: string,
  ): Promise<
    Prisma.TournamentGamingRoomGetPayload<{ select: typeof gamingRoomSelect }>
  > {
    const room =
      await this.databaseService.client.tournamentGamingRoom.findFirst({
        where: {
          id: gamingRoomId,
          venueId,
        },
        select: gamingRoomSelect,
      });

    if (!room) {
      throw new NotFoundException('Gaming room was not found');
    }

    return room;
  }

  private toGamingRoomData(dto: CreateGamingRoomDto): GamingRoomData {
    return {
      name: dto.name,
      description: dto.description,
      purpose: dto.purpose,
      stationCount: dto.stationCount,
      cpu: dto.cpu,
      gpu: dto.gpu,
      ram: dto.ram,
      storage: dto.storage,
      operatingSystem: dto.operatingSystem,
      monitorBrand: dto.monitorBrand,
      monitorModel: dto.monitorModel,
      monitorSizeInches: this.toOptionalDecimalString(dto.monitorSizeInches),
      monitorResolution: dto.monitorResolution,
      monitorRefreshRateHz: dto.monitorRefreshRateHz,
      monitorResponseTimeMs: this.toOptionalDecimalString(
        dto.monitorResponseTimeMs,
      ),
      mouse: dto.mouse,
      keyboard: dto.keyboard,
      headset: dto.headset,
      mousePad: dto.mousePad,
      controller: dto.controller,
      internetConnection: dto.internetConnection,
      equipmentNotes: dto.equipmentNotes,
    };
  }

  private toGamingRoomUpdateData(
    dto: UpdateGamingRoomDto,
  ): Prisma.TournamentGamingRoomUncheckedUpdateInput {
    return {
      name: dto.name,
      description: dto.description,
      purpose: dto.purpose,
      stationCount: dto.stationCount,
      cpu: dto.cpu,
      gpu: dto.gpu,
      ram: dto.ram,
      storage: dto.storage,
      operatingSystem: dto.operatingSystem,
      monitorBrand: dto.monitorBrand,
      monitorModel: dto.monitorModel,
      monitorSizeInches: this.toOptionalDecimalString(dto.monitorSizeInches),
      monitorResolution: dto.monitorResolution,
      monitorRefreshRateHz: dto.monitorRefreshRateHz,
      monitorResponseTimeMs: this.toOptionalDecimalString(
        dto.monitorResponseTimeMs,
      ),
      mouse: dto.mouse,
      keyboard: dto.keyboard,
      headset: dto.headset,
      mousePad: dto.mousePad,
      controller: dto.controller,
      internetConnection: dto.internetConnection,
      equipmentNotes: dto.equipmentNotes,
    };
  }

  private toOptionalDecimalString(
    value: number | undefined,
  ): string | undefined {
    return value === undefined ? undefined : value.toFixed(1);
  }
}
