import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GamingRoomPurpose,
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
} from '@clutcha/database';
import {
  VenueEquipmentPolicyDto,
  VenueLocationDetailsDto,
} from './venue-response.dto';

export class PublicOnlineConfigurationDto {
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

export class PublicVenuePolicyDto {
  @ApiPropertyOptional({ example: 'Underground parking is available.' })
  parkingInfo!: string | null;

  @ApiPropertyOptional({ example: 'Spectators must register at reception.' })
  spectatorPolicy!: string | null;

  @ApiPropertyOptional({ example: 'No food or drinks near gaming stations.' })
  venueRules!: string | null;
}

export class PublicGamingRoomPcSpecsDto {
  @ApiProperty({ example: 'Intel Core i7-14700K' })
  cpu!: string;

  @ApiProperty({ example: 'NVIDIA RTX 4070 Super' })
  gpu!: string;

  @ApiPropertyOptional({ example: '32GB DDR5' })
  ram!: string | null;

  @ApiPropertyOptional({ example: '1TB NVMe SSD' })
  storage!: string | null;

  @ApiPropertyOptional({ example: 'Windows 11 Pro' })
  operatingSystem!: string | null;
}

export class PublicGamingRoomMonitorDto {
  @ApiPropertyOptional({ example: 'BenQ Zowie' })
  brand!: string | null;

  @ApiProperty({ example: 'XL2546K' })
  model!: string;

  @ApiPropertyOptional({ example: '24.5' })
  sizeInches!: string | null;

  @ApiPropertyOptional({ example: '1920x1080' })
  resolution!: string | null;

  @ApiProperty({ example: 240 })
  refreshRateHz!: number;

  @ApiPropertyOptional({ example: '1' })
  responseTimeMs!: string | null;
}

export class PublicGamingRoomPeripheralsDto {
  @ApiProperty({ example: 'Logitech G Pro X Superlight' })
  mouse!: string;

  @ApiProperty({ example: 'Wooting 60HE' })
  keyboard!: string;

  @ApiProperty({ example: 'HyperX Cloud II' })
  headset!: string;

  @ApiPropertyOptional({ example: 'SteelSeries QcK Heavy' })
  mousePad!: string | null;

  @ApiPropertyOptional({ example: 'Xbox Wireless Controller' })
  controller!: string | null;
}

export class PublicGamingRoomDto {
  @ApiProperty({ example: 'gaming-room-id' })
  id!: string;

  @ApiProperty({ example: 'Main Stage Room' })
  name!: string;

  @ApiPropertyOptional({ example: 'Primary competition room.' })
  description!: string | null;

  @ApiProperty({
    enum: GamingRoomPurpose,
    example: GamingRoomPurpose.COMPETITION,
  })
  purpose!: GamingRoomPurpose;

  @ApiProperty({ example: 20 })
  stationCount!: number;

  @ApiProperty({ type: PublicGamingRoomPcSpecsDto })
  pcSpecs!: PublicGamingRoomPcSpecsDto;

  @ApiProperty({ type: PublicGamingRoomMonitorDto })
  monitor!: PublicGamingRoomMonitorDto;

  @ApiProperty({ type: PublicGamingRoomPeripheralsDto })
  peripherals!: PublicGamingRoomPeripheralsDto;
}

export class PublicVenueDto {
  @ApiProperty({ type: VenueLocationDetailsDto })
  location!: VenueLocationDetailsDto;

  @ApiProperty({ type: PublicVenuePolicyDto })
  policy!: PublicVenuePolicyDto;

  @ApiProperty({ type: VenueEquipmentPolicyDto })
  equipmentPolicy!: VenueEquipmentPolicyDto;

  @ApiProperty({ type: [PublicGamingRoomDto] })
  gamingRooms!: PublicGamingRoomDto[];
}

export class PublicTournamentDetailResponseDto {
  @ApiProperty({ example: '4cfdc82f-8d23-4c43-8db3-7c1c2b4b35f6' })
  id!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiPropertyOptional({ example: 'A competitive Valorant tournament.' })
  shortDescription!: string | null;

