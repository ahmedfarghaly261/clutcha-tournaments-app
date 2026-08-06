import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@clutcha/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  CaptainRegistrationDetailResponseDto,
  CaptainRegistrationListResponseDto,
} from './dto/captain-registration-response.dto';
import { CaptainRegistrationBracketResponseDto } from './dto/captain-registration-bracket-response.dto';
import { CaptainRegistrationCheckInResponseDto } from './dto/captain-registration-check-in-response.dto';
import { CaptainRegistrationHubResponseDto } from './dto/captain-registration-hub-response.dto';
import { CaptainRegistrationInformationResponseDto } from './dto/captain-registration-information-response.dto';
import {
  CaptainMatchListResponseDto,
  CaptainMatchResponseDto,
} from './dto/captain-registration-match-response.dto';
import { CaptainRegistrationProgressResponseDto } from './dto/captain-registration-progress-response.dto';
import { CaptainRegistrationStandingsResponseDto } from './dto/captain-registration-standings-response.dto';
import { ListCaptainRegistrationsQueryDto } from './dto/list-captain-registrations-query.dto';
import { WithdrawCaptainRegistrationDto } from './dto/withdraw-captain-registration.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('Captain Registrations')
@ApiBearerAuth('access-token')
@Roles(UserRole.CAPTAIN)
@Controller('captain/registrations')
export class CaptainRegistrationsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Captain tournament registrations',
    description:
      'Returns only tournament registrations submitted by the authenticated Captain. Supports pagination, status, game, mode, upcoming/past, and sorting filters.',
  })
  @ApiOkResponse({
    description: 'Captain registrations returned.',
    type: CaptainRegistrationListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  async listRegistrations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCaptainRegistrationsQueryDto,
  ): Promise<CaptainRegistrationListResponseDto> {
    return this.tournamentsService.listCaptainRegistrations(user.id, query);
  }

  @Get(':registrationId')
  @ApiOperation({
    summary: 'Get Captain tournament registration details',
    description:
      'Returns one registration owned by the authenticated Captain, including the Captain-visible submitted roster and contact snapshots. Another Captain receives 404.',
  })
  @ApiOkResponse({
    description: 'Captain registration details returned.',
    type: CaptainRegistrationDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    return this.tournamentsService.getCaptainRegistrationDetails(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/hub')
  @ApiOperation({
    summary: 'Get approved Captain tournament hub',
    description:
      'Returns the private approved-registration tournament hub for the authenticated Captain. Unapproved, rejected, withdrawn, disqualified, unpaid, or foreign registrations cannot access it.',
  })
  @ApiOkResponse({
    description: 'Approved Captain tournament hub returned.',
    type: CaptainRegistrationHubResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationHub(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationHubResponseDto> {
    return this.tournamentsService.getCaptainRegistrationHub(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/progress')
  @ApiOperation({
    summary: 'Get Captain tournament progress',
    description:
      'Returns real progress statistics for the authenticated Captain team in an approved tournament registration, calculated from official match data only. Placement and qualification remain null until standings/bracket rules are implemented.',
  })
  @ApiOkResponse({
    description: 'Captain tournament progress returned.',
    type: CaptainRegistrationProgressResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationProgressResponseDto> {
    return this.tournamentsService.getCaptainRegistrationProgress(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/bracket')
  @ApiOperation({
    summary: 'Get Captain-visible tournament bracket',
    description:
      'Returns read-only bracket/match structure for an approved Captain registration. It exposes safe team names, scores, statuses, stages, rounds, and bracket positions only.',
  })
  @ApiOkResponse({
    description: 'Captain-visible tournament bracket returned.',
    type: CaptainRegistrationBracketResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationBracket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationBracketResponseDto> {
    return this.tournamentsService.getCaptainRegistrationBracket(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/standings')
  @ApiOperation({
    summary: 'Get Captain-visible tournament standings',
    description:
      'Returns read-only standings calculated only from official confirmed completed/forfeit match results. No private organizer/internal data is exposed.',
  })
  @ApiOkResponse({
    description: 'Captain-visible tournament standings returned.',
    type: CaptainRegistrationStandingsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationStandings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationStandingsResponseDto> {
    return this.tournamentsService.getCaptainRegistrationStandings(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/information')
  @ApiOperation({
    summary: 'Get approved Captain private tournament information',
    description:
      'Returns private tournament communication, support, check-in, lobby, venue, room, and station information for an approved Captain registration. Lobby/server credentials are time-gated and scoped only to the Captain team.',
  })
  @ApiOkResponse({
    description: 'Approved Captain private tournament information returned.',
    type: CaptainRegistrationInformationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationInformation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationInformationResponseDto> {
    return this.tournamentsService.getCaptainRegistrationInformation(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/check-in')
  @ApiOperation({
    summary: 'Get Captain check-in readiness',
    description:
      'Returns check-in readiness for the authenticated Captain registration. Payment is handled offline/directly with the organizer; organizer approval and CONFIRMED registration status are required before check-in.',
  })
  @ApiOkResponse({
    description: 'Captain check-in readiness returned.',
    type: CaptainRegistrationCheckInResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async getRegistrationCheckIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    return this.tournamentsService.getCaptainRegistrationCheckIn(
      user.id,
      registrationId,
    );
  }

  @Post(':registrationId/check-in')
  @ApiOperation({
    summary: 'Check in Captain team',
    description:
      'Checks in an organizer-approved confirmed Captain registration. Both free and paid tournaments require organizer approval first; payment status is informational for offline payment workflows.',
  })
  @ApiOkResponse({
    description: 'Captain team checked in.',
    type: CaptainRegistrationCheckInResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  @ApiConflictResponse({
    description: 'Check-in is not currently allowed for this registration.',
  })
  async checkInRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    return this.tournamentsService.checkInCaptainRegistration(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/matches')
  @ApiOperation({
    summary: 'List Captain registration matches',
    description:
      'Returns the authenticated Captain team schedule and official read-only results for an approved tournament registration. Only matches involving the Captain team are returned.',
  })
  @ApiOkResponse({
    description: 'Captain registration matches returned.',
    type: CaptainMatchListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  async listRegistrationMatches(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
  ): Promise<CaptainMatchListResponseDto> {
    return this.tournamentsService.listCaptainRegistrationMatches(
      user.id,
      registrationId,
    );
  }

  @Get(':registrationId/matches/:matchId')
  @ApiOperation({
    summary: 'Get Captain registration match details',
    description:
      'Returns one official read-only match result/schedule record involving the authenticated Captain team. Foreign registrations or matches outside the Captain team return 404.',
  })
  @ApiOkResponse({
    description: 'Captain registration match returned.',
    type: CaptainMatchResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description:
      'The registration is not approved, paid/free, or otherwise allowed into the private tournament hub.',
  })
  @ApiNotFoundResponse({
    description:
      'The registration does not exist for this Captain, or the match does not involve this Captain team.',
  })
  async getRegistrationMatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
    @Param('matchId') matchId: string,
  ): Promise<CaptainMatchResponseDto> {
    return this.tournamentsService.getCaptainRegistrationMatch(
      user.id,
      registrationId,
      matchId,
    );
  }

  @Post(':registrationId/withdraw')
  @ApiOperation({
    summary: 'Withdraw Captain tournament registration',
    description:
      'Withdraws a registration owned by the authenticated Captain without deleting it. Submitted roster and Captain contact snapshots are preserved.',
  })
  @ApiOkResponse({
    description: 'Captain registration withdrawn.',
    type: CaptainRegistrationDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The registration does not exist for this Captain.',
  })
  @ApiConflictResponse({
    description:
      'The registration or tournament lifecycle no longer allows withdrawal.',
  })
  async withdrawRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationId') registrationId: string,
    @Body() dto: WithdrawCaptainRegistrationDto,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    return this.tournamentsService.withdrawCaptainRegistration(
      user.id,
      registrationId,
      dto,
    );
  }
}
