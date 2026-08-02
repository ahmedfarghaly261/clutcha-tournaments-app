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
