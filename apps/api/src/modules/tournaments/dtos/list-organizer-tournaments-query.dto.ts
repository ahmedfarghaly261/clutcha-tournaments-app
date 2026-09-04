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
import {
  TournamentMode,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum OrganizerTournamentSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STARTS_AT = 'startsAt',
  REGISTRATION_CLOSES_AT = 'registrationClosesAt',
  NAME = 'name',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListOrganizerTournamentsQueryDto {
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
    description: 'Number of tournaments per page.',
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
      'Searches tournament name, slug, short description, and game key.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: TournamentStatus,
    example: TournamentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @ApiPropertyOptional({ enum: TournamentMode, example: TournamentMode.ONLINE })
  @IsOptional()
  @IsEnum(TournamentMode)
  mode?: TournamentMode;

  @ApiPropertyOptional({
    enum: TournamentVisibility,
    example: TournamentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(TournamentVisibility)
  visibility?: TournamentVisibility;

  @ApiPropertyOptional({ example: 'valorant', maxLength: 64 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gameKey?: string;

  @ApiPropertyOptional({
    enum: OrganizerTournamentSortBy,
    example: OrganizerTournamentSortBy.CREATED_AT,
    default: OrganizerTournamentSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(OrganizerTournamentSortBy)
  sortBy?: OrganizerTournamentSortBy;

  @ApiPropertyOptional({
    enum: SortDirection,
    example: SortDirection.DESC,
    default: SortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}
