import { ApiProperty } from '@nestjs/swagger';
import { TournamentResponseDto } from './tournament-response.dto';

export class PublicationReadinessIssueDto {
  @ApiProperty({ example: 'onlineConfiguration' })
  field!: string;

  @ApiProperty({
    example:
      'Online tournaments require online configuration before publishing.',
  })
  message!: string;
}

export class PublicationReadinessDto {
  @ApiProperty({ example: false })
  ready!: boolean;

  @ApiProperty({ type: [PublicationReadinessIssueDto] })
  issues!: PublicationReadinessIssueDto[];
}

export class OrganizerTournamentDetailResponseDto {
  @ApiProperty({ type: TournamentResponseDto })
  tournament!: TournamentResponseDto;

  @ApiProperty({ type: PublicationReadinessDto })
  publicationReadiness!: PublicationReadinessDto;
}
