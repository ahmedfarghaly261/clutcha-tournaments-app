import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma, UserRole, UserStatus } from '@clutcha/database';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../database/database.service';
import { UsersService } from '../users/users.service';

jest.mock('@clutcha/database', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }

  return {
    Prisma: { PrismaClientKnownRequestError },
    UserRole: {
      PLATFORM_ADMIN: 'PLATFORM_ADMIN',
      ORGANIZER: 'ORGANIZER',
      CAPTAIN: 'CAPTAIN',
      TOURNAMENT_STAFF: 'TOURNAMENT_STAFF',
      REFEREE: 'REFEREE',
      CHECK_IN_STAFF: 'CHECK_IN_STAFF',
    },
    UserStatus: {
      PENDING_VERIFICATION: 'PENDING_VERIFICATION',
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      DISABLED: 'DISABLED',
    },
  };
});

type TestUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

type TestSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  tokenVersion: number;
  expiresAt: Date;
  revokedAt: Date | null;
};

const createdAt = new Date('2026-07-30T12:00:00.000Z');

describe('AuthService', () => {
  let authService: AuthService;
  let users: TestUser[];
  let sessions: TestSession[];
  let tokenCounter: number;

  beforeEach(async () => {
    users = [];
    sessions = [];
    tokenCounter = 0;

    const databaseClient = {
      user: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<TestUser, 'id' | 'createdAt' | 'emailVerifiedAt'>;
          }) => {
            if (users.some((user) => user.email === data.email)) {
              throw new Prisma.PrismaClientKnownRequestError('Unique failed', {
                code: 'P2002',
                clientVersion: 'test',
              });
            }

            const user: TestUser = {
              id: `user-${users.length + 1}`,
              email: data.email,
              displayName: data.displayName,
              role: data.role,
              status: data.status,
              passwordHash: data.passwordHash,
              emailVerifiedAt: null,
              createdAt,
            };
            users.push(user);
            return Promise.resolve(safeUser(user));
          },
        ),
        update: jest.fn(() => Promise.resolve({ id: 'updated-user' })),
        findUnique: jest.fn(
          ({ where }: { where: { id?: string; email?: string } }) => {
            const user =
              typeof where.email === 'string'
                ? users.find((item) => item.email === where.email)
                : users.find((item) => item.id === where.id);
            if (!user) {
              return Promise.resolve(null);
            }

            return Promise.resolve({
              ...user,
              authSessions: sessions.filter(
                (session) => session.userId === user.id,
              ),
            });
          },
        ),
      },
      authSession: {
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<TestSession, 'id' | 'tokenVersion' | 'revokedAt'>;
          }) => {
            const session: TestSession = {
              id: `session-${sessions.length + 1}`,
              userId: data.userId,
              refreshTokenHash: data.refreshTokenHash,
              tokenVersion: 0,
              expiresAt: data.expiresAt,
              revokedAt: null,
            };
            sessions.push(session);
            return Promise.resolve({
              id: session.id,
              tokenVersion: session.tokenVersion,
            });
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<TestSession>;
          }) => {
            const session = sessions.find((item) => item.id === where.id);
            if (session) {
              Object.assign(session, data);
            }
            return Promise.resolve({ id: where.id });
          },
        ),
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: {
              id?: string;
              userId?: string;
              tokenVersion?: number;
              revokedAt?: null;
            };
            data: Partial<TestSession>;
          }) => {
            const matches = sessions.filter((session) => {
              if (where.id && session.id !== where.id) return false;
              if (where.userId && session.userId !== where.userId) return false;
              if (
                typeof where.tokenVersion === 'number' &&
                session.tokenVersion !== where.tokenVersion
              ) {
                return false;
              }
              if (where.revokedAt === null && session.revokedAt !== null)
                return false;
              return true;
            });
            matches.forEach((session) => Object.assign(session, data));
            return Promise.resolve({ count: matches.length });
          },
        ),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: DatabaseService,
          useValue: { client: databaseClient },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
            getOrThrow: (key: string) => configValues[key],
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn((payload: object) => {
              tokenCounter += 1;
              return Promise.resolve(
                Buffer.from(
                  JSON.stringify({ ...payload, tokenCounter }),
                ).toString('base64url'),
              );
            }),
            verifyAsync: jest.fn((token: string) => {
              const parsed = JSON.parse(
                Buffer.from(token, 'base64url').toString('utf8'),
              ) as unknown;
              return Promise.resolve(parsed);
            }),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('registers captains as active CAPTAIN users and never exposes password hashes', async () => {
    const result = await authService.registerCaptain(
      {
        displayName: 'Captain One',
        email: 'CAPTAIN@EXAMPLE.COM',
        password: 'FakePassword123!',
      },
      {},
    );

    expect(result.response.user.role).toBe(UserRole.CAPTAIN);
    expect(result.response.user.status).toBe(UserStatus.ACTIVE);
    expect(result.response.user.email).toBe('captain@example.com');
    expect(JSON.stringify(result.response)).not.toContain('passwordHash');
    expect(users[0].passwordHash).not.toBe('FakePassword123!');
    await expect(
      argon2.verify(users[0].passwordHash, 'FakePassword123!'),
    ).resolves.toBe(true);
  });

  it('registers organizers as pending ORGANIZER users', async () => {
    const result = await authService.registerOrganizer(
      {
        displayName: 'Organizer One',
        email: 'organizer@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    expect(result.response.user.role).toBe(UserRole.ORGANIZER);
    expect(result.response.user.status).toBe(UserStatus.PENDING_VERIFICATION);
  });

  it('does not let clients choose roles through registration DTO overflow', async () => {
    const result = await authService.registerCaptain(
      {
        displayName: 'Captain Two',
        email: 'role-choice@example.com',
        password: 'FakePassword123!',
        role: UserRole.PLATFORM_ADMIN,
      } as never,
      {},
    );

    expect(result.response.user.role).toBe(UserRole.CAPTAIN);
  });

  it('returns conflict for duplicate email registration', async () => {
    await authService.registerCaptain(
      {
        displayName: 'Captain One',
        email: 'dupe@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    await expect(
      authService.registerOrganizer(
        {
          displayName: 'Organizer Dupe',
          email: 'DUPE@example.com',
          password: 'FakePassword123!',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with correct credentials and rejects incorrect or unknown credentials the same way', async () => {
    await authService.registerCaptain(
      {
        displayName: 'Captain Login',
        email: 'login@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    await expect(
      authService.login(
        { email: 'login@example.com', password: 'FakePassword123!' },
        {},
      ),
    ).resolves.toHaveProperty('response.accessToken');
    await expect(
      authService.login(
        { email: 'login@example.com', password: 'wrong-password' },
        {},
      ),
    ).rejects.toMatchObject({
      response: { message: 'Invalid email or password' },
    });
    await expect(
      authService.login(
        { email: 'unknown@example.com', password: 'wrong-password' },
        {},
      ),
    ).rejects.toMatchObject({
      response: { message: 'Invalid email or password' },
    });
  });

  it('rejects suspended and disabled users at login', async () => {
    await authService.registerCaptain(
      {
        displayName: 'Captain Blocked',
        email: 'blocked@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    users[0].status = UserStatus.SUSPENDED;
    await expect(
      authService.login(
        { email: 'blocked@example.com', password: 'FakePassword123!' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    users[0].status = UserStatus.DISABLED;
    await expect(
      authService.login(
        { email: 'blocked@example.com', password: 'FakePassword123!' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores refresh tokens only as hashes and includes expected access claims', async () => {
    const result = await authService.registerCaptain(
      {
        displayName: 'Captain Tokens',
        email: 'tokens@example.com',
        password: 'FakePassword123!',
      },
      {},
    );
    const decodedAccess = JSON.parse(
      Buffer.from(result.response.accessToken, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;

    expect(decodedAccess).toMatchObject({
      sub: result.response.user.id,
      sessionId: sessions[0].id,
      role: UserRole.CAPTAIN,
      type: 'access',
    });
    expect(sessions[0].refreshTokenHash).not.toBe(result.refreshToken);
    await expect(
      argon2.verify(sessions[0].refreshTokenHash, result.refreshToken),
    ).resolves.toBe(true);
  });

  it('rotates refresh tokens, increments tokenVersion, and rejects reuse', async () => {
    const registered = await authService.registerCaptain(
      {
        displayName: 'Captain Refresh',
        email: 'refresh@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    const refreshed = await authService.refresh(registered.refreshToken, {});
    expect(sessions[0].tokenVersion).toBe(1);
    expect(refreshed.refreshToken).not.toBe(registered.refreshToken);

    await expect(
      authService.refresh(registered.refreshToken, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions[0].revokedAt).toBeInstanceOf(Date);
  });

  it('logs out idempotently and logout-all revokes every active session', async () => {
    const first = await authService.registerCaptain(
      {
        displayName: 'Captain Logout',
        email: 'logout@example.com',
        password: 'FakePassword123!',
      },
      {},
    );
    await authService.login(
      { email: 'logout@example.com', password: 'FakePassword123!' },
      {},
    );

    await authService.logout(first.refreshToken);
    await authService.logout(first.refreshToken);
    expect(sessions[0].revokedAt).toBeInstanceOf(Date);

    await authService.logoutAll(users[0].id);
    expect(sessions.every((session) => session.revokedAt instanceof Date)).toBe(
      true,
    );
  });

  it('returns safe current user data', async () => {
    const registered = await authService.registerCaptain(
      {
        displayName: 'Captain Me',
        email: 'me@example.com',
        password: 'FakePassword123!',
      },
      {},
    );

    await expect(
      authService.getCurrentUser(registered.response.user.id),
    ).resolves.toEqual(registered.response.user);
  });
});

const configValues: Record<string, string | number | boolean> = {
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'test_access_secret_32_characters_minimum',
  JWT_REFRESH_SECRET: 'test_refresh_secret_32_characters_minimum',
  JWT_ISSUER: 'clutcha-api',
  JWT_AUDIENCE: 'clutcha-web',
  JWT_ACCESS_TTL_SECONDS: 900,
  JWT_REFRESH_TTL_SECONDS: 604800,
  AUTH_REFRESH_COOKIE_NAME: 'clutcha_refresh',
  AUTH_REFRESH_COOKIE_PATH: '/api/auth',
  AUTH_COOKIE_SECURE: false,
  AUTH_COOKIE_SAME_SITE: 'lax',
};

const safeUser = (user: TestUser) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
});
