import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UserRole } from '@clutcha/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { TournamentEligibilityResponseDto } from './dto/tournament-eligibility-response.dto';
import { TournamentRegistrationResponseDto } from './dto/tournament-registration-response.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('Captain Tournaments')
@ApiBearerAuth('access-token')
@Roles(UserRole.CAPTAIN)
@Controller('tournaments')
export class CaptainTournamentEligibilityController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get(':tournamentId/eligibility')
  @ApiOperation({
    summary: 'Check Captain team eligibility for a tournament',
    description:
      'Checks the authenticated Captain single team against the current tournament and roster requirements. teamId and captainId are never accepted from the request. Eligibility problems are returned as structured issues.',
  })
  @ApiOkResponse({
    description: 'Eligibility result returned.',
    type: TournamentEligibilityResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The tournament does not exist.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The authenticated Captain has not created a team.',
  })
  async getEligibility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId') tournamentId: string,
  ): Promise<TournamentEligibilityResponseDto> {
    return this.tournamentsService.getCaptainTournamentEligibility(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/registrations')
  @ApiOperation({
    summary: 'Register Captain team for a tournament',
    description:
      'Registers the authenticated Captain single team for the tournament. The request never accepts teamId, captainId, statuses, payment fields, approval fields, or snapshots. The server stores immutable roster and Captain contact snapshots transactionally.',
  })
  @ApiCreatedResponse({
    description: 'Tournament registration submitted.',
    type: TournamentRegistrationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Tournament rules were not accepted.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The tournament does not exist.',
  })
  @ApiConflictResponse({
    description: 'The team is already registered for this tournament.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The authenticated Captain team is not eligible.',
  })
  async createRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationResponseDto> {
    return this.tournamentsService.createCaptainTournamentRegistration(
      user.id,
      tournamentId,
      dto,
    );
  }
}
