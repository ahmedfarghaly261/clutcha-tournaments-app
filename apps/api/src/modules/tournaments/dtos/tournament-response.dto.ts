import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentFormat,
  TournamentMode,
  TournamentSeedingMethod,
  TournamentStatus,
  TournamentVisibility,
} from '@clutcha/database';

export class TournamentResponseDto {
  @ApiProperty({ example: '4cfdc82f-8d23-4c43-8db3-7c1c2b4b35f6' })
  id!: string;

  @ApiProperty({ example: '29debd22-2a27-48f9-8e92-8545c042fc3c' })
  organizerId!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

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
    enum: TournamentVisibility,
    example: TournamentVisibility.PUBLIC,
  })
  visibility!: TournamentVisibility;

  @ApiProperty({ enum: TournamentStatus, example: TournamentStatus.DRAFT })
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

  @ApiProperty({ example: true })
  manualApprovalRequired!: boolean;

  @ApiPropertyOptional()
  publishedAt!: Date | null;

  @ApiPropertyOptional()
  registrationOpenedAt!: Date | null;

  @ApiPropertyOptional()
  registrationClosedAt!: Date | null;

  @ApiPropertyOptional()
  cancelledAt!: Date | null;

  @ApiPropertyOptional({ example: 'Cancelled by organizer.' })
  cancellationReason!: string | null;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;
}
