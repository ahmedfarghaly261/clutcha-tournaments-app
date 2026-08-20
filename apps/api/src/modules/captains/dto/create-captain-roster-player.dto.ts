import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
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

export class CreateCaptainRosterPlayerDto {
  @ApiProperty({ example: 'Fegoo', minLength: 2, maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @Length(2, 80)
  gamerTag!: string;

  @ApiProperty({ example: 'VALORANT#1234', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  gameAccountId!: string;

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
