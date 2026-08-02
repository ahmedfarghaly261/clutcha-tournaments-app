import { ApiProperty } from '@nestjs/swagger';

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
    type: 'array',
    items: { type: 'object' },
    example: [],
    description:
      'Recently updated organizer tournaments. Empty until tournament storage is introduced.',
  })
  recentTournaments!: [];
}
