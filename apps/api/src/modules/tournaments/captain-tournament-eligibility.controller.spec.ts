import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { CaptainTournamentEligibilityController } from './captain-tournament-eligibility.controller';

jest.mock('@clutcha/database', () => ({
  Prisma: {},
  EligibilityStatus: {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE: 'INELIGIBLE',
    PENDING_REVIEW: 'PENDING_REVIEW',
  },
  GamingRoomPurpose: {
    COMPETITION: 'COMPETITION',
    PRACTICE: 'PRACTICE',
    WARMUP: 'WARMUP',
    STREAMING: 'STREAMING',
    ADMIN: 'ADMIN',
  },
  RosterType: {
    STARTER: 'STARTER',
    SUBSTITUTE: 'SUBSTITUTE',
  },
  TeamStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
  },
  TournamentFormat: {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
    DOUBLE_ELIMINATION: 'DOUBLE_ELIMINATION',
    ROUND_ROBIN: 'ROUND_ROBIN',
    GROUPS_THEN_PLAYOFFS: 'GROUPS_THEN_PLAYOFFS',
    SWISS: 'SWISS',
    BATTLE_ROYALE: 'BATTLE_ROYALE',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentSeedingMethod: {
    MANUAL: 'MANUAL',
    RANDOM: 'RANDOM',
    RANKED: 'RANKED',
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
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
    UNLISTED: 'UNLISTED',
    PRIVATE: 'PRIVATE',
  },
  UserRole: {
    CAPTAIN: 'CAPTAIN',
  },
  VerificationStatus: {
    UNVERIFIED: 'UNVERIFIED',
  },
}));

describe('CaptainTournamentEligibilityController', () => {
  it('requires the Captain role', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, CaptainTournamentEligibilityController),
    ).toEqual([UserRole.CAPTAIN]);
  });

  it('exposes the eligibility handler', () => {
    expect(
      typeof CaptainTournamentEligibilityController.prototype.getEligibility,
    ).toBe('function');
  });
});
