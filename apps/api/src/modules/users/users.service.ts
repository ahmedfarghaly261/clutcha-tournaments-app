import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { toCurrentUserResponse } from './users.mapper';

const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const loginUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string) {
    return this.databaseService.client.user.findUnique({
      where: { email: this.normalizeEmail(email) },
      select: loginUserSelect,
    });
  }

  async findSafeById(id: string) {
    const user = await this.databaseService.client.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    return user ? toCurrentUserResponse(user) : null;
  }

  async findAuthenticatedUser(userId: string) {
    return this.findSafeById(userId);
  }

  async findUserAndSession(userId: string, sessionId: string) {
    return this.databaseService.client.user.findUnique({
      where: { id: userId },
      select: {
        ...safeUserSelect,
        authSessions: {
          where: { id: sessionId },
          take: 1,
          select: {
            id: true,
            userId: true,
            refreshTokenHash: true,
            tokenVersion: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
      },
    });
  }

  async createCaptain(data: {
    email: string;
    displayName: string;
    passwordHash: string;
  }) {
    return this.createUser({
      ...data,
      role: UserRole.CAPTAIN,
      status: UserStatus.ACTIVE,
    });
  }

  async createOrganizer(data: {
    email: string;
    displayName: string;
    passwordHash: string;
  }) {
    return this.createUser({
      ...data,
      role: UserRole.ORGANIZER,
      status: UserStatus.PENDING_VERIFICATION,
    });
  }

  private async createUser(data: {
    email: string;
    displayName: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
  }) {
    try {
      const user = await this.databaseService.client.user.create({
        data: {
          email: this.normalizeEmail(data.email),
          displayName: data.displayName.trim(),
          passwordHash: data.passwordHash,
          role: data.role,
          status: data.status,
        },
        select: safeUserSelect,
      });

      return toCurrentUserResponse(user);
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
}
