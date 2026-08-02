import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ListPublicTournamentsQueryDto } from './dto/list-public-tournaments-query.dto';
import { PublicTournamentDetailResponseDto } from './dto/public-tournament-detail-response.dto';
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

  @Get(':slug')
  @ApiOperation({
    summary: 'Get public tournament details',
    description:
      'Returns public details for a discoverable tournament. Online private Discord, lobby, support, and internal organizer data are never returned.',
  })
  @ApiOkResponse({
    description: 'Public tournament details returned.',
    type: PublicTournamentDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not publicly discoverable.',
  })
  async getPublicTournamentDetails(
    @Param('slug') slug: string,
  ): Promise<PublicTournamentDetailResponseDto> {
    return this.tournamentsService.getPublicTournamentDetails(slug);
  }
}
