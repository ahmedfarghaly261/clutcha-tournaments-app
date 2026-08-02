import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpsertVenueDto {
  @ApiProperty({ example: 'CLUTCHA Arena Cairo', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'EG', minLength: 2, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  country!: string;

  @ApiProperty({ example: 'Cairo', minLength: 2, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  city!: string;

  @ApiProperty({
    example: '90 Street, New Cairo, Cairo Governorate',
    minLength: 5,
    maxLength: 500,
  })
  @Transform(trimString)
  @IsString()
  @Length(5, 500)
  address!: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=CLUTCHA+Arena' })
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  mapUrl?: string;

  @ApiProperty({
    example: 'Main reception desk beside Hall A',
    minLength: 2,
    maxLength: 300,
  })
  @Transform(trimString)
  @IsString()
  @Length(2, 300)
  checkInLocation!: string;

  @ApiPropertyOptional({ example: 'Underground parking is available.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  parkingInfo?: string;

  @ApiPropertyOptional({ example: 'Spectators must register at reception.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  spectatorPolicy?: string;

  @ApiPropertyOptional({ example: 'No food or drinks near gaming stations.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  venueRules?: string;

  @ApiPropertyOptional({ example: '+20 100 000 0000' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContact?: string;

  @ApiPropertyOptional({
    example: { pc: true, monitor: true, peripherals: false },
    type: Object,
  })
  @IsOptional()
  equipmentProvided?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { mouse: true, keyboard: true, headset: true },
    type: Object,
  })
  @IsOptional()
  playersMayBring?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { nationalId: true, controller: false },
    type: Object,
  })
  @IsOptional()
  playersMustBring?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  personalPeripheralsAllowed?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  controllersAllowed?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  usbDevicesAllowed?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  driverInstallationAllowed?: boolean;
}
