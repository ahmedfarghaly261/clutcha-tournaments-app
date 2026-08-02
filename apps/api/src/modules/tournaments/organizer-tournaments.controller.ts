import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@clutcha/database';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('Organizer Tournaments')
@ApiBearerAuth('access-token')
@Roles(UserRole.ORGANIZER)
@Controller('organizer/tournaments')
export class OrganizerTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create tournament draft',
    description:
      'Creates a draft tournament owned by the authenticated organizer. The organizerId is always taken from the JWT access token, never from the request body.',
  })
  @ApiCreatedResponse({
    description: 'Tournament draft created.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The create tournament payload is malformed or contains unsupported fields.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'The tournament draft payload has invalid cross-field business rules.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.createOrganizerDraft(user.id, dto);
  }
}
