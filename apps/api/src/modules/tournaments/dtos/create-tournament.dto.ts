import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentVisibility,
} from '@clutcha/database';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const uppercaseString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateTournamentDto {
  @ApiProperty({
    example: 'CLUTCHA Valorant Cairo Cup',
    minLength: 3,
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @Length(3, 150)
  name!: string;

  @ApiPropertyOptional({
    example: 'A competitive Valorant tournament for Cairo teams.',
    maxLength: 300,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional({
    example:
      'Teams compete through a single-elimination bracket with organizer review before publication.',
    maxLength: 5000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/tournaments/logo.png',
  })
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  logoUrl?: string;

  @ApiProperty({ example: 'valorant', maxLength: 64 })
  @Transform(trimString)
  @IsString()
  @Length(2, 64)
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  @IsEnum(TournamentMode)
  mode!: TournamentMode;

  @ApiPropertyOptional({
    enum: TournamentVisibility,
    example: TournamentVisibility.PUBLIC,
    default: TournamentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(TournamentVisibility)
  visibility?: TournamentVisibility;

  @ApiProperty({
    enum: TournamentFormat,
    example: TournamentFormat.SINGLE_ELIMINATION,
  })
  @IsEnum(TournamentFormat)
  format!: TournamentFormat;

  @ApiProperty({ example: 8, minimum: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(2)
  minimumTeams!: number;

  @ApiProperty({ example: 16, minimum: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(2)
  maximumTeams!: number;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumStarters!: number;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maximumStarters!: number;

  @ApiPropertyOptional({ example: 2, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumSubstitutes?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  defaultBestOf?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, default: 3 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  finalBestOf?: number;

  @ApiPropertyOptional({
    enum: TournamentSeedingMethod,
    example: TournamentSeedingMethod.MANUAL,
    default: TournamentSeedingMethod.MANUAL,
  })
  @IsOptional()
  @IsEnum(TournamentSeedingMethod)
  seedingMethod?: TournamentSeedingMethod;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  thirdPlaceMatch?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  requiredGameAccountId?: boolean;

  @ApiPropertyOptional({ example: 'MENA', maxLength: 64 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  allowedRegion?: string;

  @ApiPropertyOptional({
    example: ['EG', 'SA'],
    type: [String],
    maxItems: 50,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(2, { each: true })
  allowedCountries?: string[];

  @ApiPropertyOptional({
    example: ['PC'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  allowedPlatforms?: string[];

  @ApiPropertyOptional({ example: 16, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minimumPlayerAge?: number;

  @ApiPropertyOptional({ example: 'Gold', maxLength: 64 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  minimumRank?: string;

  @ApiPropertyOptional({ example: 'Immortal', maxLength: 64 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  maximumRank?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  registrationFee?: number;

  @ApiPropertyOptional({ example: 'EGP', default: 'EGP' })
  @Transform(uppercaseString)
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({ example: 10000, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prizePool?: number;

  @ApiPropertyOptional({
    example: { first: '70%', second: '30%' },
    type: Object,
  })
  @IsOptional()
  prizeDistribution?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'No refunds after registration closes.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  refundPolicy?: string;

  @ApiPropertyOptional({
    example: 'Organizer may cancel if fewer than 8 teams register.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cancellationPolicy?: string;

  @ApiProperty({
    example: 'Teams must follow the CLUTCHA competitive ruleset.',
  })
  @Transform(trimString)
  @IsString()
  @Length(10, 20000)
  rules!: string;

  @ApiPropertyOptional({ example: '1.0', default: '1.0', maxLength: 32 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  rulesVersion?: string;

  @ApiPropertyOptional({
    example: 'Roster changes close 24 hours before start.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  rosterChangeRules?: string;

  @ApiPropertyOptional({
    example: 'Captains must check in 30 minutes before match time.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  checkInRules?: string;

  @ApiPropertyOptional({ example: 'Captains submit scores with screenshots.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  matchReportingRules?: string;

  @ApiPropertyOptional({
    example: 'Screenshot of the final scoreboard is required.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  evidenceRequirements?: string;

  @ApiPropertyOptional({ example: 60, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  disputeDeadlineMinutes?: number;

  @ApiPropertyOptional({ example: 'Teams 15 minutes late forfeit the match.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  forfeitRules?: string;

  @ApiPropertyOptional({ example: 'Players must behave respectfully.' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  codeOfConduct?: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  registrationOpensAt!: Date;

  @ApiProperty({ example: '2026-09-10T20:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  registrationClosesAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-11T20:00:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  rosterLocksAt?: Date;

  @ApiPropertyOptional({ example: '2026-09-12T16:00:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  checkInOpensAt?: Date;

  @ApiPropertyOptional({ example: '2026-09-12T17:30:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  checkInClosesAt?: Date;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-13T23:00:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endsAt?: Date;

  @ApiPropertyOptional({ example: 'Africa/Cairo', default: 'Africa/Cairo' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @ApiPropertyOptional({ example: 8, minimum: 1 })
  @ValidateIf((dto: CreateTournamentDto) => dto.waitlistEnabled === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maximumWaitlistSize?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  manualApprovalRequired?: boolean;
}
