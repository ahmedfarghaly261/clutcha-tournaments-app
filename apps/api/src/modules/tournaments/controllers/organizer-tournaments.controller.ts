import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@clutcha/database';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { type Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CancelTournamentDto } from '../dtos/cancel-tournament.dto';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';
import { CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { GenerateOrganizerBracketDto } from '../dtos/generate-organizer-bracket.dto';
import { GamingRoomListResponseDto } from '../dtos/gaming-room-list-response.dto';
import { GamingRoomResponseDto } from '../dtos/gaming-room-response.dto';
import { ListOrganizerTournamentsQueryDto } from '../dtos/list-organizer-tournaments-query.dto';
import { OrganizerTournamentDetailResponseDto } from '../dtos/organizer-tournament-detail-response.dto';
import { OrganizerTournamentListResponseDto } from '../dtos/organizer-tournament-list-response.dto';
import { OnlineConfigurationResponseDto } from '../dtos/online-configuration-response.dto';
import {
  OrganizerBracketMatchDto,
  OrganizerBracketResponseDto,
} from '../dtos/organizer-bracket-response.dto';
import {
  OrganizerRegistrationDetailResponseDto,
  OrganizerRegistrationListResponseDto,
} from '../dtos/organizer-registration-response.dto';
import { PaymentProofResponseDto } from '../dtos/payment-proof-response.dto';
import { RejectPaymentProofDto } from '../dtos/reject-payment-proof.dto';
import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import { RejectOrganizerRegistrationDto } from '../dtos/reject-organizer-registration.dto';
import { ScheduleOrganizerMatchDto } from '../dtos/schedule-organizer-match.dto';
import { TournamentPaymentMethodResponseDto } from '../dtos/tournament-payment-method-response.dto';
import { UpdateGamingRoomDto } from '../dtos/update-gaming-room.dto';
import { UpdateTournamentDraftDto } from '../dtos/update-tournament-draft.dto';
import { UpsertOnlineConfigurationDto } from '../dtos/upsert-online-configuration.dto';
import { UpsertTournamentPaymentMethodDto } from '../dtos/upsert-tournament-payment-method.dto';
import { UpsertVenueDto } from '../dtos/upsert-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';
import { TournamentsService } from '../services/tournaments.service';
import { type TournamentCoverImageFile } from '../services/tournament-cover-image-storage.service';

const tournamentCoverImageUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

const tournamentCoverImageUploadBody = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'JPEG, PNG, or WebP tournament cover image up to 5MB.',
      },
    },
  },
};

