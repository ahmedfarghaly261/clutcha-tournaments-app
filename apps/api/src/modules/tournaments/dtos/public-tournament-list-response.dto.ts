import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './organizer-tournament-list-response.dto';
import { PublicTournamentSummaryResponseDto } from './public-tournament-summary-response.dto';

export class PublicTournamentListResponseDto {
  @ApiProperty({ type: [PublicTournamentSummaryResponseDto] })
  items!: PublicTournamentSummaryResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
