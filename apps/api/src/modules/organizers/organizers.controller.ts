import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserRole } from '@clutcha/database';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OrganizerProfileResponseDto } from './dto/organizer-profile-response.dto';
import { UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { OrganizersService } from './organizers.service';

@ApiTags('Organizer')
@ApiBearerAuth('access-token')
@Roles(UserRole.ORGANIZER)
@Controller('organizer')
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get organizer profile',
    description:
      'Returns the authenticated organizer profile, creating an empty profile if one does not exist.',
  })
  @ApiOkResponse({
    description: 'Organizer profile returned.',
    type: OrganizerProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizerProfileResponseDto> {
    return this.organizersService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update organizer profile',
    description:
      'Updates public organizer profile fields for the authenticated organizer.',
  })
  @ApiOkResponse({
    description: 'Organizer profile updated.',
    type: OrganizerProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The organizer profile payload is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganizerProfileDto,
  ): Promise<OrganizerProfileResponseDto> {
    return this.organizersService.updateProfile(user.id, dto);
  }
}
