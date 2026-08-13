import { ApiProperty } from '@nestjs/swagger';
import { TournamentMode, TournamentStatus } from '@clutcha/database';

export class OrganizerDashboardSummaryDto {
  @ApiProperty({
    example: 0,
    description: 'Total tournaments owned by the organizer.',
  })
  totalTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Draft tournaments owned by the organizer.',
  })
  draftTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Published tournaments owned by the organizer.',
  })
  publishedTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Registration-open tournaments owned by the organizer.',
  })
  registrationOpenTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Upcoming tournaments owned by the organizer.',
  })
  upcomingTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Live tournaments owned by the organizer.',
  })
  liveTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Completed tournaments owned by the organizer.',
  })
  completedTournaments!: number;

  @ApiProperty({
    example: 0,
    description: 'Cancelled tournaments owned by the organizer.',
  })
  cancelledTournaments!: number;
}

export class OrganizerDashboardResponseDto {
  @ApiProperty({
    type: OrganizerDashboardSummaryDto,
    description: 'Organizer-owned tournament summary statistics.',
  })
  summary!: OrganizerDashboardSummaryDto;

  @ApiProperty({
    type: () => [OrganizerDashboardRecentTournamentDto],
    description: 'The five most recently updated organizer tournaments.',
  })
  recentTournaments!: OrganizerDashboardRecentTournamentDto[];
}

export class OrganizerDashboardRecentTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({ enum: TournamentStatus, example: TournamentStatus.DRAFT })
  status!: TournamentStatus;

  @ApiProperty({ example: 'https://example.com/cover.webp', nullable: true })
  coverUrl!: string | null;

  @ApiProperty({ example: '2026-09-12T16:00:00.000Z' })
  startsAt!: Date;

  @ApiProperty({ example: '2026-08-14T10:30:00.000Z' })
  updatedAt!: Date;
}
