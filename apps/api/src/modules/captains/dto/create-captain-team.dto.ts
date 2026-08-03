import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalStringToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

export class CreateCaptainTeamDto {
  @ApiProperty({ example: 'Cairo Titans', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Competitive Valorant roster based in Cairo.',
    nullable: true,
    maxLength: 1000,
  })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({ example: 'valorant', minLength: 2, maxLength: 64 })
  @Transform(trimString)
  @IsString()
  @Length(2, 64)
  gameKey!: string;

  @ApiPropertyOptional({
    example: 'MENA',
    nullable: true,
    maxLength: 80,
  })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-logo.png',
    nullable: true,
  })
  @Transform(trimOptionalStringToNull)
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-cover.png',
    nullable: true,
  })
  @Transform(trimOptionalStringToNull)
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  coverUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://discord.gg/cairo-titans',
    nullable: true,
    description:
      "Optional Discord server invitation URL for the Captain's team. This is separate from the Captain's personal Discord username.",
  })
  @Transform(trimOptionalStringToNull)
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  discordServerUrl?: string | null;
}
