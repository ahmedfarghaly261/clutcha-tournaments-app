import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@clutcha/database';
import { RolesGuard } from './roles.guard';

jest.mock('@clutcha/database', () => ({
  UserRole: {
    ORGANIZER: 'ORGANIZER',
    CAPTAIN: 'CAPTAIN',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
}));

describe('RolesGuard', () => {
  it('rejects incorrect roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => [UserRole.ORGANIZER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            email: 'captain@example.com',
            displayName: 'Captain',
            role: UserRole.CAPTAIN,
            status: UserStatus.ACTIVE,
            sessionId: 'session-1',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
