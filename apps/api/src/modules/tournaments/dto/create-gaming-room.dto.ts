import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GamingRoomPurpose } from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateGamingRoomDto {
  @ApiProperty({ example: 'Main Stage Room', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Primary competition room.',
    maxLength: 1000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    enum: GamingRoomPurpose,
    example: GamingRoomPurpose.COMPETITION,
  })
  @IsEnum(GamingRoomPurpose)
  purpose!: GamingRoomPurpose;

  @ApiProperty({ example: 20, minimum: 1, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  stationCount!: number;

  @ApiProperty({
    example: 'Intel Core i7-14700K',
    minLength: 2,
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  cpu!: string;

  @ApiProperty({
    example: 'NVIDIA RTX 4070 Super',
    minLength: 2,
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  gpu!: string;

  @ApiPropertyOptional({ example: '32GB DDR5', maxLength: 100 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ram?: string;

  @ApiPropertyOptional({ example: '1TB NVMe SSD', maxLength: 100 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storage?: string;

  @ApiPropertyOptional({ example: 'Windows 11 Pro', maxLength: 100 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingSystem?: string;

  @ApiPropertyOptional({ example: 'BenQ Zowie', maxLength: 100 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  monitorBrand?: string;

  @ApiProperty({ example: 'XL2546K', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  monitorModel!: string;

  @ApiPropertyOptional({ example: 24.5, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(100)
  monitorSizeInches?: number;

  @ApiPropertyOptional({ example: '1920x1080', maxLength: 50 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  monitorResolution?: string;

  @ApiProperty({ example: 240, minimum: 30, maximum: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(1000)
  monitorRefreshRateHz!: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  monitorResponseTimeMs?: number;

  @ApiProperty({
    example: 'Logitech G Pro X Superlight',
    minLength: 2,
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  mouse!: string;

  @ApiProperty({ example: 'Wooting 60HE', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  keyboard!: string;

  @ApiProperty({ example: 'HyperX Cloud II', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  headset!: string;

  @ApiPropertyOptional({ example: 'SteelSeries QcK Heavy', maxLength: 150 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mousePad?: string;

  @ApiPropertyOptional({ example: 'Xbox Wireless Controller', maxLength: 150 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  controller?: string;

  @ApiPropertyOptional({
    example: 'Dedicated wired fiber connection.',
    maxLength: 300,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  internetConnection?: string;

  @ApiPropertyOptional({
    example: 'All PCs have tournament accounts preloaded.',
    maxLength: 2000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  equipmentNotes?: string;
}
