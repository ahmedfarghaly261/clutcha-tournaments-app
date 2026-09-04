import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TournamentFormat,
  TournamentMode,
  TournamentStatus,
} from '@clutcha/database';

export class PublicTournamentSummaryResponseDto {
  @ApiProperty({ example: '4cfdc82f-8d23-4c43-8db3-7c1c2b4b35f6' })
  id!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiPropertyOptional({ example: 'A competitive Valorant tournament.' })
  shortDescription!: string | null;

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

  @ApiProperty({ example: '0' })
  registrationFee!: string;

  @ApiProperty({ example: 'EGP' })
  currency!: string;

  @ApiProperty({ example: '10000' })
  prizePool!: string;

  @ApiProperty({ example: '2026-09-10T20:00:00.000Z' })
  registrationClosesAt!: Date;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  startsAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-13T23:00:00.000Z' })
  endsAt!: Date | null;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;

  @ApiProperty({ example: false })
  waitlistEnabled!: boolean;

  @ApiPropertyOptional()
  publishedAt!: Date | null;

  @ApiPropertyOptional()
  registrationOpenedAt!: Date | null;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-02T12:00:00.000Z' })
  updatedAt!: Date;
}
