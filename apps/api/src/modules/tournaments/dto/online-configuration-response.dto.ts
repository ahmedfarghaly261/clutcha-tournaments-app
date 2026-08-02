import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnlineConfigurationPublicDetailsDto {
  @ApiProperty({ example: 'EU West' })
  serverRegion!: string;

  @ApiPropertyOptional({
    example: 'Captains join the lobby 15 minutes before match time.',
  })
  publicInstructions!: string | null;

  @ApiPropertyOptional({ example: 'Use the assigned lobby.' })
  connectionRules!: string | null;

  @ApiProperty({ example: true })
  evidenceRequired!: boolean;

  @ApiPropertyOptional({ example: 'Upload final scoreboard screenshots.' })
  screenshotRequirements!: string | null;

  @ApiPropertyOptional({ example: 30 })
  resultSubmissionDeadlineMinutes!: number | null;
}

export class OnlineConfigurationPrivateDetailsDto {
  @ApiPropertyOptional({ example: 'https://discord.gg/clutcha' })
  discordServerUrl!: string | null;

  @ApiPropertyOptional({ example: '#captain-support' })
  captainSupportChannel!: string | null;

  @ApiPropertyOptional({ example: '#match-reporting' })
  matchReportingChannel!: string | null;

  @ApiPropertyOptional({
    example: 'Lobby credentials are shared with captains after check-in.',
  })
  lobbyInstructions!: string | null;

  @ApiPropertyOptional({ example: '+20 100 000 0000' })
  privateSupportContact!: string | null;
}

export class OnlineConfigurationResponseDto {
  @ApiProperty({ example: 'online-config-id' })
  id!: string;

  @ApiProperty({ example: 'tournament-id' })
  tournamentId!: string;

  @ApiProperty({ type: OnlineConfigurationPublicDetailsDto })
  publicDetails!: OnlineConfigurationPublicDetailsDto;

  @ApiProperty({ type: OnlineConfigurationPrivateDetailsDto })
  privateDetails!: OnlineConfigurationPrivateDetailsDto;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;
}
