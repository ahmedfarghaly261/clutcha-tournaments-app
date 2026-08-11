import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OrganizerDashboardResponseDto } from './dto/organizer-dashboard-response.dto';
import { OrganizerProfileResponseDto } from './dto/organizer-profile-response.dto';
import { UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { type OrganizerProfileImageFile } from './organizer-profile-image-storage.service';
import { OrganizersService } from './organizers.service';

const organizerProfileImageUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

const organizerProfileImageUploadBody = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'JPEG, PNG, or WebP image file up to 5MB.',
      },
    },
  },
};

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

  @Post('profile/logo')
  @UseInterceptors(FileInterceptor('file', organizerProfileImageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(organizerProfileImageUploadBody)
  @ApiOperation({
    summary: 'Upload organizer profile logo',
    description:
      'Uploads a JPEG, PNG, or WebP organizer logo image to local storage and stores its public URL on the authenticated organizer profile.',
  })
  @ApiOkResponse({
    description: 'Organizer logo uploaded and profile updated.',
    type: OrganizerProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The uploaded logo image is missing, too large, or invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async uploadProfileLogo(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: OrganizerProfileImageFile | undefined,
    @Req() request: Request,
  ): Promise<OrganizerProfileResponseDto> {
    return this.organizersService.uploadProfileImage(
      user.id,
      'logo',
      file,
      this.getPublicOrigin(request),
    );
  }

  @Post('profile/cover')
  @UseInterceptors(FileInterceptor('file', organizerProfileImageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(organizerProfileImageUploadBody)
  @ApiOperation({
    summary: 'Upload organizer profile cover',
    description:
      'Uploads a JPEG, PNG, or WebP organizer cover image to local storage and stores its public URL on the authenticated organizer profile.',
  })
  @ApiOkResponse({
    description: 'Organizer cover uploaded and profile updated.',
    type: OrganizerProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The uploaded cover image is missing, too large, or invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  async uploadProfileCover(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: OrganizerProfileImageFile | undefined,
    @Req() request: Request,
  ): Promise<OrganizerProfileResponseDto> {
    return this.organizersService.uploadProfileImage(
      user.id,
      'cover',
      file,
      this.getPublicOrigin(request),
    );
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get organizer dashboard summary',
    description:
      'Returns real organizer dashboard statistics available at this stage. Tournament counts are zero until tournament storage is introduced.',
  })
  @ApiOkResponse({
    description: 'Organizer dashboard summary returned.',
    type: OrganizerDashboardResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not an organizer.',
  })
  getDashboard(): OrganizerDashboardResponseDto {
    return this.organizersService.getDashboard();
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
