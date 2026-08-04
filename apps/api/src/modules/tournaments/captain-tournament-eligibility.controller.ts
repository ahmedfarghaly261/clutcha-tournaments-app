import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { TournamentEligibilityResponseDto } from './dto/tournament-eligibility-response.dto';
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
}
