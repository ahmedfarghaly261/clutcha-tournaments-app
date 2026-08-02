import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ListPublicTournamentsQueryDto } from './dto/list-public-tournaments-query.dto';
import { PublicTournamentListResponseDto } from './dto/public-tournament-list-response.dto';
import { TournamentsService } from './tournaments.service';

@Public()
@ApiTags('Public Tournaments')
@Controller('tournaments')
export class PublicTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Discover public tournaments',
    description:
      'Returns paginated public tournaments with optional filters, search, and sorting. Draft, private, unlisted, cancelled, archived, and organizer-only fields are never returned.',
  })
  @ApiOkResponse({
    description: 'Public tournaments returned.',
    type: PublicTournamentListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The public tournament listing query parameters are invalid.',
  })
  async listPublicTournaments(
    @Query() query: ListPublicTournamentsQueryDto,
  ): Promise<PublicTournamentListResponseDto> {
    return this.tournamentsService.listPublicTournaments(query);
  }
}
