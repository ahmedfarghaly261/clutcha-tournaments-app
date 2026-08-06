import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
} from '@clutcha/database';

export class CaptainBracketTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;
}

export class CaptainBracketTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiProperty({ example: true })
  isCaptainTeam!: boolean;
}

export class CaptainBracketMatchDto {
  @ApiProperty({ example: 'match-id' })
  id!: string;

  @ApiProperty({ example: 'GROUP_STAGE' })
  stage!: string;

  @ApiProperty({ example: 1 })
  round!: number;

  @ApiPropertyOptional({ example: 'A1' })
  bracketPosition!: string | null;

  @ApiPropertyOptional({ example: '2026-09-12T18:00:00.000Z' })
  scheduledAt!: Date | null;

  @ApiProperty({
    enum: TournamentMatchStatus,
    example: TournamentMatchStatus.SCHEDULED,
  })
  status!: TournamentMatchStatus;

  @ApiPropertyOptional({ type: CaptainBracketTeamDto, nullable: true })
  teamA!: CaptainBracketTeamDto | null;

  @ApiPropertyOptional({ type: CaptainBracketTeamDto, nullable: true })
  teamB!: CaptainBracketTeamDto | null;

  @ApiPropertyOptional({ example: 2 })
  teamAScore!: number | null;

  @ApiPropertyOptional({ example: 1 })
  teamBScore!: number | null;

  @ApiPropertyOptional({ example: 'team-id' })
  winnerTeamId!: string | null;

  @ApiProperty({
    enum: TournamentMatchOfficialResultStatus,
    example: TournamentMatchOfficialResultStatus.PENDING,
  })
  officialResultStatus!: TournamentMatchOfficialResultStatus;
}

export class CaptainBracketStageDto {
  @ApiProperty({ example: 'GROUP_STAGE' })
  stage!: string;

  @ApiProperty({ type: CaptainBracketMatchDto, isArray: true })
  matches!: CaptainBracketMatchDto[];
}

export class CaptainRegistrationBracketResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainBracketTournamentDto })
  tournament!: CaptainBracketTournamentDto;

  @ApiProperty({ example: 'team-id' })
  captainTeamId!: string;

  @ApiProperty({ type: CaptainBracketStageDto, isArray: true })
  stages!: CaptainBracketStageDto[];
}
