import { type GamingRoomPurpose } from '@clutcha/database';
import { type GamingRoomResponseDto } from '../dto/gaming-room-response.dto';

export type GamingRoomRecord = {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  purpose: GamingRoomPurpose;
  stationCount: number;
  cpu: string;
  gpu: string;
  ram: string | null;
  storage: string | null;
  operatingSystem: string | null;
  monitorBrand: string | null;
  monitorModel: string;
  monitorSizeInches: { toString(): string } | null;
  monitorResolution: string | null;
  monitorRefreshRateHz: number;
  monitorResponseTimeMs: { toString(): string } | null;
  mouse: string;
  keyboard: string;
  headset: string;
  mousePad: string | null;
  controller: string | null;
  internetConnection: string | null;
  equipmentNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toGamingRoomResponse = (
  room: GamingRoomRecord,
): GamingRoomResponseDto => ({
  id: room.id,
  venueId: room.venueId,
  name: room.name,
  description: room.description,
  purpose: room.purpose,
  stationCount: room.stationCount,
  pcSpecs: {
    cpu: room.cpu,
    gpu: room.gpu,
    ram: room.ram,
    storage: room.storage,
    operatingSystem: room.operatingSystem,
  },
  monitor: {
    brand: room.monitorBrand,
    model: room.monitorModel,
    sizeInches: room.monitorSizeInches?.toString() ?? null,
    resolution: room.monitorResolution,
    refreshRateHz: room.monitorRefreshRateHz,
    responseTimeMs: room.monitorResponseTimeMs?.toString() ?? null,
  },
  peripherals: {
    mouse: room.mouse,
    keyboard: room.keyboard,
    headset: room.headset,
    mousePad: room.mousePad,
    controller: room.controller,
  },
  internetConnection: room.internetConnection,
  equipmentNotes: room.equipmentNotes,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});
