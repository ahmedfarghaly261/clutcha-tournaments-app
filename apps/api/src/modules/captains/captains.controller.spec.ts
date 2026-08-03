import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { CaptainsController } from './captains.controller';

jest.mock('@clutcha/database', () => ({
  UserRole: {
    CAPTAIN: 'CAPTAIN',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
  },
}));

describe('CaptainsController', () => {
  it('requires the Captain role for profile endpoints', () => {
    expect(Reflect.getMetadata(ROLES_KEY, CaptainsController)).toEqual([
      UserRole.CAPTAIN,
    ]);
  });

  it('exposes profile handlers', () => {
    expect(typeof CaptainsController.prototype.getProfile).toBe('function');
    expect(typeof CaptainsController.prototype.updateProfile).toBe('function');
  });
});
