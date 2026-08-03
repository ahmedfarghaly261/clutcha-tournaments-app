import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
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
import { CaptainProfileResponseDto } from './dto/captain-profile-response.dto';
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
}
