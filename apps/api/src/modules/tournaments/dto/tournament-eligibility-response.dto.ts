import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TournamentEligibilityIssueCode {
  CAPTAIN_PROFILE_INCOMPLETE = 'CAPTAIN_PROFILE_INCOMPLETE',
  TEAM_NOT_CREATED = 'TEAM_NOT_CREATED',
  TEAM_INACTIVE = 'TEAM_INACTIVE',
  REGISTRATION_NOT_OPEN = 'REGISTRATION_NOT_OPEN',
  REGISTRATION_DEADLINE_PASSED = 'REGISTRATION_DEADLINE_PASSED',
  TOURNAMENT_FULL = 'TOURNAMENT_FULL',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  GAME_MISMATCH = 'GAME_MISMATCH',
  INSUFFICIENT_STARTERS = 'INSUFFICIENT_STARTERS',
  TOO_MANY_STARTERS = 'TOO_MANY_STARTERS',
  TOO_MANY_SUBSTITUTES = 'TOO_MANY_SUBSTITUTES',
  MISSING_GAME_ACCOUNT_ID = 'MISSING_GAME_ACCOUNT_ID',
  MISSING_PLAYER_PHONE = 'MISSING_PLAYER_PHONE',
  REGION_NOT_ALLOWED = 'REGION_NOT_ALLOWED',
  COUNTRY_NOT_ALLOWED = 'COUNTRY_NOT_ALLOWED',
  PLATFORM_NOT_ALLOWED = 'PLATFORM_NOT_ALLOWED',
  RANK_NOT_ALLOWED = 'RANK_NOT_ALLOWED',
  PLAYER_INELIGIBLE = 'PLAYER_INELIGIBLE',
}

export class TournamentEligibilityTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;
}

export class TournamentEligibilityIssueDto {
  @ApiProperty({
    enum: TournamentEligibilityIssueCode,
    example: TournamentEligibilityIssueCode.INSUFFICIENT_STARTERS,
  })
  code!: TournamentEligibilityIssueCode;

  @ApiProperty({ example: 'roster' })
  field!: string;

  @ApiProperty({
    example: 'This tournament requires at least five starter players.',
  })
  message!: string;
}

export class TournamentEligibilityResponseDto {
  @ApiProperty({ example: false })
  eligible!: boolean;

  @ApiPropertyOptional({
    type: TournamentEligibilityTeamDto,
    nullable: true,
  })
  team!: TournamentEligibilityTeamDto | null;

  @ApiProperty({
    type: TournamentEligibilityIssueDto,
    isArray: true,
  })
  issues!: TournamentEligibilityIssueDto[];
}
