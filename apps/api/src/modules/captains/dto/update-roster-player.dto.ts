import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RosterType } from '@clutcha/database';

const trimOptionalRequiredString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalStringToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const lowercaseOptionalEmail = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : null;
};

export class UpdateRosterPlayerDto {
  @ApiPropertyOptional({ example: 'Fegoo', minLength: 2, maxLength: 80 })
  @Transform(trimOptionalRequiredString)
  @IsOptional()
  @IsString()
  @Length(2, 80)
  gamerTag?: string;

  @ApiPropertyOptional({ example: 'Ahmed Farghaly', nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  realName?: string | null;

  @ApiPropertyOptional({
    example: 'VALORANT#1234',
    minLength: 2,
    maxLength: 120,
  })
  @Transform(trimOptionalRequiredString)
  @IsOptional()
  @IsString()
  @Length(2, 120)
  gameAccountId?: string;

  @ApiPropertyOptional({ example: '+201001234567' })
  @Transform(trimOptionalRequiredString)
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'player@example.com', nullable: true })
  @Transform(lowercaseOptionalEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({ example: 'fegoo', nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  discordUsername?: string | null;

  @ApiPropertyOptional({ example: 'Immortal 2', nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  rank?: string | null;

  @ApiPropertyOptional({ example: 'EG', nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;

  @ApiPropertyOptional({ enum: RosterType, example: RosterType.SUBSTITUTE })
  @IsOptional()
  @IsEnum(RosterType)
  rosterType?: RosterType;
}
