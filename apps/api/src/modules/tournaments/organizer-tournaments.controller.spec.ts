import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';

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
  TeamStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
  },
  UserRole: {
    ORGANIZER: 'ORGANIZER',
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
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
    CANCELLED: 'CANCELLED',
  },
  TournamentVisibility: {
    PUBLIC: 'PUBLIC',
  },
}));

describe('OrganizerTournamentsController', () => {
  it('requires the organizer role for draft creation', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, OrganizerTournamentsController),
    ).toEqual([UserRole.ORGANIZER]);
  });

  it('exposes a createDraft handler', () => {
    expect(typeof OrganizerTournamentsController.prototype.createDraft).toBe(
      'function',
    );
  });

  it('exposes a listOrganizerTournaments handler', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.listOrganizerTournaments,
    ).toBe('function');
  });

  it('exposes a getOrganizerTournamentDetails handler', () => {
    expect(
      typeof OrganizerTournamentsController.prototype
        .getOrganizerTournamentDetails,
    ).toBe('function');
  });

  it('exposes update and delete draft handlers', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.updateTournamentDraft,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.deleteTournamentDraft,
    ).toBe('function');
  });

  it('exposes a tournament cover upload handler', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.uploadTournamentCover,
    ).toBe('function');
  });

  it('exposes online configuration handlers', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.getOnlineConfiguration,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.upsertOnlineConfiguration,
    ).toBe('function');
  });

  it('exposes venue configuration handlers', () => {
    expect(typeof OrganizerTournamentsController.prototype.getVenue).toBe(
      'function',
    );
    expect(typeof OrganizerTournamentsController.prototype.upsertVenue).toBe(
      'function',
    );
  });

  it('exposes gaming-room CRUD handlers', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.listGamingRooms,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.createGamingRoom,
    ).toBe('function');
    expect(typeof OrganizerTournamentsController.prototype.getGamingRoom).toBe(
      'function',
    );
    expect(
      typeof OrganizerTournamentsController.prototype.updateGamingRoom,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.deleteGamingRoom,
    ).toBe('function');
  });

  it('exposes lifecycle action handlers', () => {
    expect(
      typeof OrganizerTournamentsController.prototype.publishTournament,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.openRegistration,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.closeRegistration,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.cancelTournament,
    ).toBe('function');
  });

  it('exposes registration review handlers', () => {
    expect(
      typeof OrganizerTournamentsController.prototype
        .listTournamentRegistrations,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype.getTournamentRegistration,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype
        .approveTournamentRegistration,
    ).toBe('function');
    expect(
      typeof OrganizerTournamentsController.prototype
        .rejectTournamentRegistration,
    ).toBe('function');
  });
});
