import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentMatchDisputeStatus,
  TournamentMatchForfeitStatus,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
} from '@clutcha/database';

export class CaptainMatchOpponentDto {
  @ApiProperty({ example: 'team-opponent-id' })
  teamId!: string;

  @ApiProperty({ example: 'Falcons Esports' })
  teamName!: string;
}

export class CaptainMatchTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;
}

export class CaptainMatchGameResultDto {
  @ApiProperty({ example: 'match-game-id' })
  id!: string;

  @ApiProperty({ example: 1 })
  gameNumber!: number;

  @ApiPropertyOptional({ example: 'Bind' })
  mapName!: string | null;

  @ApiPropertyOptional({ example: 13 })
  captainTeamScore!: number | null;

  @ApiPropertyOptional({ example: 9 })
  opponentScore!: number | null;

  @ApiPropertyOptional({ example: 'team-id' })
  winnerTeamId!: string | null;

  @ApiProperty({ example: true })
  evidenceAvailable!: boolean;
}

export class CaptainMatchOnlineServerDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  onlineServerInfo!: unknown;
}

export class CaptainMatchOnsiteAssignmentDto {
  @ApiProperty({ example: 'gaming-room-id' })
  gamingRoomId!: string;

  @ApiProperty({ example: 'Main Stage Room' })
  roomName!: string;

  @ApiPropertyOptional({ example: 'Station A-04' })
  stationLabel!: string | null;
}

export class CaptainMatchResponseDto {
  @ApiProperty({ example: 'match-id' })
  id!: string;

  @ApiProperty({ type: CaptainMatchTournamentDto })
  tournament!: CaptainMatchTournamentDto;

  @ApiProperty({ example: 'GROUP_STAGE' })
  stage!: string;

  @ApiProperty({ example: 1 })
  round!: number;

  @ApiPropertyOptional({ example: 'A1' })
  bracketPosition!: string | null;

  @ApiPropertyOptional({ type: CaptainMatchOpponentDto, nullable: true })
  opponent!: CaptainMatchOpponentDto | null;

  @ApiPropertyOptional({ example: '2026-09-12T18:00:00.000Z' })
  scheduledAt!: Date | null;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;

  @ApiProperty({ example: 3 })
  bestOf!: number;

  @ApiProperty({
    enum: TournamentMatchStatus,
    example: TournamentMatchStatus.SCHEDULED,
  })
  status!: TournamentMatchStatus;

  @ApiPropertyOptional({ example: 2 })
  captainTeamScore!: number | null;

  @ApiPropertyOptional({ example: 1 })
  opponentScore!: number | null;

  @ApiProperty({ type: CaptainMatchGameResultDto, isArray: true })
  mapResults!: CaptainMatchGameResultDto[];

  @ApiPropertyOptional({ example: 'team-id' })
  winnerTeamId!: string | null;

  @ApiProperty({
    enum: TournamentMatchForfeitStatus,
    example: TournamentMatchForfeitStatus.NONE,
  })
  forfeitStatus!: TournamentMatchForfeitStatus;

  @ApiProperty({
    enum: TournamentMatchOfficialResultStatus,
    example: TournamentMatchOfficialResultStatus.PENDING,
  })
  officialResultStatus!: TournamentMatchOfficialResultStatus;

  @ApiProperty({ example: true })
  evidenceAvailable!: boolean;

  @ApiProperty({
    enum: TournamentMatchDisputeStatus,
    example: TournamentMatchDisputeStatus.NONE,
  })
  disputeStatus!: TournamentMatchDisputeStatus;

  @ApiPropertyOptional({ type: CaptainMatchOnlineServerDto, nullable: true })
  onlineServer!: CaptainMatchOnlineServerDto | null;

  @ApiPropertyOptional({
    type: CaptainMatchOnsiteAssignmentDto,
    nullable: true,
  })
  onsiteAssignment!: CaptainMatchOnsiteAssignmentDto | null;
}

export class CaptainMatchListResponseDto {
  @ApiProperty({ type: CaptainMatchResponseDto, isArray: true })
  items!: CaptainMatchResponseDto[];
}
