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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RosterType } from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
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

export class CreateRosterPlayerDto {
  @ApiProperty({ example: 'Fegoo', minLength: 2, maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @Length(2, 80)
  gamerTag!: string;

  @ApiPropertyOptional({ example: 'Ahmed Farghaly', nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  realName?: string | null;

  @ApiProperty({ example: 'VALORANT#1234', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  gameAccountId!: string;

  @ApiProperty({ example: '+201001234567' })
  @Transform(trimString)
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phoneNumber!: string;

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

  @ApiPropertyOptional({ enum: RosterType, example: RosterType.STARTER })
  @IsOptional()
  @IsEnum(RosterType)
  rosterType?: RosterType;
}
