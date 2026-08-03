import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@clutcha/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
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
}
