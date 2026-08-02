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
} from '@nestjs/common';
import { UserRole } from '@clutcha/database';
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { CreateGamingRoomDto } from './dto/create-gaming-room.dto';
import { GamingRoomListResponseDto } from './dto/gaming-room-list-response.dto';
import { GamingRoomResponseDto } from './dto/gaming-room-response.dto';
import { ListOrganizerTournamentsQueryDto } from './dto/list-organizer-tournaments-query.dto';
import { OrganizerTournamentDetailResponseDto } from './dto/organizer-tournament-detail-response.dto';
import { OrganizerTournamentListResponseDto } from './dto/organizer-tournament-list-response.dto';
import { OnlineConfigurationResponseDto } from './dto/online-configuration-response.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { UpdateGamingRoomDto } from './dto/update-gaming-room.dto';
import { UpdateTournamentDraftDto } from './dto/update-tournament-draft.dto';
import { UpsertOnlineConfigurationDto } from './dto/upsert-online-configuration.dto';
import { UpsertVenueDto } from './dto/upsert-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
import { TournamentsService } from './tournaments.service';

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
}
