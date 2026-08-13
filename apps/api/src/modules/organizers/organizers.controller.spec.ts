import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { OrganizersController } from './organizers.controller';

jest.mock('@clutcha/database', () => ({
  UserRole: {
    ORGANIZER: 'ORGANIZER',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
    CHECK_IN_OPEN: 'CHECK_IN_OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'CANCELLED',
    ARCHIVED: 'ARCHIVED',
  },
}));

describe('OrganizersController', () => {
  it('requires the organizer role for profile endpoints', () => {
    expect(Reflect.getMetadata(ROLES_KEY, OrganizersController)).toEqual([
      UserRole.ORGANIZER,
    ]);
  });

  it('exposes a dashboard handler', () => {
    expect(typeof OrganizersController.prototype.getDashboard).toBe('function');
  });
});
