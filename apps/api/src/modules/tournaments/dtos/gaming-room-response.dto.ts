import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GamingRoomPurpose } from '@clutcha/database';

export class GamingRoomPcSpecsDto {
  @ApiProperty({ example: 'Intel Core i7-14700K' })
  cpu!: string;

  @ApiProperty({ example: 'NVIDIA RTX 4070 Super' })
  gpu!: string;

  @ApiPropertyOptional({ example: '32GB DDR5' })
  ram!: string | null;

  @ApiPropertyOptional({ example: '1TB NVMe SSD' })
  storage!: string | null;

  @ApiPropertyOptional({ example: 'Windows 11 Pro' })
  operatingSystem!: string | null;
}

export class GamingRoomMonitorDetailsDto {
  @ApiPropertyOptional({ example: 'BenQ Zowie' })
  brand!: string | null;

  @ApiProperty({ example: 'XL2546K' })
  model!: string;

  @ApiPropertyOptional({ example: '24.5' })
  sizeInches!: string | null;

  @ApiPropertyOptional({ example: '1920x1080' })
  resolution!: string | null;

  @ApiProperty({ example: 240 })
  refreshRateHz!: number;

  @ApiPropertyOptional({ example: '1' })
  responseTimeMs!: string | null;
}

export class GamingRoomPeripheralDetailsDto {
  @ApiProperty({ example: 'Logitech G Pro X Superlight' })
  mouse!: string;

  @ApiProperty({ example: 'Wooting 60HE' })
  keyboard!: string;

  @ApiProperty({ example: 'HyperX Cloud II' })
  headset!: string;

  @ApiPropertyOptional({ example: 'SteelSeries QcK Heavy' })
  mousePad!: string | null;

  @ApiPropertyOptional({ example: 'Xbox Wireless Controller' })
  controller!: string | null;
}

export class GamingRoomResponseDto {
  @ApiProperty({ example: 'gaming-room-id' })
  id!: string;

  @ApiProperty({ example: 'venue-id' })
  venueId!: string;

  @ApiProperty({ example: 'Main Stage Room' })
  name!: string;

  @ApiPropertyOptional({ example: 'Primary competition room.' })
  description!: string | null;

  @ApiProperty({
    enum: GamingRoomPurpose,
    example: GamingRoomPurpose.COMPETITION,
  })
  purpose!: GamingRoomPurpose;

  @ApiProperty({ example: 20 })
  stationCount!: number;

  @ApiProperty({ type: GamingRoomPcSpecsDto })
  pcSpecs!: GamingRoomPcSpecsDto;

  @ApiProperty({ type: GamingRoomMonitorDetailsDto })
  monitor!: GamingRoomMonitorDetailsDto;

  @ApiProperty({ type: GamingRoomPeripheralDetailsDto })
  peripherals!: GamingRoomPeripheralDetailsDto;

  @ApiPropertyOptional({ example: 'Dedicated wired fiber connection.' })
  internetConnection!: string | null;

  @ApiPropertyOptional({
    example: 'All PCs have tournament accounts preloaded.',
  })
  equipmentNotes!: string | null;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;
}
