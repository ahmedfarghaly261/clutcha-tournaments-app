import { ForbiddenException } from '@nestjs/common';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { TournamentCaptainMatchService } from '../services/tournament-captain-match.service';

jest.mock('@clutcha/database', () => ({
  RegistrationApprovalStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    AWAITING_PROOF: 'AWAITING_PROOF',
    PROOF_SUBMITTED: 'PROOF_SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    REFUNDED: 'REFUNDED',
  },
  TournamentMatchOfficialResultStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    VOIDED: 'VOIDED',
  },
  TournamentMatchStatus: {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    POSTPONED: 'POSTPONED',
    COMPLETED: 'COMPLETED',
    FORFEIT: 'FORFEIT',
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
    WITHDRAWN: 'WITHDRAWN',
    CHECKED_IN: 'CHECKED_IN',
    DISQUALIFIED: 'DISQUALIFIED',
    REFUNDED: 'REFUNDED',
  },
  TournamentStatus: {
    REGISTRATION_OPEN: 'REGISTRATION_OPEN',
    CHECK_IN_OPEN: 'CHECK_IN_OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  },
}));

describe('TournamentCaptainMatchService', () => {
  const captainId = 'captain-1';
  const registrationId = 'registration-1';
  const tournamentId = 'tournament-1';
  const captainTeamId = 'team-captain';
  const opponentTeamId = 'team-opponent';
  const thirdTeamId = 'team-third';
  const futureMatchDate = new Date('2030-02-02T18:00:00.000Z');

  let service: TournamentCaptainMatchService;
  let registrationFindFirst: jest.Mock;
  let matchFindMany: jest.Mock;
  let matchFindFirst: jest.Mock;

  const accessRegistration = (overrides: Record<string, unknown> = {}) => ({
    id: registrationId,
    status: TournamentRegistrationStatus.CONFIRMED,
    paymentStatus: RegistrationPaymentStatus.NOT_REQUIRED,
    approvalStatus: RegistrationApprovalStatus.APPROVED,
    team: { id: captainTeamId, name: 'Cairo Titans' },
    tournament: {
      id: tournamentId,
      name: 'Alpha Cup',
      status: TournamentStatus.IN_PROGRESS,
    },
    ...overrides,
  });

  const informationRegistration = (
    overrides: Record<string, unknown> = {},
  ) => ({
    ...accessRegistration(),
    tournament: {
      id: tournamentId,
      name: 'Alpha Cup',
      mode: TournamentMode.ONLINE,
      status: TournamentStatus.REGISTRATION_OPEN,
      startsAt: new Date('2030-02-03T18:00:00.000Z'),
      checkInOpensAt: new Date('2030-02-03T16:00:00.000Z'),
      checkInRules: 'Check in 30 minutes before your match.',
      timezone: 'Africa/Cairo',
      onlineConfiguration: {
        serverRegion: 'EU West',
        connectionRules: 'Use the assigned lobby.',
        screenshotRequirements: 'Upload the final scoreboard.',
        discordServerUrl: 'https://discord.gg/clutcha',
        captainSupportChannel: '#captain-support',
        matchReportingChannel: '#match-reporting',
        lobbyInstructions: 'Lobby code: ALPHA-123.',
        privateSupportContact: 'support@example.com',
      },
      venue: null,
    },
    ...overrides,
  });

  const match = (overrides: Record<string, unknown> = {}) => ({
    id: 'match-1',
    stage: 'GROUP_STAGE',
    round: 1,
    bracketPosition: 'A1',
    bestOf: 3,
    scheduledAt: futureMatchDate,
    teamAId: captainTeamId,
    teamBId: opponentTeamId,
    winnerTeamId: null,
    status: TournamentMatchStatus.SCHEDULED,
    teamAScore: null,
    teamBScore: null,
    forfeitStatus: 'NONE',
    officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
    disputeStatus: 'NONE',
    evidenceUrl: null,
    onlineServerInfo: { lobbyId: 'private-lobby-1' },
    onsiteStationLabel: null,
    tournament: {
      id: tournamentId,
      name: 'Alpha Cup',
      mode: TournamentMode.ONLINE,
      timezone: 'Africa/Cairo',
    },
    teamA: { id: captainTeamId, name: 'Cairo Titans' },
    teamB: { id: opponentTeamId, name: 'Alex Falcons' },
    gamingRoom: null,
    games: [
      {
        id: 'game-1',
        gameNumber: 1,
        mapName: 'Bind',
        teamAScore: null,
        teamBScore: null,
        winnerTeamId: null,
        evidenceUrl: null,
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    registrationFindFirst = jest.fn().mockResolvedValue(accessRegistration());
    matchFindMany = jest.fn().mockResolvedValue([match()]);
    matchFindFirst = jest.fn().mockResolvedValue(match());

    service = new TournamentCaptainMatchService({
      client: {
        tournamentRegistration: { findFirst: registrationFindFirst },
        tournamentMatch: {
          findMany: matchFindMany,
          findFirst: matchFindFirst,
        },
      },
    } as unknown as DatabaseService);
  });

  it('lists owned matches and normalizes the captain perspective', async () => {
    const result = await service.listCaptainRegistrationMatches(
      captainId,
      registrationId,
    );

    expect(result.items[0]).toMatchObject({
      id: 'match-1',
      opponent: { teamId: opponentTeamId, teamName: 'Alex Falcons' },
      captainTeamScore: null,
      opponentScore: null,
      onlineServer: { onlineServerInfo: { lobbyId: 'private-lobby-1' } },
    });
    expect(result.items[0]?.mapResults[0]).toMatchObject({
      captainTeamScore: null,
      opponentScore: null,
    });
    expect(matchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tournamentId,
          OR: [{ teamAId: captainTeamId }, { teamBId: captainTeamId }],
        },
      }),
    );
  });

  it('normalizes scores and map results when the captain is team B', async () => {
    matchFindFirst.mockResolvedValueOnce(
      match({
        teamAId: opponentTeamId,
        teamBId: captainTeamId,
        teamAScore: 1,
        teamBScore: 2,
        winnerTeamId: captainTeamId,
        status: TournamentMatchStatus.COMPLETED,
        officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
        evidenceUrl: 'https://example.com/match-proof',
        games: [
          {
            id: 'game-1',
            gameNumber: 1,
            mapName: 'Bind',
            teamAScore: 9,
            teamBScore: 13,
            winnerTeamId: captainTeamId,
            evidenceUrl: 'https://example.com/game-proof',
          },
        ],
      }),
    );

    const result = await service.getCaptainRegistrationMatch(
      captainId,
      registrationId,
      'match-1',
    );

    expect(result).toMatchObject({
      captainTeamScore: 2,
      opponentScore: 1,
      winnerTeamId: captainTeamId,
      evidenceAvailable: true,
    });
    expect(result.mapResults[0]).toMatchObject({
      captainTeamScore: 13,
      opponentScore: 9,
      winnerTeamId: captainTeamId,
      evidenceAvailable: true,
    });
  });

  it('returns progress from official completed matches and future matches', async () => {
    const completedMatch = match({
      id: 'match-completed',
      scheduledAt: new Date('2030-02-01T18:00:00.000Z'),
      status: TournamentMatchStatus.COMPLETED,
      teamAScore: 2,
      teamBScore: 1,
      winnerTeamId: captainTeamId,
      officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
      games: [
        {
          id: 'game-1',
          gameNumber: 1,
          mapName: 'Bind',
          teamAScore: 13,
          teamBScore: 8,
          winnerTeamId: captainTeamId,
          evidenceUrl: null,
        },
        {
          id: 'game-2',
          gameNumber: 2,
          mapName: 'Ascent',
          teamAScore: 10,
          teamBScore: 13,
          winnerTeamId: opponentTeamId,
          evidenceUrl: null,
        },
      ],
    });
    const upcomingMatch = match({
      id: 'match-upcoming',
      round: 2,
      bracketPosition: 'A2',
      scheduledAt: futureMatchDate,
    });
    matchFindMany.mockResolvedValueOnce([completedMatch, upcomingMatch]);

    const result = await service.getCaptainRegistrationProgress(
      captainId,
      registrationId,
    );

    expect(result).toMatchObject({
      currentStage: 'GROUP_STAGE',
      currentRound: 2,
      nextMatch: { id: 'match-upcoming', opponent: { teamId: opponentTeamId } },
      wins: 1,
      losses: 0,
      matchesPlayed: 1,
      matchesRemaining: 1,
      officialScoreSummary: {
        matchesWithOfficialResults: 1,
        mapsWon: 1,
        mapsLost: 1,
      },
    });
  });

  it('builds bracket stages and official-only standings', async () => {
    const completedMatch = match({
      id: 'match-completed',
      status: TournamentMatchStatus.COMPLETED,
      teamAScore: 2,
      teamBScore: 1,
      winnerTeamId: captainTeamId,
      officialResultStatus: TournamentMatchOfficialResultStatus.CONFIRMED,
      games: [
        {
          id: 'game-1',
          gameNumber: 1,
          mapName: 'Bind',
          teamAScore: 13,
          teamBScore: 8,
          winnerTeamId: captainTeamId,
          evidenceUrl: null,
        },
        {
          id: 'game-2',
          gameNumber: 2,
          mapName: 'Ascent',
          teamAScore: 13,
          teamBScore: 10,
          winnerTeamId: captainTeamId,
          evidenceUrl: null,
        },
      ],
    });
    const pendingMatch = match({
      id: 'match-pending',
      teamAId: opponentTeamId,
      teamBId: thirdTeamId,
      teamA: { id: opponentTeamId, name: 'Alex Falcons' },
      teamB: { id: thirdTeamId, name: 'Giza Guardians' },
      officialResultStatus: TournamentMatchOfficialResultStatus.PENDING,
    });
    matchFindMany
      .mockResolvedValueOnce([completedMatch, pendingMatch])
      .mockResolvedValueOnce([completedMatch, pendingMatch]);

    const bracket = await service.getCaptainRegistrationBracket(
      captainId,
      registrationId,
    );
    const standings = await service.getCaptainRegistrationStandings(
      captainId,
      registrationId,
    );

    expect(bracket.stages).toHaveLength(1);
    expect(bracket.stages[0]?.matches[0]).toMatchObject({
      id: 'match-completed',
      teamA: { id: captainTeamId, isCaptainTeam: true },
      teamB: { id: opponentTeamId, isCaptainTeam: false },
    });
    expect(standings).toMatchObject({
      officialResultsOnly: true,
      captainTeamId,
    });
    expect(standings.items[0]).toMatchObject({
      rank: 1,
      team: { id: captainTeamId, isCaptainTeam: true },
      wins: 1,
      losses: 0,
      matchesPlayed: 1,
      mapsWon: 2,
      mapsLost: 0,
      mapDifferential: 2,
    });
    expect(standings.items).toHaveLength(3);
  });

  it('gates lobby data until release and returns next-match server data afterward', async () => {
    registrationFindFirst.mockResolvedValueOnce(informationRegistration());
    const beforeRelease = await service.getCaptainRegistrationInformation(
      captainId,
      registrationId,
    );

    expect(beforeRelease.releaseGate.lobbyInformationReleased).toBe(false);
    expect(beforeRelease.onlineInformation).toMatchObject({
      serverRegion: 'EU West',
      lobbyInformation: null,
      nextMatchServerInformation: null,
    });

    registrationFindFirst.mockResolvedValueOnce(
      informationRegistration({
        tournament: {
          ...informationRegistration().tournament,
          status: TournamentStatus.CHECK_IN_OPEN,
        },
      }),
    );
    const afterRelease = await service.getCaptainRegistrationInformation(
      captainId,
      registrationId,
    );

    expect(afterRelease.releaseGate.lobbyInformationReleased).toBe(true);
    expect(afterRelease.onlineInformation).toMatchObject({
      lobbyInformation: 'Lobby code: ALPHA-123.',
      nextMatchServerInformation: { lobbyId: 'private-lobby-1' },
    });
  });

  it('blocks pending or unpaid registrations from captain match views', async () => {
    registrationFindFirst.mockResolvedValueOnce(
      accessRegistration({
        approvalStatus: RegistrationApprovalStatus.PENDING,
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        paymentStatus: RegistrationPaymentStatus.AWAITING_PROOF,
      }),
    );

    await expect(
      service.listCaptainRegistrationMatches(captainId, registrationId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(matchFindMany).not.toHaveBeenCalled();
  });
});
