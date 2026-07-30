import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@clutcha/database';
import { UsersService } from '../../users/users.service';
import { toAuthenticatedUser } from '../auth.mapper';
import { type AccessTokenPayload } from '../types/access-token-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
      audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const userAndSession = await this.usersService.findUserAndSession(
      payload.sub,
      payload.sessionId,
    );

    const session = userAndSession?.authSessions[0];

    if (!userAndSession || !session) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (userAndSession.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (userAndSession.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account is disabled');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid access token');
    }

    return toAuthenticatedUser(userAndSession, payload.sessionId);
  }
}
