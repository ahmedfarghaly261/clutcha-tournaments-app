import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentFormat,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
} from '@clutcha/database';

export class OrganizerBracketTournamentDto {
  @ApiProperty({ example: '2df149ea-a859-4553-a87a-c6cf5bbdb5b8' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ enum: TournamentStatus })
  status!: TournamentStatus;

  @ApiProperty({ enum: TournamentFormat })
  format!: TournamentFormat;

  @ApiProperty({ enum: TournamentSeedingMethod })
  seedingMethod!: TournamentSeedingMethod;

  @ApiProperty({ enum: TournamentMode })
  mode!: TournamentMode;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;
}

export class OrganizerBracketTeamDto {
  @ApiProperty({ example: '8f42c1fc-5ef8-45d0-8730-f5cdd7c967c7' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/teams/logo.webp',
  })
  logoUrl!: string | null;
}

export class OrganizerBracketMatchDto {
  @ApiProperty({ example: 'match-id' })
  id!: string;

  @ApiProperty({ example: 'MAIN_BRACKET' })
  stage!: string;

  @ApiProperty({ example: 1 })
  round!: number;

  @ApiProperty({ example: 'R1-M1' })
  bracketPosition!: string;

  @ApiProperty({ example: 1 })
  bestOf!: number;

  @ApiPropertyOptional({ example: '2026-09-12T18:00:00.000Z' })
  scheduledAt!: Date | null;

  @ApiProperty({ enum: TournamentMatchStatus })
  status!: TournamentMatchStatus;

  @ApiPropertyOptional({ type: OrganizerBracketTeamDto, nullable: true })
  teamA!: OrganizerBracketTeamDto | null;

  @ApiPropertyOptional({ type: OrganizerBracketTeamDto, nullable: true })
  teamB!: OrganizerBracketTeamDto | null;

  @ApiPropertyOptional({ example: 2 })
  teamAScore!: number | null;

  @ApiPropertyOptional({ example: 1 })
  teamBScore!: number | null;

  @ApiPropertyOptional({ example: '8f42c1fc-5ef8-45d0-8730-f5cdd7c967c7' })
  winnerTeamId!: string | null;

  @ApiProperty({ enum: TournamentMatchOfficialResultStatus })
  officialResultStatus!: TournamentMatchOfficialResultStatus;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  onlineServerInfo!: unknown;

  @ApiPropertyOptional({ example: '2df149ea-a859-4553-a87a-c6cf5bbdb5b8' })
  gamingRoomId!: string | null;

  @ApiPropertyOptional({ example: 'Main Stage Room' })
  gamingRoomName!: string | null;

  @ApiPropertyOptional({ example: 'Station A-04' })
  onsiteStationLabel!: string | null;
}

export class OrganizerBracketRoundDto {
  @ApiProperty({ example: 1 })
  round!: number;

  @ApiProperty({ example: 'Quarterfinals' })
  label!: string;

  @ApiProperty({ type: OrganizerBracketMatchDto, isArray: true })
  matches!: OrganizerBracketMatchDto[];
}

export class OrganizerBracketResponseDto {
  @ApiProperty({ type: OrganizerBracketTournamentDto })
  tournament!: OrganizerBracketTournamentDto;

  @ApiProperty({ example: false })
  generated!: boolean;

  @ApiProperty({ example: 6 })
  teamCount!: number;

  @ApiProperty({ example: 8 })
  bracketSize!: number;

  @ApiProperty({ type: OrganizerBracketTeamDto, isArray: true })
  approvedTeams!: OrganizerBracketTeamDto[];

  @ApiProperty({ type: OrganizerBracketRoundDto, isArray: true })
  rounds!: OrganizerBracketRoundDto[];
}
