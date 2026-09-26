import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentMode } from '@clutcha/database';

export class CaptainInformationTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;
}

export class CaptainInformationReleaseGateDto {
  @ApiProperty({ example: true })
  lobbyInformationReleased!: boolean;

  @ApiPropertyOptional({ example: '2026-09-11T18:00:00.000Z' })
  lobbyInformationReleasesAt!: Date | null;
}

export class CaptainOnlinePrivateInformationDto {
  @ApiProperty({ example: 'EU West' })
  serverRegion!: string;

  @ApiPropertyOptional({ example: 'Use the assigned lobby only.' })
  connectionRules!: string | null;

  @ApiPropertyOptional({ example: 'https://discord.gg/clutcha' })
  tournamentDiscordInvitation!: string | null;

  @ApiPropertyOptional({ example: '#captain-support' })
  captainSupportChannel!: string | null;

  @ApiPropertyOptional({ example: '#match-reporting' })
  matchReportingChannel!: string | null;

  @ApiPropertyOptional({ example: 'Upload final scoreboard screenshots.' })
  technicalSupportInstructions!: string | null;

  @ApiPropertyOptional({ example: 'support@example.com' })
  organizerSupportContact!: string | null;

  @ApiPropertyOptional({ example: 'Lobby opens 15 minutes before start.' })
  lobbyInformation!: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  nextMatchServerInformation!: unknown;
}

export class CaptainVenuePrivateInformationDto {
  @ApiProperty({ example: 'CLUTCHA Arena' })
  name!: string;

  @ApiProperty({ example: 'Egypt' })
  country!: string;

  @ApiProperty({ example: 'Cairo' })
  city!: string;

  @ApiProperty({ example: '123 Arena Street' })
  address!: string;

  @ApiPropertyOptional({ example: 'https://maps.example.com/arena' })
  mapUrl!: string | null;

  @ApiProperty({ example: 'Main entrance desk' })
  checkInLocation!: string;

  @ApiPropertyOptional({ example: 'Bring national ID.' })
  venueInstructions!: string | null;

  @ApiPropertyOptional({ example: 'Parking is available behind hall B.' })
  parkingInfo!: string | null;

  @ApiPropertyOptional({ example: '2026-09-12T16:30:00.000Z' })
  arrivalTime!: Date | null;

  @ApiPropertyOptional({ example: 'gaming-room-id' })
  assignedRoomId!: string | null;

  @ApiPropertyOptional({ example: 'Main Stage Room' })
  assignedRoomName!: string | null;

  @ApiPropertyOptional({ example: 'Station A-04' })
  assignedStation!: string | null;
}

export class CaptainRegistrationInformationResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainInformationTournamentDto })
  tournament!: CaptainInformationTournamentDto;

  @ApiProperty({ type: CaptainInformationReleaseGateDto })
  releaseGate!: CaptainInformationReleaseGateDto;

  @ApiPropertyOptional({
    example: 'Captains must check in 30 minutes before start.',
  })
  checkInInstructions!: string | null;

  @ApiPropertyOptional({
    type: CaptainOnlinePrivateInformationDto,
    nullable: true,
  })
  onlineInformation!: CaptainOnlinePrivateInformationDto | null;

  @ApiPropertyOptional({
    type: CaptainVenuePrivateInformationDto,
    nullable: true,
  })
  venueInformation!: CaptainVenuePrivateInformationDto | null;
}
