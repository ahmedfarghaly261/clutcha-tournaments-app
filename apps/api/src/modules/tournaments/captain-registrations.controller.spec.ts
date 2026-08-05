import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { CaptainRegistrationsController } from './captain-registrations.controller';

jest.mock('@clutcha/database', () => ({
  RegistrationApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
    ONSITE: 'ONSITE',
  },
  TournamentRegistrationStatus: {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    WAITLISTED: 'WAITLISTED',
    WITHDRAWN: 'WITHDRAWN',
    CHECKED_IN: 'CHECKED_IN',
    DISQUALIFIED: 'DISQUALIFIED',
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
  },
  TournamentMatchDisputeStatus: {
    NONE: 'NONE',
    OPEN: 'OPEN',
    RESOLVED: 'RESOLVED',
    REJECTED: 'REJECTED',
  },
  TournamentMatchForfeitStatus: {
    NONE: 'NONE',
    TEAM_A: 'TEAM_A',
    TEAM_B: 'TEAM_B',
    BOTH: 'BOTH',
  },
  TournamentMatchOfficialResultStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    OVERTURNED: 'OVERTURNED',
  },
  TournamentMatchStatus: {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    COMPLETED: 'COMPLETED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'CANCELLED',
    FORFEIT: 'FORFEIT',
  },
  TournamentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
    CANCELLED: 'CANCELLED',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE',
    UNLISTED: 'UNLISTED',
  },
  UserRole: {
    CAPTAIN: 'CAPTAIN',
  },
}));

describe('CaptainRegistrationsController', () => {
  it('requires the Captain role', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, CaptainRegistrationsController),
    ).toEqual([UserRole.CAPTAIN]);
  });

  it('exposes registration list, detail, hub, match, and withdrawal handlers', () => {
    expect(
      typeof CaptainRegistrationsController.prototype.listRegistrations,
    ).toBe('function');
    expect(
      typeof CaptainRegistrationsController.prototype.getRegistration,
    ).toBe('function');
    expect(
      typeof CaptainRegistrationsController.prototype.getRegistrationHub,
    ).toBe('function');
    expect(
      typeof CaptainRegistrationsController.prototype.listRegistrationMatches,
    ).toBe('function');
    expect(
      typeof CaptainRegistrationsController.prototype.getRegistrationMatch,
    ).toBe('function');
    expect(
      typeof CaptainRegistrationsController.prototype.withdrawRegistration,
    ).toBe('function');
  });
});
