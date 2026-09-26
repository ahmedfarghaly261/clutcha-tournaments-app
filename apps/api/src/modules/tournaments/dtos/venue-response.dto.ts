import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VenueLocationDetailsDto {
  @ApiProperty({ example: 'CLUTCHA Arena Cairo' })
  name!: string;

  @ApiProperty({ example: 'EG' })
  country!: string;

  @ApiProperty({ example: 'Cairo' })
  city!: string;

  @ApiProperty({ example: '90 Street, New Cairo, Cairo Governorate' })
  address!: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=CLUTCHA+Arena' })
  mapUrl!: string | null;

  @ApiProperty({ example: 'Main reception desk beside Hall A' })
  checkInLocation!: string;
}

export class VenuePolicyDetailsDto {
  @ApiPropertyOptional({ example: 'Underground parking is available.' })
  parkingInfo!: string | null;

  @ApiPropertyOptional({ example: 'Spectators must register at reception.' })
  spectatorPolicy!: string | null;

  @ApiPropertyOptional({ example: 'No food or drinks near gaming stations.' })
  venueRules!: string | null;

  @ApiPropertyOptional({ example: '+20 100 000 0000' })
  emergencyContact!: string | null;
}

export class VenueEquipmentPolicyDto {
  @ApiPropertyOptional({ example: { pc: true, monitor: true } })
  equipmentProvided!: unknown;

  @ApiPropertyOptional({ example: { mouse: true, keyboard: true } })
  playersMayBring!: unknown;

  @ApiPropertyOptional({ example: { nationalId: true } })
  playersMustBring!: unknown;

  @ApiProperty({ example: true })
  personalPeripheralsAllowed!: boolean;

  @ApiProperty({ example: false })
  controllersAllowed!: boolean;

  @ApiProperty({ example: false })
  usbDevicesAllowed!: boolean;

  @ApiProperty({ example: false })
  driverInstallationAllowed!: boolean;
}

export class VenueResponseDto {
  @ApiProperty({ example: 'venue-id' })
  id!: string;

  @ApiProperty({ example: 'tournament-id' })
  tournamentId!: string;

  @ApiProperty({ type: VenueLocationDetailsDto })
  location!: VenueLocationDetailsDto;

  @ApiProperty({ type: VenuePolicyDetailsDto })
  policy!: VenuePolicyDetailsDto;

  @ApiProperty({ type: VenueEquipmentPolicyDto })
  equipmentPolicy!: VenueEquipmentPolicyDto;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;
}
