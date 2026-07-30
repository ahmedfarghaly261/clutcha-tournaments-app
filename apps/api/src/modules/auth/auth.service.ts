import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@clutcha/database';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../database/database.service';
import { type AuthResponseDto } from './dto/auth-response.dto';
import { type CurrentUserResponseDto } from './dto/current-user-response.dto';
import { type LoginDto } from './dto/login.dto';
import { type RegisterCaptainDto } from './dto/register-captain.dto';
import { type RegisterOrganizerDto } from './dto/register-organizer.dto';
import { type AccessTokenPayload } from './types/access-token-payload.type';
import { type RefreshTokenPayload } from './types/refresh-token-payload.type';
import { UsersService } from '../users/users.service';

type RequestContext = {
  userAgent?: string;
  ipAddress?: string;
};

type RefreshCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  get refreshCookieName(): string {
    return this.configService.getOrThrow<string>('AUTH_REFRESH_COOKIE_NAME');
  }

  getRefreshCookieOptions(includeMaxAge = true): RefreshCookieOptions {
    const secure =
      this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.getOrThrow<boolean>('AUTH_COOKIE_SECURE');
    const sameSite = this.configService.getOrThrow<'lax' | 'strict' | 'none'>(
      'AUTH_COOKIE_SAME_SITE',
    );
    const ttlSeconds = this.configService.getOrThrow<number>(
      'JWT_REFRESH_TTL_SECONDS',
    );

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: this.configService.getOrThrow<string>('AUTH_REFRESH_COOKIE_PATH'),
      ...(includeMaxAge ? { maxAge: ttlSeconds * 1000 } : {}),
    };
  }

  getClearRefreshCookieOptions(): RefreshCookieOptions {
    return this.getRefreshCookieOptions(false);
  }

  async registerCaptain(
    dto: RegisterCaptainDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    return this.register(dto, UserRole.CAPTAIN, UserStatus.ACTIVE, context);
  }

  async registerOrganizer(
    dto: RegisterOrganizerDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    return this.register(
      dto,
      UserRole.ORGANIZER,
      UserStatus.PENDING_VERIFICATION,
      context,
    );
  }

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.assertCanAuthenticate(user.status);

    await this.databaseService.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    return this.createSession(user, context);
  }

  async refresh(
    refreshToken: string | undefined,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const userAndSession = await this.usersService.findUserAndSession(
      payload.sub,
      payload.sessionId,
    );
    const session = userAndSession?.authSessions[0];

    if (!userAndSession || !session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.assertCanAuthenticate(userAndSession.status);

    if (session.tokenVersion !== payload.version) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!tokenMatches) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextVersion = session.tokenVersion + 1;
    const newRefreshToken = await this.signRefreshToken({
      sub: userAndSession.id,
      sessionId: session.id,
      version: nextVersion,
      jti: randomUUID(),
      type: 'refresh',
    });
    const newRefreshTokenHash = await argon2.hash(newRefreshToken);

    const updated = await this.databaseService.client.authSession.updateMany({
      where: {
        id: session.id,
        tokenVersion: session.tokenVersion,
        revokedAt: null,
      },
      data: {
        tokenVersion: nextVersion,
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt: new Date(),
        userAgent: context.userAgent?.slice(0, 512),
        ipAddress: context.ipAddress?.slice(0, 64),
      },
    });

    if (updated.count === 0) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      response: await this.createAuthResponse(userAndSession, session.id),
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.revokeSession(payload.sessionId);
    } catch {
      return;
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.databaseService.client.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
    const user = await this.usersService.findAuthenticatedUser(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    return user;
  }

  private async register(
    dto: RegisterCaptainDto | RegisterOrganizerDto,
    role: UserRole,
    status: UserStatus,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const passwordHash = await argon2.hash(dto.password);
    const email = this.usersService.normalizeEmail(dto.email);

    try {
      const user = await this.databaseService.client.user.create({
        data: {
          email,
          displayName: dto.displayName.trim(),
          passwordHash,
          role,
          status,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      });

      return this.createSession(user, context);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  private async createSession(
    user: CurrentUserResponseDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const expiresAt = new Date(
      Date.now() +
        this.configService.getOrThrow<number>('JWT_REFRESH_TTL_SECONDS') * 1000,
    );

    const session = await this.databaseService.client.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: 'pending',
        expiresAt,
        userAgent: context.userAgent?.slice(0, 512),
        ipAddress: context.ipAddress?.slice(0, 64),
      },
      select: {
        id: true,
        tokenVersion: true,
      },
    });

    const refreshToken = await this.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      version: session.tokenVersion,
      jti: randomUUID(),
      type: 'refresh',
    });

    await this.databaseService.client.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken),
      },
      select: { id: true },
    });

    return {
      response: await this.createAuthResponse(user, session.id),
      refreshToken,
    };
  }

  private async createAuthResponse(
    user: CurrentUserResponseDto,
    sessionId: string,
  ): Promise<AuthResponseDto> {
    const expiresIn = this.configService.getOrThrow<number>(
      'JWT_ACCESS_TTL_SECONDS',
    );
    const payload: AccessTokenPayload = {
      sub: user.id,
      sessionId,
      role: user.role,
      type: 'access',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      accessTokenExpiresIn: expiresIn,
      user,
    };
  }

  private async signRefreshToken(
    payload: RefreshTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<number>(
        'JWT_REFRESH_TTL_SECONDS',
      ),
      issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
      audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      refreshToken,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
        audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
      },
    );

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  private assertCanAuthenticate(status: UserStatus): void {
    if (status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account is disabled');
    }
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.databaseService.client.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
