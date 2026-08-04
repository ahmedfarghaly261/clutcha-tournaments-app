import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@clutcha/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CaptainTeamResponseDto } from './dto/captain-team-response.dto';
import { CreateCaptainTeamDto } from './dto/create-captain-team.dto';
import { CreateRosterPlayerDto } from './dto/create-roster-player.dto';
import { CaptainProfileResponseDto } from './dto/captain-profile-response.dto';
import { RosterPlayerResponseDto } from './dto/roster-player-response.dto';
import { UpdateRosterPlayerDto } from './dto/update-roster-player.dto';
import { UpdateCaptainTeamDto } from './dto/update-captain-team.dto';
import { UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';
import { CaptainsService } from './captains.service';

@ApiTags('Captain')
@ApiBearerAuth('access-token')
@Roles(UserRole.CAPTAIN)
@Controller('captain')
export class CaptainsController {
  constructor(private readonly captainsService: CaptainsService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get captain profile',
    description:
      'Returns the authenticated Captain profile and private personal contact completion state.',
  })
  @ApiOkResponse({
    description: 'Captain profile returned.',
    type: CaptainProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CaptainProfileResponseDto> {
    return this.captainsService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update captain profile',
    description:
      'Updates the authenticated Captain display name and private personal contact fields. Role, status, email, password, and verification state are never accepted.',
  })
  @ApiOkResponse({
    description: 'Captain profile updated.',
    type: CaptainProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The Captain profile payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCaptainProfileDto,
  ): Promise<CaptainProfileResponseDto> {
    return this.captainsService.updateProfile(user.id, dto);
  }

  @Post('team')
  @ApiTags('Captain Team')
  @ApiOperation({
    summary: 'Create the authenticated Captain team',
    description:
      'Creates the single team owned by the authenticated Captain. captainId, ownerId, userId, status, and verification state are never accepted from the client. The team is created as ACTIVE and ownership comes from the JWT.',
  })
  @ApiCreatedResponse({
    description: 'Captain team created.',
    type: CaptainTeamResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The team creation payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiConflictResponse({
    description: 'The authenticated Captain already owns a team.',
  })
  async createTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCaptainTeamDto,
  ): Promise<CaptainTeamResponseDto> {
    return this.captainsService.createTeam(user.id, dto);
  }

  @Get('team')
  @ApiTags('Captain Team')
  @ApiOperation({
    summary: 'Get the authenticated Captain team',
    description:
      "Returns only the team owned by the authenticated Captain. Another Captain's team is never returned.",
  })
  @ApiOkResponse({
    description: 'Captain team returned.',
    type: CaptainTeamResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The authenticated Captain has not created a team.',
  })
  async getTeam(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CaptainTeamResponseDto> {
    return this.captainsService.getTeam(user.id);
  }

  @Patch('team')
  @ApiTags('Captain Team')
  @ApiOperation({
    summary: 'Update the authenticated Captain team',
    description:
      "Updates the single team owned by the authenticated Captain. teamId and captainId are never accepted in the body, ownership cannot be transferred, and the team Discord server URL must be HTTPS when provided. Captain personal Discord username remains separate from the team's Discord server URL.",
  })
  @ApiOkResponse({
    description: 'Captain team updated.',
    type: CaptainTeamResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The team update payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The authenticated Captain has not created a team.',
  })
  @ApiConflictResponse({
    description:
      'The update conflicts with active tournament participation once registration records exist.',
  })
  async updateTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCaptainTeamDto,
  ): Promise<CaptainTeamResponseDto> {
    return this.captainsService.updateTeam(user.id, dto);
  }

  @Get('team/players')
  @ApiTags('Captain Roster')
  @ApiOperation({
    summary: 'List roster players for the authenticated Captain team',
    description:
      'Returns private roster-player records for the authenticated Captain team, including player contact fields. No player user accounts are created.',
  })
  @ApiOkResponse({
    description: 'Roster players returned.',
    type: RosterPlayerResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The authenticated Captain has not created a team.',
  })
  async listRosterPlayers(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RosterPlayerResponseDto[]> {
    return this.captainsService.listRosterPlayers(user.id);
  }

  @Post('team/players')
  @ApiTags('Captain Roster')
  @ApiOperation({
    summary: 'Create a roster player for the authenticated Captain team',
    description:
      'Creates a roster-player record managed by the Captain. Roster players are not CLUTCHA users, receive no password, and cannot log in. phoneNumber is required; email and personal Discord username are optional private contacts.',
  })
  @ApiCreatedResponse({
    description: 'Roster player created.',
    type: RosterPlayerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The roster-player payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description: 'The authenticated Captain has not created a team.',
  })
  @ApiConflictResponse({
    description:
      'A roster player with this game account already exists on the team.',
  })
  async createRosterPlayer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRosterPlayerDto,
  ): Promise<RosterPlayerResponseDto> {
    return this.captainsService.createRosterPlayer(user.id, dto);
  }

  @Get('team/players/:playerId')
  @ApiTags('Captain Roster')
  @ApiOperation({
    summary: 'Get one roster player for the authenticated Captain team',
    description:
      'Returns one private roster-player record only when it belongs to the authenticated Captain team.',
  })
  @ApiParam({ name: 'playerId', example: 'roster-player-id' })
  @ApiOkResponse({
    description: 'Roster player returned.',
    type: RosterPlayerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description:
      'The authenticated Captain has no team or the roster player was not found.',
  })
  async getRosterPlayer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playerId') playerId: string,
  ): Promise<RosterPlayerResponseDto> {
    return this.captainsService.getRosterPlayer(user.id, playerId);
  }

  @Patch('team/players/:playerId')
  @ApiTags('Captain Roster')
  @ApiOperation({
    summary: 'Update one roster player for the authenticated Captain team',
    description:
      'Updates a roster-player record only when it belongs to the authenticated Captain team. Ownership and teamId are never accepted from the client.',
  })
  @ApiParam({ name: 'playerId', example: 'roster-player-id' })
  @ApiOkResponse({
    description: 'Roster player updated.',
    type: RosterPlayerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The roster-player payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description:
      'The authenticated Captain has no team or the roster player was not found.',
  })
  @ApiConflictResponse({
    description:
      'A roster player with this game account already exists on the team.',
  })
  async updateRosterPlayer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateRosterPlayerDto,
  ): Promise<RosterPlayerResponseDto> {
    return this.captainsService.updateRosterPlayer(user.id, playerId, dto);
  }

  @Delete('team/players/:playerId')
  @ApiTags('Captain Roster')
  @ApiOperation({
    summary: 'Delete one roster player from the authenticated Captain team',
    description:
      'Deletes a roster-player record only when it belongs to the authenticated Captain team. Historical roster locks are not present yet, so lock-based deletion blocking will be enforced once that model exists.',
  })
  @ApiParam({ name: 'playerId', example: 'roster-player-id' })
  @ApiOkResponse({
    description: 'Roster player deleted.',
    type: RosterPlayerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not a Captain.',
  })
  @ApiNotFoundResponse({
    description:
      'The authenticated Captain has no team or the roster player was not found.',
  })
  @ApiConflictResponse({
    description:
      'Deletion is blocked by a current roster lock once roster locks exist.',
  })
  async deleteRosterPlayer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playerId') playerId: string,
  ): Promise<RosterPlayerResponseDto> {
    return this.captainsService.deleteRosterPlayer(user.id, playerId);
  }
}
