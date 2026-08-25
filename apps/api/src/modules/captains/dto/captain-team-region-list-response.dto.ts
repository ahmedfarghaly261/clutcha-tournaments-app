import { ApiProperty } from '@nestjs/swagger';

export class CaptainTeamRegionListResponseDto {
  @ApiProperty({
    example: ['MENA', 'EU'],
    description:
      'Distinct tournament region requirements captains can use for team eligibility.',
  })
  regions!: string[];
}