@ApiTags('Organizer Tournaments')
@ApiBearerAuth('access-token')
@Roles(UserRole.ORGANIZER)
@Controller('organizer/tournaments')
export class OrganizerTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List organizer tournaments',
    description:
      'Returns paginated tournaments owned by the authenticated organizer, with optional filters, search, and sorting.',
  })
  @ApiOkResponse({
    description: 'Organizer tournaments returned.',
    type: OrganizerTournamentListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament listing query parameters are invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async listOrganizerTournaments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrganizerTournamentsQueryDto,
  ): Promise<OrganizerTournamentListResponseDto> {
    return this.tournamentsService.listOrganizerTournaments(user.id, query);
  }

  @Get(':tournamentId')
  @ApiOperation({
    summary: 'Get organizer tournament details',
    description:
      'Returns private organizer-owned tournament details and the current publication readiness result.',
  })
  @ApiOkResponse({
    description: 'Organizer tournament details returned.',
    type: OrganizerTournamentDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async getOrganizerTournamentDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<OrganizerTournamentDetailResponseDto> {
    return this.tournamentsService.getOrganizerTournamentDetails(
      user.id,
      tournamentId,
    );
  }

  @Get(':tournamentId/bracket')
  @ApiOperation({
    summary: 'Get organizer tournament bracket',
    description:
      'Returns approved teams and the generated single-elimination bracket for an organizer-owned tournament.',
  })
  @ApiOkResponse({
    description: 'Organizer tournament bracket returned.',
    type: OrganizerBracketResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async getTournamentBracket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<OrganizerBracketResponseDto> {
    return this.tournamentsService.getOrganizerTournamentBracket(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/bracket/generate')
  @ApiOperation({
    summary: 'Generate organizer tournament bracket',
    description:
      'Generates a single-elimination bracket once from all approved teams. The supplied team ids define seed order unless the tournament uses random seeding.',
  })
  @ApiCreatedResponse({
    description: 'Single-elimination bracket generated.',
    type: OrganizerBracketResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or seed-order payload is invalid.',
  })
  @ApiConflictResponse({
    description:
      'Registration is not closed, fewer than two teams are approved, the format is unsupported, the seed list is invalid, or a bracket already exists.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async generateTournamentBracket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: GenerateOrganizerBracketDto,
  ): Promise<OrganizerBracketResponseDto> {
    return this.tournamentsService.generateOrganizerTournamentBracket(
      user.id,
      tournamentId,
      dto,
    );
  }

  @Patch(':tournamentId/matches/:matchId/schedule')
  @ApiOperation({
    summary: 'Schedule organizer tournament match',
    description:
      'Schedules or reschedules a generated match. Online tournaments require private lobby information; on-site tournaments require a tournament-owned gaming room and station label.',
  })
  @ApiOkResponse({
    description: 'Tournament match schedule and assignment updated.',
    type: OrganizerBracketMatchDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id, match id, or schedule payload is invalid.',
  })
  @ApiConflictResponse({
    description:
      'The tournament lifecycle or current match status does not allow scheduling.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'The schedule is outside the tournament window or its assignment does not match the tournament mode.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament, match, or assigned gaming room does not exist in the organizer-owned tournament.',
  })
  async scheduleTournamentMatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
    @Body() dto: ScheduleOrganizerMatchDto,
  ): Promise<OrganizerBracketMatchDto> {
    return this.tournamentsService.scheduleOrganizerTournamentMatch(
      user.id,
      tournamentId,
      matchId,
      dto,
    );
  }

  @Get(':tournamentId/registrations')
  @ApiOperation({
    summary: 'List organizer tournament registrations',
    description:
      'Returns registrations submitted to an organizer-owned tournament. Captain and roster contact snapshots are visible only because the team submitted to this organizer tournament.',
  })
  @ApiOkResponse({
    description: 'Organizer tournament registrations returned.',
    type: OrganizerRegistrationListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async listTournamentRegistrations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<OrganizerRegistrationListResponseDto> {
    return this.tournamentsService.listOrganizerTournamentRegistrations(
      user.id,
      tournamentId,
    );
  }

  @Get(':tournamentId/registrations/:registrationId')
  @ApiOperation({
    summary: 'Get organizer tournament registration details',
    description:
      'Returns a single registration for an organizer-owned tournament, including submitted Captain and roster contact snapshots.',
  })
  @ApiOkResponse({
    description: 'Organizer tournament registration details returned.',
    type: OrganizerRegistrationDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or registration id is not a valid UUID.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or registration does not exist for this organizer.',
  })
  async getTournamentRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentsService.getOrganizerTournamentRegistration(
      user.id,
      tournamentId,
      registrationId,
    );
  }

  @Post(':tournamentId/registrations/:registrationId/approve')
  @ApiOperation({
    summary: 'Approve organizer tournament registration',
    description:
      'Approves a pending registration for an organizer-owned tournament when payment, capacity, and eligibility requirements pass.',
  })
  @ApiOkResponse({
    description: 'Registration approved.',
    type: OrganizerRegistrationDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or registration id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description:
      'The registration cannot be approved because of payment, approval, lifecycle, capacity, or eligibility requirements.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or registration does not exist for this organizer.',
  })
  async approveTournamentRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentsService.approveOrganizerTournamentRegistration(
      user.id,
      tournamentId,
      registrationId,
    );
  }

  @Post(':tournamentId/registrations/:registrationId/reject')
  @ApiOperation({
    summary: 'Reject organizer tournament registration',
    description:
      'Rejects a pending registration for an organizer-owned tournament. A rejection reason is required.',
  })
  @ApiOkResponse({
    description: 'Registration rejected.',
    type: OrganizerRegistrationDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The tournament id, registration id, or rejection payload is invalid.',
  })
  @ApiConflictResponse({
    description: 'The registration cannot be rejected from its current state.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or registration does not exist for this organizer.',
  })
  async rejectTournamentRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: RejectOrganizerRegistrationDto,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentsService.rejectOrganizerTournamentRegistration(
      user.id,
      tournamentId,
      registrationId,
      dto,
    );
  }

  @Post(':tournamentId/registrations/:registrationId/payment-proof/verify')
  @ApiOperation({
    summary: 'Manually verify payment proof',
    description:
      'Marks the latest submitted payment proof as verified. The organizer must first confirm that the money reached their own account; CLUTCHA does not verify payments.',
  })
  @ApiOkResponse({
    description: 'Payment proof manually verified.',
    type: PaymentProofResponseDto,
  })
  async verifyRegistrationPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ): Promise<PaymentProofResponseDto> {
    return this.tournamentsService.verifyOrganizerRegistrationPaymentProof(
      user.id,
      tournamentId,
      registrationId,
    );
  }

  @Post(':tournamentId/registrations/:registrationId/payment-proof/reject')
  @ApiOperation({
    summary: 'Reject payment proof',
    description:
      'Rejects the latest submitted payment proof and records an organizer-provided reason for the Captain.',
  })
  @ApiOkResponse({
    description: 'Payment proof rejected.',
    type: PaymentProofResponseDto,
  })
  async rejectRegistrationPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: RejectPaymentProofDto,
  ): Promise<PaymentProofResponseDto> {
    return this.tournamentsService.rejectOrganizerRegistrationPaymentProof(
      user.id,
      tournamentId,
      registrationId,
      dto,
    );
  }

  @Patch(':tournamentId')
  @ApiOperation({
    summary: 'Update tournament draft',
    description:
      'Updates an organizer-owned tournament while it is still in DRAFT status.',
  })
  @ApiOkResponse({
    description: 'Tournament draft updated.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or update payload is invalid.',
  })
  @ApiConflictResponse({
    description: 'Only draft tournaments can be updated.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'The updated tournament draft would violate cross-field business rules.',
  })
  async updateTournamentDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: UpdateTournamentDraftDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.updateOrganizerTournamentDraft(
      user.id,
      tournamentId,
      dto,
    );
  }

  @Get(':tournamentId/payment-methods')
  @ApiOperation({
    summary: 'List tournament payment methods',
    description:
      'Returns manual payment methods configured for an organizer-owned tournament.',
  })
  @ApiOkResponse({
    description: 'Payment methods returned.',
    type: TournamentPaymentMethodResponseDto,
    isArray: true,
  })
  async listPaymentMethods(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<TournamentPaymentMethodResponseDto[]> {
    return this.tournamentsService.listOrganizerTournamentPaymentMethods(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/payment-methods')
  @ApiOperation({
    summary: 'Create tournament payment method',
    description:
      'Adds a manual payment method for an organizer-owned tournament.',
  })
  @ApiCreatedResponse({
    description: 'Payment method created.',
    type: TournamentPaymentMethodResponseDto,
  })
  async createPaymentMethod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: UpsertTournamentPaymentMethodDto,
  ): Promise<TournamentPaymentMethodResponseDto> {
    return this.tournamentsService.createOrganizerTournamentPaymentMethod(
      user.id,
      tournamentId,
      dto,
    );
  }

  @Patch(':tournamentId/payment-methods/:paymentMethodId')
  @ApiOperation({
    summary: 'Update tournament payment method',
    description:
      'Updates a manual payment method for an organizer-owned tournament.',
  })
  @ApiOkResponse({
    description: 'Payment method updated.',
    type: TournamentPaymentMethodResponseDto,
  })
  async updatePaymentMethod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('paymentMethodId', new ParseUUIDPipe()) paymentMethodId: string,
    @Body() dto: UpsertTournamentPaymentMethodDto,
  ): Promise<TournamentPaymentMethodResponseDto> {
    return this.tournamentsService.updateOrganizerTournamentPaymentMethod(
      user.id,
      tournamentId,
      paymentMethodId,
      dto,
    );
  }

  @Delete(':tournamentId/payment-methods/:paymentMethodId')
  @ApiOperation({
    summary: 'Delete tournament payment method',
    description:
      'Removes a manual payment method from an organizer-owned tournament.',
  })
  @ApiOkResponse({
    description: 'Payment method deleted.',
    type: TournamentPaymentMethodResponseDto,
  })
  async deletePaymentMethod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('paymentMethodId', new ParseUUIDPipe()) paymentMethodId: string,
  ): Promise<TournamentPaymentMethodResponseDto> {
    return this.tournamentsService.deleteOrganizerTournamentPaymentMethod(
      user.id,
      tournamentId,
      paymentMethodId,
    );
  }

  @Delete(':tournamentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete tournament draft',
    description:
      'Deletes an organizer-owned tournament while it is still in DRAFT status.',
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Only draft tournaments can be deleted.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async deleteTournamentDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<void> {
    await this.tournamentsService.deleteOrganizerTournamentDraft(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/publish')
  @ApiOperation({
    summary: 'Publish tournament',
    description:
      'Publishes an organizer-owned draft tournament after publication validation passes.',
  })
  @ApiOkResponse({
    description: 'Tournament published.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Only draft tournaments can be published.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'The tournament is missing publication requirements and cannot be published.',
  })
  async publishTournament(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.publishOrganizerTournament(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/open-registration')
  @ApiOperation({
    summary: 'Open tournament registration',
    description:
      'Moves an organizer-owned published tournament into REGISTRATION_OPEN status.',
  })
  @ApiOkResponse({
    description: 'Tournament registration opened.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Only published tournaments can open registration.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async openRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.openOrganizerTournamentRegistration(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/close-registration')
  @ApiOperation({
    summary: 'Close tournament registration',
    description:
      'Moves an organizer-owned registration-open tournament into REGISTRATION_CLOSED status.',
  })
  @ApiOkResponse({
    description: 'Tournament registration closed.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Only registration-open tournaments can close registration.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async closeRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.closeOrganizerTournamentRegistration(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/open-check-in')
  @ApiOperation({
    summary: 'Open tournament check-in',
    description:
      'Moves an organizer-owned registration-closed tournament into CHECK_IN_OPEN status.',
  })
  @ApiOkResponse({
    description: 'Tournament check-in opened.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Only registration-closed tournaments can open check-in.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async openCheckIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.openOrganizerTournamentCheckIn(
      user.id,
      tournamentId,
    );
  }

  @Post(':tournamentId/cancel')
  @ApiOperation({
    summary: 'Cancel tournament',
    description:
      'Cancels an organizer-owned tournament that has not reached a terminal lifecycle status.',
  })
  @ApiOkResponse({
    description: 'Tournament cancelled.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or cancellation payload is invalid.',
  })
  @ApiConflictResponse({
    description: 'The tournament cannot be cancelled from its current status.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async cancelTournament(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: CancelTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.cancelOrganizerTournament(
      user.id,
      tournamentId,
      dto,
    );
  }

  @Get(':tournamentId/online-configuration')
  @ApiOperation({
    summary: 'Get online tournament configuration',
    description:
      'Returns online configuration for an organizer-owned ONLINE tournament. Private organizer-only fields are grouped separately from public details.',
  })
  @ApiOkResponse({
    description: 'Online tournament configuration returned.',
    type: OnlineConfigurationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description:
      'Online configuration is only available for ONLINE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or online configuration does not exist, or the tournament is not owned by the authenticated organizer.',
  })
  async getOnlineConfiguration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentsService.getOnlineConfiguration(
      user.id,
      tournamentId,
    );
  }

  @Put(':tournamentId/online-configuration')
  @ApiOperation({
    summary: 'Upsert online tournament configuration',
    description:
      'Creates or replaces online configuration for an organizer-owned ONLINE tournament. Private organizer-only fields are grouped separately in the response.',
  })
  @ApiOkResponse({
    description: 'Online tournament configuration saved.',
    type: OnlineConfigurationResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The tournament id or online configuration payload is invalid.',
  })
  @ApiConflictResponse({
    description:
      'Online configuration is only available for ONLINE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async upsertOnlineConfiguration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: UpsertOnlineConfigurationDto,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentsService.upsertOnlineConfiguration(
      user.id,
      tournamentId,
      dto,
    );
  }

  @Get(':tournamentId/venue')
  @ApiOperation({
    summary: 'Get on-site tournament venue',
    description:
      'Returns venue and equipment policy for an organizer-owned ONSITE tournament.',
  })
  @ApiOkResponse({
    description: 'On-site venue configuration returned.',
    type: VenueResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description:
      'Venue configuration is only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or venue does not exist, or the tournament is not owned by the authenticated organizer.',
  })
  async getVenue(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<VenueResponseDto> {
    return this.tournamentsService.getVenue(user.id, tournamentId);
  }

  @Put(':tournamentId/venue')
  @ApiOperation({
    summary: 'Upsert on-site tournament venue',
    description:
      'Creates or replaces venue and equipment policy for an organizer-owned ONSITE tournament.',
  })
  @ApiOkResponse({
    description: 'On-site venue configuration saved.',
    type: VenueResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or venue payload is invalid.',
  })
  @ApiConflictResponse({
    description:
      'Venue configuration is only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async upsertVenue(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: UpsertVenueDto,
  ): Promise<VenueResponseDto> {
    return this.tournamentsService.upsertVenue(user.id, tournamentId, dto);
  }

  @Get(':tournamentId/gaming-rooms')
  @ApiOperation({
    summary: 'List gaming rooms',
    description:
      'Returns gaming rooms and hardware/device specifications for an organizer-owned ONSITE tournament.',
  })
  @ApiOkResponse({
    description: 'Gaming rooms returned.',
    type: GamingRoomListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Gaming rooms are only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or venue does not exist, or the tournament is not owned by the authenticated organizer.',
  })
  async listGamingRooms(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ): Promise<GamingRoomListResponseDto> {
    return this.tournamentsService.listGamingRooms(user.id, tournamentId);
  }

  @Post(':tournamentId/gaming-rooms')
  @ApiOperation({
    summary: 'Create gaming room',
    description:
      'Creates a gaming room with PC, monitor, peripheral, and station specifications for an organizer-owned ONSITE tournament.',
  })
  @ApiCreatedResponse({
    description: 'Gaming room created.',
    type: GamingRoomResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or gaming-room payload is invalid.',
  })
  @ApiConflictResponse({
    description: 'Gaming rooms are only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament or venue does not exist, or the tournament is not owned by the authenticated organizer.',
  })
  async createGamingRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: CreateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    return this.tournamentsService.createGamingRoom(user.id, tournamentId, dto);
  }

  @Get(':tournamentId/gaming-rooms/:gamingRoomId')
  @ApiOperation({
    summary: 'Get gaming room details',
    description:
      'Returns one gaming room with PC, monitor, peripheral, and station specifications.',
  })
  @ApiOkResponse({
    description: 'Gaming room returned.',
    type: GamingRoomResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or gaming-room id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Gaming rooms are only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament, venue, or gaming room does not exist, or is not owned by the authenticated organizer.',
  })
  async getGamingRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('gamingRoomId', new ParseUUIDPipe()) gamingRoomId: string,
  ): Promise<GamingRoomResponseDto> {
    return this.tournamentsService.getGamingRoom(
      user.id,
      tournamentId,
      gamingRoomId,
    );
  }

  @Patch(':tournamentId/gaming-rooms/:gamingRoomId')
  @ApiOperation({
    summary: 'Update gaming room',
    description:
      'Updates a gaming room with PC, monitor, peripheral, and station specifications.',
  })
  @ApiOkResponse({
    description: 'Gaming room updated.',
    type: GamingRoomResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The tournament id, gaming-room id, or payload is invalid.',
  })
  @ApiConflictResponse({
    description: 'Gaming rooms are only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament, venue, or gaming room does not exist, or is not owned by the authenticated organizer.',
  })
  async updateGamingRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('gamingRoomId', new ParseUUIDPipe()) gamingRoomId: string,
    @Body() dto: UpdateGamingRoomDto,
  ): Promise<GamingRoomResponseDto> {
    return this.tournamentsService.updateGamingRoom(
      user.id,
      tournamentId,
      gamingRoomId,
      dto,
    );
  }

  @Delete(':tournamentId/gaming-rooms/:gamingRoomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete gaming room',
    description:
      'Deletes one gaming room from an organizer-owned ONSITE tournament.',
  })
  @ApiBadRequestResponse({
    description: 'The tournament id or gaming-room id is not a valid UUID.',
  })
  @ApiConflictResponse({
    description: 'Gaming rooms are only available for ONSITE tournaments.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament, venue, or gaming room does not exist, or is not owned by the authenticated organizer.',
  })
  async deleteGamingRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Param('gamingRoomId', new ParseUUIDPipe()) gamingRoomId: string,
  ): Promise<void> {
    await this.tournamentsService.deleteGamingRoom(
      user.id,
      tournamentId,
      gamingRoomId,
    );
  }

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

  @Post(':tournamentId/cover')
  @UseInterceptors(FileInterceptor('file', tournamentCoverImageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(tournamentCoverImageUploadBody)
  @ApiOperation({
    summary: 'Upload tournament cover image',
    description:
      'Uploads a JPEG, PNG, or WebP cover image to local storage and assigns its public URL to an organizer-owned draft tournament.',
  })
  @ApiOkResponse({
    description: 'Tournament cover image uploaded and draft updated.',
    type: TournamentResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The tournament id or uploaded cover image is missing, too large, or invalid.',
  })
  @ApiConflictResponse({
    description: 'Only draft tournaments can receive a new cover image.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  @ApiNotFoundResponse({
    description:
      'The tournament does not exist or is not owned by the authenticated organizer.',
  })
  async uploadTournamentCover(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @UploadedFile() file: TournamentCoverImageFile | undefined,
    @Req() request: Request,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.uploadOrganizerTournamentCover(
      user.id,
      tournamentId,
      file,
      this.getPublicOrigin(request),
    );
  }

  private getPublicOrigin(request: Request): string {
    const forwardedProtocol = request
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim();
    const forwardedHost = request
      .get('x-forwarded-host')
      ?.split(',')[0]
      ?.trim();
    const protocol = forwardedProtocol || request.protocol;
    const host = forwardedHost || request.get('host');

    return `${protocol}://${host}`;
  }
}
