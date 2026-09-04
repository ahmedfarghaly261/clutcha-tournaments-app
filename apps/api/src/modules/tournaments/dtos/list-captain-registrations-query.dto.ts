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
  TournamentRegistrationStatus,
} from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum CaptainRegistrationSortBy {
  SUBMITTED_AT = 'submittedAt',
  TOURNAMENT_STARTS_AT = 'tournamentStartsAt',
}

export enum CaptainRegistrationTimeFilter {
  UPCOMING = 'upcoming',
  PAST = 'past',
}

export enum CaptainRegistrationSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListCaptainRegistrationsQueryDto {
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
    description: 'Number of Captain registrations per page.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: TournamentRegistrationStatus,
    example: TournamentRegistrationStatus.PENDING_APPROVAL,
  })
  @IsOptional()
  @IsEnum(TournamentRegistrationStatus)
  status?: TournamentRegistrationStatus;

  @ApiPropertyOptional({ example: 'valorant' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gameKey?: string;

  @ApiPropertyOptional({ enum: TournamentMode, example: TournamentMode.ONLINE })
  @IsOptional()
  @IsEnum(TournamentMode)
  mode?: TournamentMode;

  @ApiPropertyOptional({
    enum: CaptainRegistrationTimeFilter,
    example: CaptainRegistrationTimeFilter.UPCOMING,
  })
  @IsOptional()
  @IsEnum(CaptainRegistrationTimeFilter)
  time?: CaptainRegistrationTimeFilter;

  @ApiPropertyOptional({
    enum: CaptainRegistrationSortBy,
    example: CaptainRegistrationSortBy.SUBMITTED_AT,
    default: CaptainRegistrationSortBy.SUBMITTED_AT,
  })
  @IsOptional()
  @IsEnum(CaptainRegistrationSortBy)
  sortBy?: CaptainRegistrationSortBy;

  @ApiPropertyOptional({
    enum: CaptainRegistrationSortDirection,
    example: CaptainRegistrationSortDirection.DESC,
    default: CaptainRegistrationSortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(CaptainRegistrationSortDirection)
  sortDirection?: CaptainRegistrationSortDirection;
}
