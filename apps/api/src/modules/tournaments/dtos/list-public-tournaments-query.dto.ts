import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentMode, TournamentStatus } from '@clutcha/database';
import { SortDirection } from './list-organizer-tournaments-query.dto';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum PublicTournamentSortBy {
  PUBLISHED_AT = 'publishedAt',
  STARTS_AT = 'startsAt',
  REGISTRATION_CLOSES_AT = 'registrationClosesAt',
  NAME = 'name',
}

export class ListPublicTournamentsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'One-based page number.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Number of public tournaments per page.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'valorant cairo',
    maxLength: 100,
    description:
      'Searches public tournament name, slug, short description, and game key.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: TournamentMode, example: TournamentMode.ONLINE })
  @IsOptional()
  @IsEnum(TournamentMode)
  mode?: TournamentMode;

  @ApiPropertyOptional({
    enum: TournamentStatus,
    example: TournamentStatus.REGISTRATION_OPEN,
    description:
      'Filters public lifecycle status. Draft, private, unlisted, cancelled, and archived tournaments are never returned.',
  })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @ApiPropertyOptional({ example: 'valorant', maxLength: 64 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gameKey?: string;

  @ApiPropertyOptional({
    enum: PublicTournamentSortBy,
    example: PublicTournamentSortBy.PUBLISHED_AT,
    default: PublicTournamentSortBy.PUBLISHED_AT,
  })
  @IsOptional()
  @IsEnum(PublicTournamentSortBy)
  sortBy?: PublicTournamentSortBy;

  @ApiPropertyOptional({
    enum: SortDirection,
    example: SortDirection.DESC,
    default: SortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}
