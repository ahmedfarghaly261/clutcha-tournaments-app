import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamStatus } from '@clutcha/database';

export enum CaptainDashboardAction {
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  CREATE_TEAM = 'CREATE_TEAM',
  ADD_ROSTER_PLAYERS = 'ADD_ROSTER_PLAYERS',
  COMPLETE_PAYMENT = 'COMPLETE_PAYMENT',
  WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL',
  CHECK_IN = 'CHECK_IN',
  OPEN_TOURNAMENT_HUB = 'OPEN_TOURNAMENT_HUB',
  VIEW_MATCH = 'VIEW_MATCH',
  NONE = 'NONE',
}

export class CaptainDashboardProfileDto {
  @ApiProperty({ example: 'captain-user-id' })
  id!: string;

  @ApiProperty({ example: 'Ahmed Farghaly' })
  displayName!: string;

  @ApiProperty({ example: true })
  profileComplete!: boolean;
}

export class CaptainDashboardTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiProperty({ example: 'cairo-titans' })
  slug!: string;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiPropertyOptional({ example: 'MENA', nullable: true })
  region!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-logo.png',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-cover.png',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiProperty({ enum: TeamStatus, example: TeamStatus.ACTIVE })
  status!: TeamStatus;
}

export class CaptainDashboardRosterDto {
  @ApiProperty({ example: 7 })
  totalCount!: number;

  @ApiProperty({ example: 5 })
  starterCount!: number;

  @ApiProperty({ example: 2 })
  substituteCount!: number;
}

export class CaptainDashboardResponseDto {
  @ApiProperty({ type: CaptainDashboardProfileDto })
  profile!: CaptainDashboardProfileDto;

  @ApiPropertyOptional({
    type: CaptainDashboardTeamDto,
    nullable: true,
  })
  team!: CaptainDashboardTeamDto | null;

  @ApiPropertyOptional({
    type: CaptainDashboardRosterDto,
    nullable: true,
  })
  roster!: CaptainDashboardRosterDto | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: false,
    example: null,
    nullable: true,
    description:
      'Null until tournament-registration persistence exists. The dashboard does not invent unavailable registration statistics.',
  })
  activeTournamentRegistrations!: Record<string, never> | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: false,
    example: null,
    nullable: true,
    description:
      'Null until tournament-registration persistence exists. The dashboard does not invent unavailable upcoming tournament data.',
  })
  upcomingTournament!: Record<string, never> | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: false,
    example: null,
    nullable: true,
    description:
      'Null until match persistence exists. The dashboard does not invent unavailable match data.',
  })
  upcomingMatch!: Record<string, never> | null;

  @ApiProperty({
    enum: CaptainDashboardAction,
    example: CaptainDashboardAction.ADD_ROSTER_PLAYERS,
  })
  actionRequired!: CaptainDashboardAction;

  @ApiProperty({
    enum: CaptainDashboardAction,
    isArray: true,
    example: [CaptainDashboardAction.ADD_ROSTER_PLAYERS],
  })
  requiredActions!: CaptainDashboardAction[];
}
