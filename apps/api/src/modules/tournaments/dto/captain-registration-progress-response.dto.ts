import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentMatchStatus } from '@clutcha/database';

export class CaptainProgressTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;
}

export class CaptainProgressTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;
}

export class CaptainProgressOpponentDto {
  @ApiProperty({ example: 'team-opponent-id' })
  teamId!: string;

  @ApiProperty({ example: 'Falcons Esports' })
  teamName!: string;
}

export class CaptainProgressMatchSummaryDto {
  @ApiProperty({ example: 'match-id' })
  id!: string;

  @ApiProperty({ example: 'GROUP_STAGE' })
  stage!: string;

  @ApiProperty({ example: 2 })
  round!: number;

  @ApiPropertyOptional({ example: 'A2' })
  bracketPosition!: string | null;

  @ApiPropertyOptional({ type: CaptainProgressOpponentDto, nullable: true })
  opponent!: CaptainProgressOpponentDto | null;

  @ApiPropertyOptional({ example: '2026-09-13T18:00:00.000Z' })
  scheduledAt!: Date | null;

  @ApiProperty({
    enum: TournamentMatchStatus,
    example: TournamentMatchStatus.SCHEDULED,
  })
  status!: TournamentMatchStatus;
}

export class CaptainOfficialScoreSummaryDto {
  @ApiProperty({ example: 3 })
  matchesWithOfficialResults!: number;

  @ApiProperty({ example: 5 })
  mapsWon!: number;

  @ApiProperty({ example: 2 })
  mapsLost!: number;
}

export class CaptainRegistrationProgressResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainProgressTournamentDto })
  tournament!: CaptainProgressTournamentDto;

  @ApiProperty({ type: CaptainProgressTeamDto })
  team!: CaptainProgressTeamDto;

  @ApiPropertyOptional({ example: 'GROUP_STAGE', nullable: true })
  currentStage!: string | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  currentRound!: number | null;

  @ApiPropertyOptional({
    type: CaptainProgressMatchSummaryDto,
    nullable: true,
  })
  nextMatch!: CaptainProgressMatchSummaryDto | null;

  @ApiProperty({ type: CaptainProgressMatchSummaryDto, isArray: true })
  upcomingMatches!: CaptainProgressMatchSummaryDto[];

  @ApiProperty({ example: 2 })
  wins!: number;

  @ApiProperty({ example: 1 })
  losses!: number;

  @ApiProperty({ example: 3 })
  matchesPlayed!: number;

  @ApiProperty({ example: 2 })
  matchesRemaining!: number;

  @ApiProperty({ type: CaptainOfficialScoreSummaryDto })
  officialScoreSummary!: CaptainOfficialScoreSummaryDto;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null until standings/bracket placement logic is implemented.',
  })
  placement!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null until qualification rules are implemented.',
  })
  qualificationState!: string | null;
}
