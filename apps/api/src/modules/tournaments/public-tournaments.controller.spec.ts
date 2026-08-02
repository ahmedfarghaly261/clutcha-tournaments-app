import 'reflect-metadata';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { PublicTournamentsController } from './public-tournaments.controller';

jest.mock('@clutcha/database', () => ({
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
});
