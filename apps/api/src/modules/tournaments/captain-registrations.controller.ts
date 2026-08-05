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
