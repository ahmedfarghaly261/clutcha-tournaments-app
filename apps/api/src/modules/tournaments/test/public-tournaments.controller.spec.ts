import 'reflect-metadata';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { PublicTournamentsController } from '../controllers/public-tournaments.controller';

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
  GamingRoomPurpose: {
    COMPETITION: 'COMPETITION',
  },
  TournamentFormat: {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
  },
  TournamentMode: {
    ONLINE: 'ONLINE',
  },
  TournamentSeedingMethod: {
    MANUAL: 'MANUAL',
  },
  TournamentStatus: {
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
  },
}));

describe('PublicTournamentsController', () => {
  it('marks public tournament discovery as public', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, PublicTournamentsController),
    ).toBe(true);
  });

  it('exposes a listPublicTournaments handler', () => {
    expect(
      typeof PublicTournamentsController.prototype.listPublicTournaments,
    ).toBe('function');
  });

  it('exposes a getPublicTournamentDetails handler', () => {
    expect(
      typeof PublicTournamentsController.prototype.getPublicTournamentDetails,
    ).toBe('function');
  });
});
