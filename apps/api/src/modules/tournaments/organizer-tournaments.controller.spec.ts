import 'reflect-metadata';
import { UserRole } from '@clutcha/database';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';

jest.mock('@clutcha/database', () => ({
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
});
