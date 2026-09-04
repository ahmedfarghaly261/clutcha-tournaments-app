import { ApiProperty } from '@nestjs/swagger';

export class CaptainStandingTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiProperty({ example: true })
  isCaptainTeam!: boolean;
}

export class CaptainStandingItemDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ type: CaptainStandingTeamDto })
  team!: CaptainStandingTeamDto;

  @ApiProperty({ example: 2 })
  wins!: number;

  @ApiProperty({ example: 1 })
  losses!: number;

  @ApiProperty({ example: 3 })
  matchesPlayed!: number;

  @ApiProperty({ example: 5 })
  mapsWon!: number;

  @ApiProperty({ example: 2 })
  mapsLost!: number;

  @ApiProperty({ example: 3 })
  mapDifferential!: number;
}

export class CaptainRegistrationStandingsResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ example: 'tournament-id' })
  tournamentId!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  tournamentName!: string;

  @ApiProperty({ example: 'team-id' })
  captainTeamId!: string;

  @ApiProperty({
    description:
      'Standings calculated only from official confirmed completed/forfeit matches.',
  })
  officialResultsOnly!: true;

  @ApiProperty({ type: CaptainStandingItemDto, isArray: true })
  items!: CaptainStandingItemDto[];
}
