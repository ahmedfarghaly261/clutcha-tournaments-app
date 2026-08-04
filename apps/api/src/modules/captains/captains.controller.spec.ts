import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { CaptainsController } from './captains.controller';

jest.mock('@clutcha/database', () => ({
  TeamStatus: {
    ACTIVE: 'ACTIVE',
  },
  RosterType: {
    STARTER: 'STARTER',
    SUBSTITUTE: 'SUBSTITUTE',
  },
  VerificationStatus: {
    UNVERIFIED: 'UNVERIFIED',
  },
  EligibilityStatus: {
    PENDING_REVIEW: 'PENDING_REVIEW',
  },
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

  it('exposes team ownership handlers', () => {
    expect(typeof CaptainsController.prototype.createTeam).toBe('function');
    expect(typeof CaptainsController.prototype.getTeam).toBe('function');
    expect(typeof CaptainsController.prototype.updateTeam).toBe('function');
  });

  it('exposes roster-player handlers', () => {
    expect(typeof CaptainsController.prototype.listRosterPlayers).toBe(
      'function',
    );
    expect(typeof CaptainsController.prototype.createRosterPlayer).toBe(
      'function',
    );
    expect(typeof CaptainsController.prototype.getRosterPlayer).toBe(
      'function',
    );
    expect(typeof CaptainsController.prototype.updateRosterPlayer).toBe(
      'function',
    );
    expect(typeof CaptainsController.prototype.deleteRosterPlayer).toBe(
      'function',
    );
  });
});
