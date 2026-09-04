import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';
import { CaptainRegistrationNextAction } from './captain-registration-response.dto';

export class CaptainRegistrationHubTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null until tournament seeding/bracket models exist.',
  })
  seed!: number | null;
}

export class CaptainRegistrationHubTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logoUrl!: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.png' })
  coverUrl!: string | null;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({
    enum: TournamentStatus,
    example: TournamentStatus.REGISTRATION_CLOSED,
  })
  status!: TournamentStatus;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  startsAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-13T18:00:00.000Z' })
  endsAt!: Date | null;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;
}

export class CaptainRegistrationHubRegistrationDto {
  @ApiProperty({ example: 'registration-id' })
  id!: string;

  @ApiProperty({ enum: TournamentRegistrationStatus })
  status!: TournamentRegistrationStatus;

  @ApiProperty({ enum: RegistrationPaymentStatus })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiProperty({ enum: RegistrationApprovalStatus })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  submittedAt!: Date;

  @ApiProperty({ example: '2026-08-04T17:00:00.000Z' })
  approvedAt!: Date | null;

  @ApiProperty({ example: '1.0' })
  rulesVersion!: string;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  rulesAcceptedAt!: Date;
}

export class CaptainRegistrationHubOnlinePrivateInfoDto {
  @ApiProperty({ example: 'EU West' })
  serverRegion!: string;

  @ApiPropertyOptional({ example: 'Use assigned lobby only.' })
  connectionRules!: string | null;

  @ApiPropertyOptional({ example: 'https://discord.gg/clutcha' })
  discordServerUrl!: string | null;

  @ApiPropertyOptional({ example: '#captain-support' })
  captainSupportChannel!: string | null;

  @ApiPropertyOptional({ example: '#match-reporting' })
  matchReportingChannel!: string | null;

  @ApiPropertyOptional({ example: 'Lobby opens 15 minutes before start.' })
  lobbyInstructions!: string | null;

  @ApiPropertyOptional({ example: 'support@example.com' })
  privateSupportContact!: string | null;
}

export class CaptainRegistrationHubVenuePrivateInfoDto {
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
  venueRules!: string | null;

  @ApiPropertyOptional({ example: 'Parking is available behind hall B.' })
  parkingInfo!: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  equipmentProvided!: unknown;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  playersMayBring!: unknown;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  playersMustBring!: unknown;
}

export class CaptainRegistrationHubProgressDto {
  @ApiPropertyOptional({ nullable: true })
  currentStage!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentRound!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null until match models are implemented.',
  })
  nextMatch!: Record<string, unknown> | null;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  upcomingMatches!: unknown[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null until score/result models are implemented.',
  })
  officialScoreSummary!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  wins!: number | null;

  @ApiPropertyOptional({ nullable: true })
  losses!: number | null;

  @ApiPropertyOptional({ nullable: true })
  placement!: number | null;

  @ApiPropertyOptional({ nullable: true })
  qualificationState!: string | null;
}

export class CaptainRegistrationHubResponseDto {
  @ApiProperty({ type: CaptainRegistrationHubRegistrationDto })
  registration!: CaptainRegistrationHubRegistrationDto;

  @ApiProperty({ type: CaptainRegistrationHubTournamentDto })
  tournament!: CaptainRegistrationHubTournamentDto;

  @ApiProperty({ type: CaptainRegistrationHubTeamDto })
  team!: CaptainRegistrationHubTeamDto;

  @ApiProperty({
    description:
      'Private submitted roster snapshot visible to the approved Captain.',
    type: 'array',
    items: { type: 'object' },
  })
  rosterSnapshot!: unknown;

  @ApiProperty({ example: true })
  privateInformationAvailable!: boolean;

  @ApiPropertyOptional({
    type: CaptainRegistrationHubOnlinePrivateInfoDto,
    nullable: true,
  })
  onlinePrivateInfo!: CaptainRegistrationHubOnlinePrivateInfoDto | null;

  @ApiPropertyOptional({
    type: CaptainRegistrationHubVenuePrivateInfoDto,
    nullable: true,
  })
  venuePrivateInfo!: CaptainRegistrationHubVenuePrivateInfoDto | null;

  @ApiProperty({ type: CaptainRegistrationHubProgressDto })
  progress!: CaptainRegistrationHubProgressDto;

  @ApiProperty({ example: false })
  checkedIn!: boolean;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  announcements!: unknown[];

  @ApiProperty({ enum: CaptainRegistrationNextAction, isArray: true })
  requiredActions!: CaptainRegistrationNextAction[];
}
