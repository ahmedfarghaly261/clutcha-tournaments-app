import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentPaymentMethodType } from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalStringToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class UpsertTournamentPaymentMethodDto {
  @ApiProperty({ enum: TournamentPaymentMethodType })
  @IsEnum(TournamentPaymentMethodType)
  type!: TournamentPaymentMethodType;

  @ApiProperty({ example: 'Vodafone Cash', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  accountHolderName?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  accountIdentifier?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 40 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  instapayAddress?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bankName?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bankBranch?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 80 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bankAccountNumber?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 80 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  iban?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 40 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  swiftCode?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(trimOptionalStringToNull)
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  externalUrl?: string | null;

  @ApiProperty({ minLength: 10, maxLength: 4000 })
  @Transform(trimString)
  @IsString()
  @Length(10, 4000)
  instructions!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 1000 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
