import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterCaptainDto } from './dto/register-captain.dto';
import { RegisterOrganizerDto } from './dto/register-organizer.dto';
import { REFRESH_COOKIE_SECURITY_NAME } from './auth.constants';
import { type AuthenticatedUser } from './types/authenticated-user.type';

type CookieRequest = Request & {
  cookies?: Record<string, string>;
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/captain')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @ApiOperation({
    summary: 'Register a team captain',
    description: 'Creates an active authenticated captain account.',
  })
  @ApiCreatedResponse({
    description: 'Captain account created and authenticated.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Registration payload is invalid.' })
  @ApiConflictResponse({ description: 'Email is already registered.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts.',
  })
  async registerCaptain(
    @Body() dto: RegisterCaptainDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerCaptain(
      dto,
      this.getRequestContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Public()
  @Post('register/organizer')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @ApiOperation({
    summary: 'Register a tournament organizer',
    description: 'Creates a pending-verification organizer account.',
  })
  @ApiCreatedResponse({
    description: 'Organizer account created and authenticated.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Registration payload is invalid.' })
  @ApiConflictResponse({ description: 'Email is already registered.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts.',
  })
  async registerOrganizer(
    @Body() dto: RegisterOrganizerDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerOrganizer(
      dto,
      this.getRequestContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates a captain or organizer with email and password.',
  })
  @ApiOkResponse({ description: 'Login succeeded.', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Login payload is invalid.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @ApiForbiddenResponse({ description: 'The account cannot authenticate.' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts.' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(
      dto,
      this.getRequestContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiCookieAuth(REFRESH_COOKIE_SECURITY_NAME)
  @ApiOperation({
    summary: 'Refresh authentication session',
    description:
      'Rotates the HttpOnly refresh token and returns a new access token.',
  })
  @ApiOkResponse({ description: 'Refresh succeeded.', type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description:
      'Refresh token is missing, invalid, expired, revoked, or reused.',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many refresh attempts.' })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refresh(
      this.getRefreshCookie(request),
      this.getRequestContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE_SECURITY_NAME)
  @ApiOperation({
    summary: 'Log out current session',
    description: 'Revokes the current refresh-token session when present.',
  })
  @ApiNoContentResponse({ description: 'Logout completed.' })
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.getRefreshCookie(request));
    this.clearRefreshCookie(response);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Log out from all devices',
    description: 'Revokes all active sessions for the authenticated user.',
  })
  @ApiNoContentResponse({ description: 'All sessions revoked.' })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user.id);
    this.clearRefreshCookie(response);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description:
      'Returns the safe public profile for the current access token.',
  })
  @ApiOkResponse({
    description: 'Current authenticated user.',
    type: CurrentUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing or invalid.',
  })
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CurrentUserResponseDto> {
    return this.authService.getCurrentUser(user.id);
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(
      this.authService.refreshCookieName,
      refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(
      this.authService.refreshCookieName,
      this.authService.getClearRefreshCookieOptions(),
    );
  }

  private getRefreshCookie(request: CookieRequest): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const cookieValue = cookies?.[this.authService.refreshCookieName];
    return typeof cookieValue === 'string' ? cookieValue : undefined;
  }

  private getRequestContext(request: Request): {
    userAgent?: string;
    ipAddress?: string;
  } {
    return {
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
    };
  }
}
