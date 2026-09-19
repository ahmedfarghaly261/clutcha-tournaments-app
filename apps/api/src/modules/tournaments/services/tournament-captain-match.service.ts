import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMatchOfficialResultStatus,
  TournamentMatchStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CaptainRegistrationBracketResponseDto } from '../dtos/captain-registration-bracket-response.dto';
import { type CaptainRegistrationInformationResponseDto } from '../dtos/captain-registration-information-response.dto';
import {
  type CaptainMatchListResponseDto,
  type CaptainMatchResponseDto,
} from '../dtos/captain-registration-match-response.dto';
import {
  type CaptainProgressMatchSummaryDto,
  type CaptainRegistrationProgressResponseDto,
} from '../dtos/captain-registration-progress-response.dto';
import {
  type CaptainRegistrationStandingsResponseDto,
  type CaptainStandingItemDto,
} from '../dtos/captain-registration-standings-response.dto';

type CaptainMatchAccessRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainMatchAccessRegistrationSelect;
  }>;

type CaptainInformationRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof captainInformationRegistrationSelect;
  }>;

type CaptainMatchRecord = Prisma.TournamentMatchGetPayload<{
  select: typeof captainMatchSelect;
}>;

type CaptainStandingAccumulator = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  mapsWon: number;
  mapsLost: number;
};

const captainMatchAccessRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  tournament: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainInformationRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  tournament: {
    select: {
      id: true,
      name: true,
      mode: true,
      status: true,
      startsAt: true,
      checkInOpensAt: true,
      checkInRules: true,
      timezone: true,
      onlineConfiguration: {
        select: {
          serverRegion: true,
          connectionRules: true,
          screenshotRequirements: true,
          discordServerUrl: true,
          captainSupportChannel: true,
          matchReportingChannel: true,
          lobbyInstructions: true,
          privateSupportContact: true,
        },
      },
      venue: {
        select: {
          name: true,
          country: true,
          city: true,
          address: true,
          mapUrl: true,
          checkInLocation: true,
          venueRules: true,
          parkingInfo: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const captainMatchSelect = {
  id: true,
  stage: true,
  round: true,
  bracketPosition: true,
  bestOf: true,
  scheduledAt: true,
  teamAId: true,
  teamBId: true,
  winnerTeamId: true,
  status: true,
  teamAScore: true,
  teamBScore: true,
  forfeitStatus: true,
  officialResultStatus: true,
  disputeStatus: true,
  evidenceUrl: true,
  onlineServerInfo: true,
  onsiteStationLabel: true,
  tournament: {
    select: {
      id: true,
      name: true,
      mode: true,
      timezone: true,
    },
  },
  teamA: {
    select: {
      id: true,
      name: true,
    },
  },
  teamB: {
    select: {
      id: true,
      name: true,
    },
  },
  gamingRoom: {
    select: {
      id: true,
      name: true,
    },
  },
  games: {
    orderBy: {
      gameNumber: 'asc',
    },
    select: {
      id: true,
      gameNumber: true,
      mapName: true,
      teamAScore: true,
      teamBScore: true,
      winnerTeamId: true,
      evidenceUrl: true,
    },
  },
} satisfies Prisma.TournamentMatchSelect;

@Injectable()
export class TournamentCaptainMatchService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listCaptainRegistrationMatches(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainMatchListResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: this.toCaptainMatchOwnershipWhere(registration),
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return {
      items: matches.map((match) =>
        this.toCaptainMatchResponse(match, registration.team.id),
      ),
    };
  }

  async getCaptainRegistrationMatch(
    captainId: string,
    registrationId: string,
    matchId: string,
  ): Promise<CaptainMatchResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const match = await this.databaseService.client.tournamentMatch.findFirst({
      where: {
        id: matchId,
        ...this.toCaptainMatchOwnershipWhere(registration),
      },
      select: captainMatchSelect,
    });

    if (!match) {
      throw new NotFoundException('Match was not found for this registration.');
    }

    return this.toCaptainMatchResponse(match, registration.team.id);
  }

  async getCaptainRegistrationProgress(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationProgressResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: this.toCaptainMatchOwnershipWhere(registration),
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationProgress(
      registration,
      matches,
      new Date(),
    );
  }

  async getCaptainRegistrationBracket(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationBracketResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: { tournamentId: registration.tournament.id },
      orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationBracket(registration, matches);
  }

  async getCaptainRegistrationStandings(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationStandingsResponseDto> {
    const registration = await this.findCaptainMatchAccessRegistration(
      captainId,
      registrationId,
    );

    const matches = await this.databaseService.client.tournamentMatch.findMany({
      where: { tournamentId: registration.tournament.id },
      orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'asc' }],
      select: captainMatchSelect,
    });

    return this.toCaptainRegistrationStandings(registration, matches);
  }

  async getCaptainRegistrationInformation(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationInformationResponseDto> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainInformationRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);

    const nextMatch =
      await this.databaseService.client.tournamentMatch.findFirst({
        where: this.toCaptainMatchOwnershipWhere(registration),
        orderBy: [
          { scheduledAt: 'asc' },
          { round: 'asc' },
          { createdAt: 'asc' },
        ],
        select: captainMatchSelect,
      });

    return this.toCaptainRegistrationInformation(
      registration,
      nextMatch,
      new Date(),
    );
  }

  private async findCaptainMatchAccessRegistration(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainMatchAccessRegistrationRecord> {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: {
          id: registrationId,
          captainId,
        },
        select: captainMatchAccessRegistrationSelect,
      });

    if (!registration) {
      throw new NotFoundException('Registration was not found');
    }

    this.assertRegistrationCanAccessHub(registration);

    return registration;
  }

  private toCaptainMatchOwnershipWhere(
    registration:
      | CaptainMatchAccessRegistrationRecord
      | CaptainInformationRegistrationRecord,
  ): Prisma.TournamentMatchWhereInput {
    return {
      tournamentId: registration.tournament.id,
      OR: [
        { teamAId: registration.team.id },
        { teamBId: registration.team.id },
      ],
    };
  }

  private toCaptainMatchResponse(
    match: CaptainMatchRecord,
    captainTeamId: string,
  ): CaptainMatchResponseDto {
    const captainIsTeamA = match.teamAId === captainTeamId;
    const opponent = captainIsTeamA ? match.teamB : match.teamA;
    const captainTeamScore = captainIsTeamA
      ? match.teamAScore
      : match.teamBScore;
    const opponentScore = captainIsTeamA ? match.teamBScore : match.teamAScore;

    return {
      id: match.id,
      tournament: {
        id: match.tournament.id,
        name: match.tournament.name,
        mode: match.tournament.mode,
      },
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition,
      opponent: opponent
        ? { teamId: opponent.id, teamName: opponent.name }
        : null,
      scheduledAt: match.scheduledAt,
      timezone: match.tournament.timezone,
      bestOf: match.bestOf,
      status: match.status,
      captainTeamScore,
      opponentScore,
      mapResults: match.games.map((game) => ({
        id: game.id,
        gameNumber: game.gameNumber,
        mapName: game.mapName,
        captainTeamScore: captainIsTeamA ? game.teamAScore : game.teamBScore,
        opponentScore: captainIsTeamA ? game.teamBScore : game.teamAScore,
        winnerTeamId: game.winnerTeamId,
        evidenceAvailable: Boolean(game.evidenceUrl),
      })),
      winnerTeamId: match.winnerTeamId,
      forfeitStatus: match.forfeitStatus,
      officialResultStatus: match.officialResultStatus,
      evidenceAvailable:
        Boolean(match.evidenceUrl) ||
        match.games.some((game) => Boolean(game.evidenceUrl)),
      disputeStatus: match.disputeStatus,
      onlineServer:
        match.tournament.mode === TournamentMode.ONLINE &&
        match.onlineServerInfo !== null
          ? { onlineServerInfo: match.onlineServerInfo }
          : null,
      onsiteAssignment:
        match.tournament.mode === TournamentMode.ONSITE && match.gamingRoom
          ? {
              gamingRoomId: match.gamingRoom.id,
              roomName: match.gamingRoom.name,
              stationLabel: match.onsiteStationLabel,
            }
          : null,
    };
  }

  private toCaptainRegistrationProgress(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
    now: Date,
  ): CaptainRegistrationProgressResponseDto {
    const officialCompletedMatches = matches.filter((match) =>
      this.isOfficialCompletedCaptainMatch(match),
    );
    const upcomingMatches = matches.filter((match) =>
      this.isUpcomingCaptainMatch(match, now),
    );
    const nextMatch = upcomingMatches.at(0) ?? null;
    const latestOfficialMatch = officialCompletedMatches.at(-1) ?? null;
    const currentSourceMatch = nextMatch ?? latestOfficialMatch;
    const mapsWon = officialCompletedMatches.reduce(
      (total, match) =>
        total +
        match.games.filter((game) => game.winnerTeamId === registration.team.id)
          .length,
      0,
    );
    const mapsLost = officialCompletedMatches.reduce(
      (total, match) =>
        total +
        match.games.filter(
          (game) =>
            game.winnerTeamId !== null &&
            game.winnerTeamId !== registration.team.id,
        ).length,
      0,
    );

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
      },
      currentStage: currentSourceMatch?.stage ?? null,
      currentRound: currentSourceMatch?.round ?? null,
      nextMatch: nextMatch
        ? this.toCaptainProgressMatchSummary(nextMatch, registration.team.id)
        : null,
      upcomingMatches: upcomingMatches.map((match) =>
        this.toCaptainProgressMatchSummary(match, registration.team.id),
      ),
      wins: officialCompletedMatches.filter(
        (match) => match.winnerTeamId === registration.team.id,
      ).length,
      losses: officialCompletedMatches.filter(
        (match) =>
          match.winnerTeamId !== null &&
          match.winnerTeamId !== registration.team.id,
      ).length,
      matchesPlayed: officialCompletedMatches.length,
      matchesRemaining: upcomingMatches.length,
      officialScoreSummary: {
        matchesWithOfficialResults: officialCompletedMatches.length,
        mapsWon,
        mapsLost,
      },
      placement: null,
      qualificationState: null,
    };
  }

  private toCaptainRegistrationBracket(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
  ): CaptainRegistrationBracketResponseDto {
    const stages = new Map<
      string,
      CaptainRegistrationBracketResponseDto['stages'][number]
    >();

    matches.forEach((match) => {
      const existingStage = stages.get(match.stage) ?? {
        stage: match.stage,
        matches: [],
      };

      existingStage.matches.push({
        id: match.id,
        stage: match.stage,
        round: match.round,
        bracketPosition: match.bracketPosition,
        scheduledAt: match.scheduledAt,
        status: match.status,
        teamA: match.teamA
          ? {
              id: match.teamA.id,
              name: match.teamA.name,
              isCaptainTeam: match.teamA.id === registration.team.id,
            }
          : null,
        teamB: match.teamB
          ? {
              id: match.teamB.id,
              name: match.teamB.name,
              isCaptainTeam: match.teamB.id === registration.team.id,
            }
          : null,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        winnerTeamId: match.winnerTeamId,
        officialResultStatus: match.officialResultStatus,
      });
      stages.set(match.stage, existingStage);
    });

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
      },
      captainTeamId: registration.team.id,
      stages: Array.from(stages.values()),
    };
  }

  private toCaptainRegistrationStandings(
    registration: CaptainMatchAccessRegistrationRecord,
    matches: CaptainMatchRecord[],
  ): CaptainRegistrationStandingsResponseDto {
    const standings = new Map<string, CaptainStandingAccumulator>();
    const officialCompletedMatches = matches.filter((match) =>
      this.isOfficialCompletedCaptainMatch(match),
    );

    matches.forEach((match) => {
      this.ensureStandingTeam(standings, match.teamA);
      this.ensureStandingTeam(standings, match.teamB);
    });

    officialCompletedMatches.forEach((match) => {
      if (!match.teamA || !match.teamB || !match.winnerTeamId) {
        return;
      }

      const teamAStanding = this.ensureStandingTeam(standings, match.teamA);
      const teamBStanding = this.ensureStandingTeam(standings, match.teamB);
      const teamAMapsWon = match.games.filter(
        (game) => game.winnerTeamId === match.teamAId,
      ).length;
      const teamBMapsWon = match.games.filter(
        (game) => game.winnerTeamId === match.teamBId,
      ).length;

      teamAStanding.matchesPlayed += 1;
      teamBStanding.matchesPlayed += 1;
      teamAStanding.mapsWon += teamAMapsWon;
      teamAStanding.mapsLost += teamBMapsWon;
      teamBStanding.mapsWon += teamBMapsWon;
      teamBStanding.mapsLost += teamAMapsWon;

      if (match.winnerTeamId === match.teamAId) {
        teamAStanding.wins += 1;
        teamBStanding.losses += 1;
      } else if (match.winnerTeamId === match.teamBId) {
        teamBStanding.wins += 1;
        teamAStanding.losses += 1;
      }
    });

    const items = Array.from(standings.values())
      .sort((left, right) => this.compareCaptainStandings(left, right))
      .map((standing, index): CaptainStandingItemDto => ({
        rank: index + 1,
        team: {
          id: standing.teamId,
          name: standing.teamName,
          isCaptainTeam: standing.teamId === registration.team.id,
        },
        wins: standing.wins,
        losses: standing.losses,
        matchesPlayed: standing.matchesPlayed,
        mapsWon: standing.mapsWon,
        mapsLost: standing.mapsLost,
        mapDifferential: standing.mapsWon - standing.mapsLost,
      }));

    return {
      registrationId: registration.id,
      tournamentId: registration.tournament.id,
      tournamentName: registration.tournament.name,
      captainTeamId: registration.team.id,
      officialResultsOnly: true,
      items,
    };
  }

  private toCaptainRegistrationInformation(
    registration: CaptainInformationRegistrationRecord,
    nextMatch: CaptainMatchRecord | null,
    now: Date,
  ): CaptainRegistrationInformationResponseDto {
    const lobbyInformationReleasesAt = new Date(
      registration.tournament.startsAt.getTime() - 24 * 60 * 60 * 1000,
    );
    const lobbyInformationReleased =
      now >= lobbyInformationReleasesAt ||
      registration.tournament.status === TournamentStatus.CHECK_IN_OPEN ||
      registration.tournament.status === TournamentStatus.IN_PROGRESS;

    return {
      registrationId: registration.id,
      tournament: {
        id: registration.tournament.id,
        name: registration.tournament.name,
        mode: registration.tournament.mode,
        timezone: registration.tournament.timezone,
      },
      releaseGate: {
        lobbyInformationReleased,
        lobbyInformationReleasesAt,
      },
      checkInInstructions: registration.tournament.checkInRules,
      onlineInformation: registration.tournament.onlineConfiguration
        ? {
            serverRegion:
              registration.tournament.onlineConfiguration.serverRegion,
            connectionRules:
              registration.tournament.onlineConfiguration.connectionRules,
            tournamentDiscordInvitation:
              registration.tournament.onlineConfiguration.discordServerUrl,
            captainSupportChannel:
              registration.tournament.onlineConfiguration.captainSupportChannel,
            matchReportingChannel:
              registration.tournament.onlineConfiguration.matchReportingChannel,
            technicalSupportInstructions:
              registration.tournament.onlineConfiguration
                .screenshotRequirements,
            organizerSupportContact:
              registration.tournament.onlineConfiguration.privateSupportContact,
            lobbyInformation: lobbyInformationReleased
              ? registration.tournament.onlineConfiguration.lobbyInstructions
              : null,
            nextMatchServerInformation:
              lobbyInformationReleased &&
              nextMatch !== null &&
              nextMatch.onlineServerInfo !== null
                ? nextMatch.onlineServerInfo
                : null,
          }
        : null,
      venueInformation: registration.tournament.venue
        ? {
            name: registration.tournament.venue.name,
            country: registration.tournament.venue.country,
            city: registration.tournament.venue.city,
            address: registration.tournament.venue.address,
            mapUrl: registration.tournament.venue.mapUrl,
            checkInLocation: registration.tournament.venue.checkInLocation,
            venueInstructions: registration.tournament.venue.venueRules,
            parkingInfo: registration.tournament.venue.parkingInfo,
            arrivalTime:
              registration.tournament.checkInOpensAt ??
              registration.tournament.startsAt,
            assignedRoomId: nextMatch?.gamingRoom?.id ?? null,
            assignedRoomName: nextMatch?.gamingRoom?.name ?? null,
            assignedStation: nextMatch?.onsiteStationLabel ?? null,
          }
        : null,
    };
  }

  private assertRegistrationCanAccessHub(
    registration:
      | CaptainMatchAccessRegistrationRecord
      | CaptainInformationRegistrationRecord,
  ): void {
    if (registration.approvalStatus !== RegistrationApprovalStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved registrations can access the tournament hub.',
      );
    }

    if (
      registration.status !== TournamentRegistrationStatus.CONFIRMED &&
      registration.status !== TournamentRegistrationStatus.CHECKED_IN
    ) {
      throw new ForbiddenException(
        'Registration status does not allow tournament hub access.',
      );
    }

    if (
      registration.paymentStatus !==
        RegistrationPaymentStatus.PROOF_SUBMITTED &&
      registration.paymentStatus !== RegistrationPaymentStatus.VERIFIED &&
      registration.paymentStatus !== RegistrationPaymentStatus.NOT_REQUIRED
    ) {
      throw new ForbiddenException(
        'Registration payment must be completed before accessing the tournament hub.',
      );
    }
  }

  private ensureStandingTeam(
    standings: Map<string, CaptainStandingAccumulator>,
    team: CaptainMatchRecord['teamA'],
  ): CaptainStandingAccumulator {
    if (!team) {
      return {
        teamId: '',
        teamName: '',
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        mapsWon: 0,
        mapsLost: 0,
      };
    }

    const existing = standings.get(team.id);
    if (existing) {
      return existing;
    }

    const created: CaptainStandingAccumulator = {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mapsWon: 0,
      mapsLost: 0,
    };
    standings.set(team.id, created);
    return created;
  }

  private compareCaptainStandings(
    left: CaptainStandingAccumulator,
    right: CaptainStandingAccumulator,
  ): number {
    const leftMapDifferential = left.mapsWon - left.mapsLost;
    const rightMapDifferential = right.mapsWon - right.mapsLost;

    return (
      right.wins - left.wins ||
      left.losses - right.losses ||
      rightMapDifferential - leftMapDifferential ||
      right.mapsWon - left.mapsWon ||
      left.teamName.localeCompare(right.teamName)
    );
  }

  private toCaptainProgressMatchSummary(
    match: CaptainMatchRecord,
    captainTeamId: string,
  ): CaptainProgressMatchSummaryDto {
    const opponent =
      match.teamAId === captainTeamId ? match.teamB : match.teamA;

    return {
      id: match.id,
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition,
      opponent: opponent
        ? { teamId: opponent.id, teamName: opponent.name }
        : null,
      scheduledAt: match.scheduledAt,
      status: match.status,
    };
  }

  private isOfficialCompletedCaptainMatch(match: CaptainMatchRecord): boolean {
    return (
      match.officialResultStatus ===
        TournamentMatchOfficialResultStatus.CONFIRMED &&
      (match.status === TournamentMatchStatus.COMPLETED ||
        match.status === TournamentMatchStatus.FORFEIT)
    );
  }

  private isUpcomingCaptainMatch(
    match: CaptainMatchRecord,
    now: Date,
  ): boolean {
    if (
      match.status !== TournamentMatchStatus.SCHEDULED &&
      match.status !== TournamentMatchStatus.LIVE &&
      match.status !== TournamentMatchStatus.POSTPONED
    ) {
      return false;
    }

    return match.scheduledAt === null || match.scheduledAt >= now;
  }
}