  @ApiPropertyOptional({ example: 'Tournament long description.' })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/tournaments/logo.png',
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/tournaments/cover.png',
  })
  coverUrl!: string | null;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({
    enum: TournamentStatus,
    example: TournamentStatus.REGISTRATION_OPEN,
  })
  status!: TournamentStatus;

  @ApiProperty({
    enum: TournamentFormat,
    example: TournamentFormat.SINGLE_ELIMINATION,
  })
  format!: TournamentFormat;

  @ApiProperty({ example: 8 })
  minimumTeams!: number;

  @ApiProperty({ example: 16 })
  maximumTeams!: number;

  @ApiProperty({ example: 5 })
  minimumStarters!: number;

  @ApiProperty({ example: 5 })
  maximumStarters!: number;

  @ApiProperty({ example: 2 })
  maximumSubstitutes!: number;

  @ApiProperty({ example: 1 })
  defaultBestOf!: number;

  @ApiProperty({ example: 3 })
  finalBestOf!: number;

  @ApiProperty({
    enum: TournamentSeedingMethod,
    example: TournamentSeedingMethod.MANUAL,
  })
  seedingMethod!: TournamentSeedingMethod;

  @ApiProperty({ example: false })
  thirdPlaceMatch!: boolean;

  @ApiProperty({ example: true })
  requiredGameAccountId!: boolean;

  @ApiPropertyOptional({ example: 'MENA' })
  allowedRegion!: string | null;

  @ApiProperty({ example: ['EG', 'SA'], type: [String] })
  allowedCountries!: string[];

  @ApiProperty({ example: ['PC'], type: [String] })
  allowedPlatforms!: string[];

  @ApiPropertyOptional({ example: 16 })
  minimumPlayerAge!: number | null;

  @ApiPropertyOptional({ example: 'Gold' })
  minimumRank!: string | null;

  @ApiPropertyOptional({ example: 'Immortal' })
  maximumRank!: string | null;

  @ApiProperty({ example: '0' })
  registrationFee!: string;

  @ApiProperty({ example: 'EGP' })
  currency!: string;

  @ApiProperty({ example: '10000' })
  prizePool!: string;

  @ApiPropertyOptional({ example: { first: '70%', second: '30%' } })
  prizeDistribution!: unknown;

  @ApiPropertyOptional({ example: 'No refunds after registration closes.' })
  refundPolicy!: string | null;

  @ApiPropertyOptional({ example: 'Organizer cancellation policy.' })
  cancellationPolicy!: string | null;

  @ApiProperty({ example: 'Teams must follow CLUTCHA rules.' })
  rules!: string;

  @ApiProperty({ example: '1.0' })
  rulesVersion!: string;

  @ApiPropertyOptional({ example: 'Roster changes close before start.' })
  rosterChangeRules!: string | null;

  @ApiPropertyOptional({ example: 'Captains must check in before matches.' })
  checkInRules!: string | null;

  @ApiPropertyOptional({ example: 'Captains submit scores with screenshots.' })
  matchReportingRules!: string | null;

  @ApiPropertyOptional({ example: 'Final scoreboard screenshot required.' })
  evidenceRequirements!: string | null;

  @ApiPropertyOptional({ example: 60 })
  disputeDeadlineMinutes!: number | null;

  @ApiPropertyOptional({ example: 'Late teams forfeit.' })
  forfeitRules!: string | null;

  @ApiPropertyOptional({ example: 'Players must behave respectfully.' })
  codeOfConduct!: string | null;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  registrationOpensAt!: Date;

  @ApiProperty({ example: '2026-09-10T20:00:00.000Z' })
  registrationClosesAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-11T20:00:00.000Z' })
  rosterLocksAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-09-12T16:00:00.000Z' })
  checkInOpensAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-09-12T17:30:00.000Z' })
  checkInClosesAt!: Date | null;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  startsAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-13T23:00:00.000Z' })
  endsAt!: Date | null;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;

  @ApiProperty({ example: false })
  waitlistEnabled!: boolean;

  @ApiPropertyOptional({ example: 8 })
  maximumWaitlistSize!: number | null;

  @ApiPropertyOptional()
  publishedAt!: Date | null;

  @ApiPropertyOptional()
  registrationOpenedAt!: Date | null;

  @ApiPropertyOptional()
  registrationClosedAt!: Date | null;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: PublicOnlineConfigurationDto })
  onlineConfiguration!: PublicOnlineConfigurationDto | null;

  @ApiPropertyOptional({ type: PublicVenueDto })
  venue!: PublicVenueDto | null;
}
